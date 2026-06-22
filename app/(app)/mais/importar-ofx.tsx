import React, { useState, useCallback } from "react";
import { View, Pressable, ActivityIndicator, Alert, ScrollView } from "react-native";
import { Text } from "@/components/ui/Text";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Upload, CheckCircle2, AlertCircle, X, ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { parseOFX, isValidOFX, OFXTransaction } from "@/lib/ofxParser";
import { getBankInfo } from "@/lib/bankDatabase";
import { formatCurrency } from "@/lib/format";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { accountService } from "@/services/supabase/accountService";
import { transactionService } from "@/services/supabase/transactionService";
import type { CreateTransactionDTO } from "@/types";

type ImportStatus = "idle" | "parsed" | "importing" | "success" | "error";

export default function ImportarOFXScreen() {
  const { member } = useAuthStore();
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: string } | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<OFXTransaction[]>([]);
  const [bankName, setBankName] = useState("");
  const [bankColor, setBankColor] = useState("#FF6B1A");
  const [bankIcon, setBankIcon] = useState("🏦");
  const [accountNumber, setAccountNumber] = useState("");
  const [period, setPeriod] = useState("");
  const [balance, setBalance] = useState(0);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [importedCount, setImportedCount] = useState(0);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["*/*"] });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const ext = asset.name.split(".").pop()?.toLowerCase();
      if (!ext || !["ofx", "txt"].includes(ext)) {
        Alert.alert("Formato inválido", "Selecione um arquivo .ofx ou .txt exportado do seu banco.");
        return;
      }

      setLoading(true);
      const content = await fetch(asset.uri).then((r) => r.text());

      if (!isValidOFX(content)) {
        Alert.alert("Arquivo inválido", "Este arquivo não contém dados OFX válidos.");
        setLoading(false);
        return;
      }

      const parsed = parseOFX(content);
      if (!parsed || parsed.transactions.length === 0) {
        Alert.alert("Sem transações", "Nenhuma transação encontrada no arquivo.");
        setLoading(false);
        return;
      }

      const info = getBankInfo(parsed.bankId);
      setBankName(info.name);
      setBankColor(info.color);
      setBankIcon(info.icon);
      setAccountNumber(parsed.accountNumber);
      setPeriod(`${parsed.startDate} a ${parsed.endDate}`);
      setBalance(parsed.balance);
      setParsedTransactions(parsed.transactions);
      setSelectedFile({ name: asset.name, content });
      setStatus("parsed");

      if (member?.family_id) {
        const existingIds = await transactionService.checkDuplicateFitIds(
          member.family_id,
          parsed.transactions.map((t) => t.fitId)
        );
        setDuplicateCount(existingIds.size);
      }
    } catch {
      Alert.alert("Erro", "Falha ao processar arquivo.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!member?.family_id || parsedTransactions.length === 0) return;

    try {
      setStatus("importing");
      setProgress(0);

      // 1. Find or create account
      const accountId = await accountService.findOrCreateForOFX({
        familyId: member.family_id,
        memberId: member.id,
        accountNumber,
        bankName,
        bankIcon,
        bankColor,
        balance,
      });

      // 2. Check duplicates
      const existingFitIds = await transactionService.checkDuplicateFitIds(
        member.family_id,
        parsedTransactions.map((t) => t.fitId)
      );

      const newTx: CreateTransactionDTO[] = parsedTransactions
        .filter((t) => !existingFitIds.has(t.fitId))
        .map((t) => ({
          family_id: member.family_id,
          member_id: member.id,
          member_name: member.name,
          account_id: accountId,
          type: t.type,
          amount: Math.abs(t.amount),
          description: t.memo || t.description,
          category: t.category_id || "Outros",
          date: t.date.split("T")[0],
          note: `[FITID:${t.fitId}]`,
        }));

      if (newTx.length === 0) {
        setStatus("success");
        setImportedCount(0);
        setDuplicateCount(parsedTransactions.length);
        Alert.alert("Nenhuma novidade", "Todas as transações já foram importadas.");
        return;
      }

      // 3. Batch insert
      const inserted = await transactionService.insertBatch(newTx, (p) => setProgress(p));
      setImportedCount(inserted);
      setDuplicateCount(parsedTransactions.length - inserted);
      setStatus("success");
    } catch {
      setStatus("error");
      Alert.alert("Erro", "Falha ao importar transações.");
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setParsedTransactions([]);
    setStatus("idle");
    setProgress(0);
  };

  return (
    <Screen title="Importar Extrato OFX" subtitle="Importe transações diretamente do extrato bancário.">
      <View className="px-5">
        {status === "idle" && (
          <Card variant="bordered" style={{ alignItems: "center", paddingVertical: 40, gap: 16 }}>
            <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: "rgba(255,107,26,0.12)" }}>
              {loading ? <ActivityIndicator color="#FF6B1A" /> : <Upload size={28} color="#FF6B1A" />}
            </View>
            <Text className="text-white font-bold text-lg">Selecionar Arquivo</Text>
            <Text className="text-center text-xs" style={{ color: "#9B8B82" }}>Suporta arquivos .ofx e .txt de extrato</Text>
            <Pressable onPress={pickFile} disabled={loading} style={{ width: "100%", marginTop: 12 }}>
              <LinearGradient colors={["#FFB59A", "#FF6B1A"]} style={{ height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#131315", fontWeight: "700" }}>Escolher Arquivo</Text>
              </LinearGradient>
            </Pressable>
          </Card>
        )}

        {status === "parsed" && selectedFile && (
          <Card variant="bordered" style={{ gap: 16 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">{bankIcon}</Text>
                <View>
                  <Text className="text-white font-bold">{bankName}</Text>
                  <Text className="text-xs" style={{ color: "#9B8B82" }}>Conta: {accountNumber}</Text>
                </View>
              </View>
              <Pressable onPress={resetImport}><X size={20} color="#6B5C52" /></Pressable>
            </View>

            <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />

            <View className="flex-row justify-between">
              <View>
                <Text className="text-xs" style={{ color: "#6B5C52" }}>PERÍODO</Text>
                <Text className="text-white font-semibold text-sm mt-1">{period}</Text>
              </View>
              <View className="items-end">
                <Text className="text-xs" style={{ color: "#6B5C52" }}>TRANSAÇÕES</Text>
                <Text className="text-white font-semibold text-sm mt-1">{parsedTransactions.length}</Text>
              </View>
            </View>

            {duplicateCount > 0 && (
              <View className="flex-row items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "rgba(255,165,0,0.1)" }}>
                <AlertCircle size={16} color="#FFA500" />
                <Text className="text-xs flex-1" style={{ color: "#FFA500" }}>
                  Detectamos {duplicateCount} transações duplicadas que serão ignoradas.
                </Text>
              </View>
            )}

            <Pressable onPress={handleImport}>
              <LinearGradient colors={["#FFB59A", "#FF6B1A"]} style={{ height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#131315", fontWeight: "700" }}>Importar {parsedTransactions.length - duplicateCount} Transações</Text>
              </LinearGradient>
            </Pressable>
          </Card>
        )}

        {(status === "importing" || status === "success") && (
          <Card variant="bordered" style={{ alignItems: "center", gap: 16, paddingVertical: 32 }}>
            {status === "importing" ? (
              <>
                <ActivityIndicator size="large" color="#FF6B1A" />
                <Text className="text-white font-bold text-lg">Importando transações...</Text>
                <ProgressBar percentage={progress} />
              </>
            ) : (
              <>
                <CheckCircle2 size={48} color="#4CAF50" />
                <Text className="text-white font-bold text-lg">Importação Concluída!</Text>
                <Text className="text-center text-xs" style={{ color: "#9B8B82" }}>
                  {importedCount} transações importadas com sucesso.{"\n"}{duplicateCount} transações duplicadas puladas.
                </Text>
                <Pressable onPress={resetImport} style={{ width: "100%", marginTop: 12 }}>
                  <LinearGradient colors={["#FFB59A", "#FF6B1A"]} style={{ height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#131315", fontWeight: "700" }}>Concluir</Text>
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </Card>
        )}
      </View>
    </Screen>
  );
}
