// components/transactions/PdfUploader.tsx

import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export async function pickAndUploadPdf(transactionId: string) {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/jpeg", "image/png"],
    copyToCacheDirectory: true,
  });

  if (result.canceled) return null;

  const file = result.assets[0];
  const { member } = useAuthStore.getState();

  // Ler arquivo como base64
  const base64 = await FileSystem.readAsStringAsync(file.uri, {
    encoding: "base64" as const,
  });

  // Upload para Supabase Storage
  const path = `${member?.family_id}/${transactionId}/${file.name}`;
  const { data, error } = await supabase.storage
    .from("receipts")
    .upload(path, decode(base64), {
      contentType: file.mimeType ?? "application/pdf",
      upsert: true,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("receipts").getPublicUrl(path);

  return { url: publicUrl, filename: file.name };
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
