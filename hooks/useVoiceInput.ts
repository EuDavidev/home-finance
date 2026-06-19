import { useState, useCallback } from "react";
import * as Speech from "expo-speech";

/**
 * Hook para capturar input de voz
 * Converte fala em texto para pré-preenchimento de descrição
 *
 * Nota: Implementação beta - pode ser expandida com:
 * - react-native-voice para melhor qualidade
 * - ML para extrair valor e categoria automaticamente
 */
export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  const startListening = useCallback(async () => {
    try {
      setError("");
      setIsListening(true);
      // TODO: Implementar integração com expo-speech ou react-native-voice
      // Por enquanto, apenas placeholder
    } catch (err) {
      setError("Erro ao iniciar captura de voz");
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  const speakFeedback = useCallback(async (text: string) => {
    try {
      await Speech.speak(text, {
        language: "pt-BR",
        pitch: 1,
        rate: 1,
      });
    } catch (err) {
      console.error("Erro ao falar feedback:", err);
    }
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    setTranscript,
    speakFeedback,
  };
}
