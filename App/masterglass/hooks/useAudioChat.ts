import { useState, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';

interface UseAudioChatProps {
  contactId: string;
  myId: string;
}

export const useAudioChat = ({ contactId, myId }: UseAudioChatProps) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  // Initialiser la connexion WebSocket
  const initializeWebSocket = useCallback(() => {
    // Remplacer avec l'IP de votre machine où tourne le serveur
    const websocket = new WebSocket(`ws://192.168.229.31:8080?clientType=${myId}`);

    websocket.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    websocket.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      setIsTransmitting(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    websocket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'audio' && data.clientId !== myId) {
          console.log('Audio reçu depuis:', data.clientId);
          // Ici, on pourrait gérer la lecture de l'audio reçu
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [myId]);

  // Démarrer la transmission audio
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

      console.log('Démarrage de l\'enregistrement...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsTransmitting(true);

      // Envoyer un message de début d'appel
      ws.send(JSON.stringify({
        clientId: myId,
        recipientId: contactId,
        type: 'callStart',
        message: 'Début de l\'appel'
      }));

    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      setIsTransmitting(false);
    }
  };

  // Arrêter la transmission audio
  const stopAudioTransmission = async () => {
    if (!isTransmitting || !recording || !ws) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Enregistrement arrêté, fichier:', uri);

      // Envoyer un message de fin d'appel
      ws.send(JSON.stringify({
        clientId: myId,
        recipientId: contactId,
        type: 'callEnd',
        message: 'Fin de l\'appel'
      }));

      setRecording(null);
      setIsTransmitting(false);
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de l\'enregistrement:', error);
    }
  };

  useEffect(() => {
    const cleanup = initializeWebSocket();
    return () => {
      cleanup();
      if (isTransmitting) {
        stopAudioTransmission();
      }
    };
  }, [initializeWebSocket]);

  return {
    isConnected,
    isTransmitting,
    startAudioTransmission,
    stopAudioTransmission,
  };
};