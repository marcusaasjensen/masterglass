import { useState, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useWebSocket } from '@/context/WebSocketContext';

interface UseAudioChatProps {
  contactId: string;
}

export const useAudioChat = ({ contactId }: UseAudioChatProps) => {
  const { ws, isConnected, deviceId } = useWebSocket();
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const startAudioTransmission = async () => {
    if (!ws || !isConnected) return;

    try {
      console.log('Demande des permissions audio...');
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.log('Permission audio refusée');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsTransmitting(true);

      // Envoyer un message de début d'appel
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'callStart',
          senderId: deviceId,
          receiverId: contactId,
          timestamp: Date.now()
        }));
      }

    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      setIsTransmitting(false);
    }
  };

  const stopAudioTransmission = async () => {
    if (!isTransmitting || !recording || !ws) return;

    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'callEnd',
          senderId: deviceId,
          receiverId: contactId,
          timestamp: Date.now()
        }));
      }

      await recording.stopAndUnloadAsync();
      setRecording(null);
      setIsTransmitting(false);
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de l\'enregistrement:', error);
    }
  };

  return {
    isConnected,
    isTransmitting,
    startAudioTransmission,
    stopAudioTransmission,
  };
};