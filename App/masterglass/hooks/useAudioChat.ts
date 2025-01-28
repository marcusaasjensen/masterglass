import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useWebSocket } from '@/context/WebSocketContext';

interface UseAudioChatProps {
  contactId: string;
  onIncomingCall?: (callerId: string) => void;
}

export const useAudioChat = ({ contactId, onIncomingCall }: UseAudioChatProps) => {
  const { ws, isConnected, deviceId } = useWebSocket();
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [incomingCallerId, setIncomingCallerId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const sendAudioData = async (audioData: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        clientId: deviceId,
        recipientIds: [contactId],
        audioData: audioData
      }));
    }
  };

  const playAudioData = async (audioBuffer: ArrayBuffer) => {
    try {
      const uint8Array = new Uint8Array(audioBuffer);
      const base64String = Buffer.from(uint8Array).toString('base64');
      
      const tempFile = `${FileSystem.cacheDirectory}/temp_audio_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(tempFile, base64String, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: tempFile },
        { shouldPlay: true, volume: 1.0 }
      );
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status && 'didJustFinish' in status && status.didJustFinish && !status.isLooping) {
          console.log("Lecture terminée");
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const startAudioTransmission = useCallback(async () => {
    try {
      console.log("Démarrage de la transmission audio...");
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        console.error('Permission microphone refusée');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsTransmitting(true);

      intervalRef.current = setInterval(async () => {
        try {
          if (recording) {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            if (uri) {
              const audioBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
              await sendAudioData(audioBase64);
            }
          }
        } catch (error) {
          console.error('Erreur lors de l’envoi de l’audio :', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Erreur lors du démarrage de l’enregistrement :', error);
    }
  }, [ws, contactId, deviceId]);

  const stopAudioTransmission = useCallback(async () => {
    console.log("Arrêt de la transmission audio...");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      } catch (error) {
        console.error('Erreur lors de l’arrêt de l’enregistrement :', error);
      }
    }
    setIsTransmitting(false);
  }, [recording]);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = async (event: MessageEvent) => {
      try {
        if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
          if (isTransmitting) {
            const arrayBuffer = event.data instanceof Blob ? 
              await event.data.arrayBuffer() : 
              event.data;
            await playAudioData(arrayBuffer);
          }
          return;
        }

        const data = JSON.parse(event.data);
        if (data.sender && data.content === 'callStart') {
          setIncomingCallerId(data.sender);
          onIncomingCall?.(data.sender);
        } else if (data.sender && data.content === 'callEnd') {
          if (data.sender === incomingCallerId || data.sender === contactId) {
            await stopAudioTransmission();
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws, isTransmitting, contactId, onIncomingCall]);

  useEffect(() => {
    return () => {
      stopAudioTransmission();
    };
  }, []);

  return {
    isConnected,
    isTransmitting,
    startAudioTransmission,
    stopAudioTransmission,
    incomingCallerId,
  };
};
