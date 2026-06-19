import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
  FlatList,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import {
  parseOFX,
  isValidOFX,
  OFXStatement,
  detectCategory,
} from "@/lib/ofxParser";
import { Upload, CheckCircle, AlertCircle } from "lucide-react-native";

interface ImportProgress {
  status: "idle" | "loading" | "success" | "error";
  message: string;
  imported: number;
  total: number;
}

export function OFXImporter() {
  const { member, family } = useAuthStore();
  const [progress, setProgress] = useState<ImportProgress>({
    status: "idle",
    message: "",
    imported: 0,
    total: 0,
  });
  const [statement, setStatement] = useState<OFXStatement | null>(null);

  // Selecionar arquivo
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["*/*"],
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Validar extensão
        const ext = asset.name.split(".").pop()?.toLowerCase();
        const SUPPORTED_EXTS = ["ofx", "txt", "csv", "xlsx", "xls"];

        if (!ext || !SUPPORTED_EXTS.includes(ext)) {
          Alert.alert(
            "Erro",
            `Formato não suportado. Use: ${SUPPORTED_EXTS.join(", ")}`,
          );
          return;
        }

        await processOFXFile(asset.uri);
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao selecionar arquivo");
      console.error(error);
    }
  };

  // Processar arquivo OFX
  const processOFXFile = async (fileUri: string) => {
    try {
      setProgress({
        status: "loading",
        message: "Lendo arquivo...",
        imported: 0,
        total: 0,
      });

      // Ler conteúdo do arquivo
      const response = await fetch(fileUri);
      const content = await response.text();

      // Validar OFX
      if (!isValidOFX(content)) {
        setProgress({
          status: "error",
          message: "Arquivo OFX inválido",
          imported: 0,
          total: 0,
        });
        return;
      }

      // Parse OFX
      const parsed = parseOFX(content);
      if (!parsed) {
        setProgress({
          status: "error",
          message: "Erro ao processar arquivo OFX",
          imported: 0,
          total: 0,
        });
        return;
      }

      setStatement(parsed);
      setProgress({
        status: "idle",
        message: `${parsed.transactions.length} transações encontradas`,
        imported: 0,
        total: parsed.transactions.length,
      });
    } catch (error) {
      setProgress({
        status: "error",
        message: `Erro: ${error instanceof Error ? error.message : "Desconhecido"}`,
        imported: 0,
        total: 0,
      });
      console.error(error);
    }
  };

  // Importar transações para o banco
  const handleImport = async () => {
    if (!statement || !member?.family_id) {
      Alert.alert("Erro", "Família não selecionada ou arquivo vazio");
      return;
    }

    try {
      setProgress({
        status: "loading",
        message: "Importando transações...",
        imported: 0,
        total: statement.transactions.length,
      });

      // 1. Verificar/Criar conta bancária
      let accountId: string | null = null;
      const { data: existingAccount } = await supabase
        .from("accounts")
        .select("id")
        .eq("account_number", statement.accountNumber)
        .eq("family_id", member.family_id)
        .single();

      if (existingAccount) {
        accountId = existingAccount.id;
      } else {
        // Criar nova conta
        const { data: newAccount, error: accountError } = await supabase
          .from("accounts")
          .insert({
            family_id: member.family_id,
            member_id: member.id,
            name: `${statement.accountType === "CHECKING" ? "Corrente" : "Poupança"} - ${statement.accountNumber}`,
            type:
              statement.accountType === "CHECKING" ? "corrente" : "poupanca",
            bank: getBankName(statement.bankId),
            account_number: statement.accountNumber,
            balance: statement.balance,
            icon: getBankIcon(statement.bankId),
            color: "#FF6B1A",
          })
          .select("id")
          .single();

        if (accountError) throw accountError;
        accountId = newAccount?.id;
      }

      // 2. Inserir transações
      const transactionsToInsert = statement.transactions.map((trn) => ({
        family_id: member.family_id,
        account_id: accountId,
        member_id: member.id,
        date: trn.date,
        description: trn.description,
        amount: trn.amount,
        type: trn.type,
        category_id: detectCategory(trn.description),
        note: `[${trn.transactionType.toUpperCase()}] ${trn.description}`,
      }));

      // Inserir em lotes de 100
      for (let i = 0; i < transactionsToInsert.length; i += 100) {
        const batch = transactionsToInsert.slice(i, i + 100);
        const { error } = await supabase.from("transactions").insert(batch);

        if (error) {
          console.warn(`Erro ao inserir lote ${i / 100 + 1}:`, error);
        }

        setProgress((prev) => ({
          ...prev,
          imported: Math.min(i + 100, transactionsToInsert.length),
        }));
      }

      setProgress({
        status: "success",
        message: `✅ ${transactionsToInsert.length} transações importadas com sucesso!`,
        imported: transactionsToInsert.length,
        total: transactionsToInsert.length,
      });

      // Limpar após 3 segundos
      setTimeout(() => {
        setStatement(null);
        setProgress({ status: "idle", message: "", imported: 0, total: 0 });
      }, 3000);
    } catch (error) {
      setProgress({
        status: "error",
        message: `Erro na importação: ${error instanceof Error ? error.message : "Desconhecido"}`,
        imported: 0,
        total: 0,
      });
      console.error(error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <View className="gap-4">
        {/* Header */}
        <View>
          <Text className="text-2xl font-bold text-white mb-1">
            Importar Extrato
          </Text>
          <Text className="text-neutral-400">
            Carregue seu arquivo OFX do banco
          </Text>
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          onPress={handlePickDocument}
          disabled={progress.status === "loading"}
          className="bg-primary rounded-xl p-4 flex-row items-center justify-center gap-2"
          style={{ opacity: progress.status === "loading" ? 0.5 : 1 }}
        >
          {progress.status === "loading" ? (
            <ActivityIndicator color="white" />
          ) : (
            <Upload color="white" size={20} />
          )}
          <Text className="text-white font-semibold">
            {progress.status === "loading"
              ? "Processando..."
              : "Selecionar Arquivo OFX"}
          </Text>
        </TouchableOpacity>

        {/* Status Message */}
        {progress.message && (
          <View
            className="rounded-xl p-3 flex-row items-start gap-2"
            style={{
              backgroundColor:
                progress.status === "success"
                  ? "rgba(34,197,94,0.1)"
                  : progress.status === "error"
                    ? "rgba(244,67,54,0.1)"
                    : "rgba(255,107,26,0.1)",
            }}
          >
            {progress.status === "success" && (
              <CheckCircle color="#22C55E" size={20} />
            )}
            {progress.status === "error" && (
              <AlertCircle color="#F44336" size={20} />
            )}
            <Text
              className={
                progress.status === "success"
                  ? "text-green-400 flex-1"
                  : progress.status === "error"
                    ? "text-red-400 flex-1"
                    : "text-primary flex-1"
              }
            >
              {progress.message}
            </Text>
          </View>
        )}

        {/* Progress Bar */}
        {progress.total > 0 && progress.status === "loading" && (
          <View>
            <View className="h-2 bg-neutral-700 rounded-full overflow-hidden">
              <View
                className="bg-primary h-full"
                style={{
                  width: `${(progress.imported / progress.total) * 100}%`,
                }}
              />
            </View>
            <Text className="text-neutral-400 text-xs mt-2">
              {progress.imported} de {progress.total} transações
            </Text>
          </View>
        )}

        {/* Statement Summary */}
        {statement && (
          <View className="bg-neutral-800 rounded-xl p-4 gap-3">
            <Text className="text-white font-semibold text-lg">
              Resumo do Extrato
            </Text>

            <View className="gap-2">
              <Row label="Banco" value={getBankName(statement.bankId)} />
              <Row label="Conta" value={statement.accountNumber} />
              <Row label="Tipo" value={statement.accountType} />
              <Row
                label="Período"
                value={`${statement.startDate} a ${statement.endDate}`}
              />
              <Row
                label="Saldo"
                value={`R$ ${statement.balance.toFixed(2)}`}
                highlight={statement.balance >= 0}
              />
              <Row
                label="Transações"
                value={statement.transactions.length.toString()}
              />
            </View>

            {/* Transações Preview */}
            <View className="mt-4 border-t border-neutral-700 pt-4">
              <Text className="text-white font-semibold mb-2">
                Transações ({statement.transactions.length})
              </Text>
              <FlatList
                scrollEnabled={false}
                data={statement.transactions.slice(0, 5)}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item }) => (
                  <View className="flex-row justify-between py-1 border-b border-neutral-700">
                    <Text className="text-neutral-300 flex-1 text-xs">
                      {item.description.substring(0, 30)}
                    </Text>
                    <Text
                      className={
                        item.type === "income"
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {item.type === "income" ? "+" : "-"} R${" "}
                      {item.amount.toFixed(2)}
                    </Text>
                  </View>
                )}
              />
              {statement.transactions.length > 5 && (
                <Text className="text-neutral-400 text-xs mt-2">
                  +{statement.transactions.length - 5} mais...
                </Text>
              )}
            </View>

            {/* Import Button */}
            <TouchableOpacity
              onPress={handleImport}
              disabled={progress.status === "loading"}
              className="bg-green-600 rounded-lg p-3 mt-2"
              style={{ opacity: progress.status === "loading" ? 0.5 : 1 }}
            >
              <Text className="text-white font-semibold text-center">
                Confirmar Importação
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// Componentes auxiliares
function Row({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-neutral-400">{label}</Text>
      <Text
        className={highlight ? "text-green-400 font-semibold" : "text-white"}
      >
        {value}
      </Text>
    </View>
  );
}

// Banco de dados de bancos
function getBankName(bankId: string): string {
  const banks: { [key: string]: string } = {
    "001": "Banco do Brasil",
    "033": "Santander",
    "104": "Caixa Econômica",
    "341": "Itaú",
    "356": "Real",
    "637": "Sofisa",
    "655": "Neon",
    "260": "Nu Pagamentos",
  };
  return banks[bankId] || `Banco ${bankId}`;
}

function getBankIcon(bankId: string): string {
  const icons: { [key: string]: string } = {
    "001": "🏦",
    "033": "🏢",
    "104": "🏛️",
    "341": "🎯",
    "356": "🌟",
    "637": "💼",
    "655": "🚀",
    "260": "🟣",
  };
  return icons[bankId] || "🏦";
}
