import React, { useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from "react-native";
import { Text } from "@/components/ui/Text";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  User,
  Bell,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { parseOFX, isValidOFX, OFXTransaction, detectCategory } from "@/lib/ofxParser";
import { getBankInfo, FEATURED_BANKS } from "@/lib/bankDatabase";
import { formatCurrency } from "@/lib/format";
import { ProgressBar } from "@/components/ui/ProgressBar";

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
  const [showAllTx, setShowAllTx] = useState(false);
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

      // Get bank info
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

      // Check for duplicates
      if (member?.family_id) {
        const fitIds = parsed.transactions.map((t) => t.fitId);
        const { data: existing } = await supabase
          .from("transactions")
          .select("note")
          .eq("family_id", member.family_id)
          .in("note", fitIds.map((id) => `[FITID:${id}]`));
        setDuplicateCount(existing?.length ?? 0);
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao processar arquivo.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!member?.family_id || parsedTransactions.length === 0) return;

    try {
      setStatus("importing");
      setProgress(0);

      // 1. Find or create the bank account
      const { data: existingAccount } = await supabase
        .from("accounts")
        .select("id")
        .eq("family_id", member.family_id)
        .eq("account_number", accountNumber)
        .maybeSingle();

      let accountId: string;
      if (existingAccount) {
        accountId = existingAccount.id;
      } else {
        const { data: newAccount, error: accErr } = await supabase
          .from("accounts")
          .insert({
            family_id: member.family_id,
            member_id: member.id,
            name: `${bankName} - ${accountNumber}`,
            type: "corrente",
            bank: bankName,
            account_number: accountNumber,
            balance: balance,
            icon: bankIcon,
            color: bankColor,
          })
          .select("id")
          .single();
        if (accErr) throw accErr;
        accountId = newAccount!.id;
      }

      // 2. Filter out duplicates by fitId
      const fitIds = parsedTransactions.map((t) => t.fitId);
      const { data: existingTx } = await supabase
        .from("transactions")
        .select("note")
        .eq("family_id", member.family_id)
        .in("note", fitIds.map((id) => `[FITID:${id}]`));

      const existingFitIds = new Set(
        (existingTx ?? []).map((t: any) => {
          const match = t.note?.match(/\[FITID:([^\]]+)\]/);
          return match ? match[1] : null;
        }).filter(Boolean)
      );

      const newTransactions = parsedTransactions.filter(
        (t) => !existingFitIds.has(t.fitId)
      );

      if (newTransactions.length === 0) {
        setStatus("success");
        setImportedCount(0);
        setDuplicateCount(parsedTransactions.length);
        Alert.alert("Nenhuma novidade", "Todas as transações já foram importadas anteriormente.");
        return;
      }

      // 3. Insert in batches of 100
      const batchSize = 100;
      const totalBatches = Math.ceil(newTransactions.length / batchSize);
      let inserted = 0;

      for (let i = 0; i < newTransactions.length; i += batchSize) {
        const batch = newTransactions.slice(i, i + batchSize).map((tx) => ({
          family_id: member.family_id,
          account_id: accountId,
          member_id: member.id,
          date: tx.date,
          description: tx.description,
          amount: tx.amount,
          type: tx.type, // Already "income" | "expense"
          category: detectCategory(tx.description),
          note: `[FITID:${tx.fitId}]`,
        }));

        const { error } = await supabase.from("transactions").insert(batch);
        if (error) throw error;

        inserted += batch.length;
        setProgress((Math.floor(i / batchSize) + 1) / totalBatches * 100);
      }

      setImportedCount(inserted);
      setDuplicateCount(parsedTransactions.length - inserted);
      setStatus("success");
      Alert.alert(
        "Importação concluída! 🎉",
        `${inserted} transações importadas com sucesso.${
          parsedTransactions.length - inserted > 0
            ? `\n${parsedTransactions.length - inserted} duplicatas ignoradas.`
            : ""
        }`
      );
    } catch (error) {
      setStatus("error");
      Alert.alert("Erro", `Falha: ${error instanceof Error ? error.message : "Desconhecido"}`);
      console.error(error);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setParsedTransactions([]);
    setStatus("idle");
    setProgress(0);
    setDuplicateCount(0);
    setImportedCount(0);
    setShowAllTx(false);
  };

  // Computed values
  const totalIncome = parsedTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = parsedTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const displayTx = showAllTx ? parsedTransactions : parsedTransactions.slice(0, 5);

  return (
    <View className="flex-1" style={{ backgroundColor: "#131315" }}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-14 pb-4">
          <View className="flex-row items-center gap-3">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: member?.color || "#FF6B1A" }}
            >
              <User size={18} color="#FFF" />
            </View>
            <Text className="text-white font-bold text-base tracking-wider">
              HOME FINANCE
            </Text>
          </View>
          <Bell size={22} color="#FF6B1A" />
        </View>

        {/* Title */}
        <View className="px-5 mb-6">
          <Text className="text-white text-2xl font-bold">Importar Extrato</Text>
          <Text className="mt-1" style={{ color: "#9B8B82" }}>
            Carregue seu arquivo OFX do banco
          </Text>
        </View>

        {/* Upload Area or Parsed Data */}
        {status === "idle" ? (
          <>
            {/* Upload card */}
            <Pressable onPress={pickFile} disabled={loading} className="mx-5 mb-6">
              <LinearGradient
                colors={["#2A2420", "#1F1B19"]}
                style={{
                  borderRadius: 24,
                  padding: 32,
                  alignItems: "center",
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: "rgba(255,107,26,0.3)",
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#FF6B1A" size="large" />
                ) : (
                  <>
                    <View
                      className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
                      style={{ backgroundColor: "rgba(255,107,26,0.12)" }}
                    >
                      <Upload size={28} color="#FF6B1A" />
                    </View>
                    <Text className="text-white font-bold text-lg mb-1">
                      Selecionar arquivo OFX
                    </Text>
                    <Text className="text-sm text-center" style={{ color: "#9B8B82" }}>
                      Toque para escolher o extrato do seu banco
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {/* Supported Banks Grid */}
            <View className="mx-5 mb-6">
              <Text className="text-white font-bold text-lg mb-4">
                Bancos Suportados
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                {FEATURED_BANKS.map((bank) => (
                  <View
                    key={bank.code}
                    className="items-center justify-center rounded-2xl"
                    style={{
                      width: "30%",
                      backgroundColor: "#1F1B19",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.06)",
                      paddingVertical: 14,
                    }}
                  >
                    <Text className="text-2xl mb-1">{bank.icon}</Text>
                    <Text
                      className="text-xs font-semibold text-center"
                      style={{ color: "#9B8B82" }}
                      numberOfLines={1}
                    >
                      {bank.shortName}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* How-to */}
            <View
              className="mx-5 mb-6 p-5 rounded-2xl"
              style={{ backgroundColor: "#1F1B19", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}
            >
              <Text className="text-white font-bold text-base mb-3">
                💡 Como exportar OFX
              </Text>
              {[
                "Acesse o internet banking ou app do seu banco",
                "Vá em Extrato → Exportar",
                'Escolha o formato "OFX" ou "Money/Quicken"',
                "Selecione o período desejado",
                "Baixe o arquivo e importe aqui",
              ].map((step, i) => (
                <View key={i} className="flex-row items-start gap-3 mb-2">
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: "rgba(255,107,26,0.12)" }}
                  >
                    <Text className="text-xs font-bold" style={{ color: "#FF6B1A" }}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text className="text-sm flex-1" style={{ color: "#9B8B82" }}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Bank Info Card */}
            <View className="mx-5 mb-4">
              <LinearGradient
                colors={[bankColor + "30", "#1F1B19"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 24, padding: 20 }}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center gap-3">
                    <View
                      className="w-12 h-12 rounded-2xl items-center justify-center"
                      style={{ backgroundColor: bankColor + "20" }}
                    >
                      <Text className="text-2xl">{bankIcon}</Text>
                    </View>
                    <View>
                      <Text className="text-white font-bold text-lg">{bankName}</Text>
                      <Text className="text-xs" style={{ color: "#9B8B82" }}>
                        Conta {accountNumber}
                      </Text>
                    </View>
                  </View>
                  <Pressable onPress={clearSelection}>
                    <X size={20} color="#6B5C52" />
                  </Pressable>
                </View>

                {/* File name */}
                <View className="flex-row items-center gap-2 mb-4">
                  <FileText size={14} color="#6B5C52" />
                  <Text className="text-xs" style={{ color: "#6B5C52" }}>
                    {selectedFile?.name} • {period}
                  </Text>
                </View>

                {/* Stats row */}
                <View className="flex-row" style={{ gap: 12 }}>
                  <View
                    className="flex-1 p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
                  >
                    <Text className="text-xs font-semibold tracking-widest mb-1" style={{ color: "#4CAF50" }}>
                      RECEITAS
                    </Text>
                    <Text className="text-white font-bold">{formatCurrency(totalIncome)}</Text>
                  </View>
                  <View
                    className="flex-1 p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
                  >
                    <Text className="text-xs font-semibold tracking-widest mb-1" style={{ color: "#F44336" }}>
                      DESPESAS
                    </Text>
                    <Text className="text-white font-bold">{formatCurrency(totalExpense)}</Text>
                  </View>
                  <View
                    className="flex-1 p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
                  >
                    <Text className="text-xs font-semibold tracking-widest mb-1" style={{ color: "#FF6B1A" }}>
                      TOTAL
                    </Text>
                    <Text className="text-white font-bold">{parsedTransactions.length}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Duplicate warning */}
            {duplicateCount > 0 && status === "parsed" && (
              <View
                className="mx-5 mb-4 flex-row items-center gap-3 p-4 rounded-2xl"
                style={{ backgroundColor: "rgba(255,183,77,0.1)", borderWidth: 1, borderColor: "rgba(255,183,77,0.3)" }}
              >
                <AlertCircle size={18} color="#FFB74D" />
                <Text className="text-sm flex-1" style={{ color: "#FFB74D" }}>
                  {duplicateCount} transação(ões) já importada(s) — serão ignoradas automaticamente.
                </Text>
              </View>
            )}

            {/* Transactions Preview */}
            <View className="mx-5 mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white font-bold text-lg">
                  Transações ({parsedTransactions.length})
                </Text>
                <View className="px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(255,107,26,0.12)" }}>
                  <Text className="text-xs font-bold" style={{ color: "#FF6B1A" }}>
                    {parsedTransactions.length} itens
                  </Text>
                </View>
              </View>

              {displayTx.map((tx, i) => (
                <View
                  key={`${tx.fitId}-${i}`}
                  className="flex-row items-center p-4 rounded-2xl mb-2"
                  style={{ backgroundColor: "#1F1B19", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: tx.type === "income" ? "rgba(76,175,80,0.12)" : "rgba(244,67,54,0.12)" }}
                  >
                    {tx.type === "income" ? (
                      <ArrowDownLeft size={18} color="#4CAF50" />
                    ) : (
                      <ArrowUpRight size={18} color="#F44336" />
                    )}
                  </View>
                  <View className="flex-1 mr-3">
                    <Text className="text-white text-sm font-semibold" numberOfLines={1}>
                      {tx.description}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <Text className="text-xs" style={{ color: "#6B5C52" }}>{tx.date}</Text>
                      <View className="px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(255,107,26,0.1)" }}>
                        <Text className="text-xs" style={{ color: "#FF6B1A" }}>
                          {detectCategory(tx.description)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text
                    className="font-bold text-sm"
                    style={{ color: tx.type === "income" ? "#4CAF50" : "#F44336" }}
                  >
                    {tx.type === "income" ? "+" : "-"} {formatCurrency(tx.amount)}
                  </Text>
                </View>
              ))}

              {parsedTransactions.length > 5 && (
                <Pressable
                  onPress={() => setShowAllTx(!showAllTx)}
                  className="flex-row items-center justify-center py-3 rounded-2xl mt-1"
                  style={{ backgroundColor: "#1F1B19" }}
                >
                  {showAllTx ? <ChevronUp size={16} color="#FF6B1A" /> : <ChevronDown size={16} color="#FF6B1A" />}
                  <Text className="text-sm font-semibold ml-2" style={{ color: "#FF6B1A" }}>
                    {showAllTx ? "Mostrar menos" : `Ver todas ${parsedTransactions.length} transações`}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Progress */}
            {status === "importing" && (
              <View className="mx-5 mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-xs" style={{ color: "#9B8B82" }}>Importando...</Text>
                  <Text className="text-xs font-bold" style={{ color: "#FF6B1A" }}>{Math.round(progress)}%</Text>
                </View>
                <ProgressBar percentage={progress} />
              </View>
            )}

            {/* Success */}
            {status === "success" && (
              <View
                className="mx-5 mb-4 flex-row items-center gap-3 p-4 rounded-2xl"
                style={{ backgroundColor: "rgba(76,175,80,0.1)", borderWidth: 1, borderColor: "rgba(76,175,80,0.3)" }}
              >
                <CheckCircle2 size={20} color="#4CAF50" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold" style={{ color: "#4CAF50" }}>
                    {importedCount} transações importadas!
                  </Text>
                  {duplicateCount > 0 && (
                    <Text className="text-xs mt-0.5" style={{ color: "#9B8B82" }}>
                      {duplicateCount} duplicatas ignoradas
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            {(status === "parsed" || status === "error") && (
              <View className="mx-5 flex-row gap-3">
                <Pressable onPress={clearSelection} className="flex-1">
                  <View
                    className="h-14 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: "#1F1B19", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}
                  >
                    <Text className="font-semibold" style={{ color: "#9B8B82" }}>Cancelar</Text>
                  </View>
                </Pressable>
                <Pressable onPress={handleImport} className="flex-1">
                  <LinearGradient
                    colors={["#FFB59A", "#FF6B1A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 16, height: 56, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
                  >
                    <Upload size={18} color="#131315" />
                    <Text style={{ color: "#131315", fontWeight: "700", fontSize: 15 }}>
                      Importar {parsedTransactions.length - duplicateCount}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {status === "success" && (
              <View className="mx-5">
                <Pressable onPress={clearSelection}>
                  <LinearGradient
                    colors={["#FFB59A", "#FF6B1A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 16, height: 56, alignItems: "center", justifyContent: "center" }}
                  >
                    <Text style={{ color: "#131315", fontWeight: "700", fontSize: 15 }}>
                      Importar outro arquivo
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
