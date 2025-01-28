import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Device from 'expo-device';

// Typage des messages WebSocket
interface WebSocketMessage {
  type: string;
  clientId?: string;
  deviceInfo?: {
    brand: string;
    modelName: string;
    osName: string;
    osVersion: string;
  };
  payload?: any;
}

// Typage du contexte
interface WebSocketContextType {
  ws: WebSocket | null;
  isConnected: boolean;
  deviceId: string;
  sendMessage: (message: WebSocketMessage) => void;
}

// Création du contexte
const WebSocketContext = createContext<WebSocketContextType>({
  ws: null,
  isConnected: false,
  deviceId: '',
  sendMessage: () => {},
});

// Provider WebSocket
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Générer un ID unique pour ce dispositif
  const generateDeviceId = useCallback(() => {
    return `app-${Device.brand}-${Device.modelName}-${Date.now()}`;
  }, []);

  // Initialiser la connexion WebSocket
  const initializeWebSocket = useCallback(() => {
    const uniqueId = "app-react";
    setDeviceId(uniqueId);

    const websocket = new WebSocket(`ws://192.168.229.31:8080?clientType=${uniqueId}`);

    websocket.onopen = () => {
      console.log('Connected to server');
      setIsConnected(true);
      setReconnectAttempts(0); // Réinitialiser les tentatives de reconnexion

      // Envoyer un message d'identification au serveur
      websocket.send(JSON.stringify({
        type: 'identification',
        clientId: uniqueId,
        deviceInfo: {
          brand: Device.brand,
          modelName: Device.modelName,
          osName: Device.osName,
          osVersion: Device.osVersion,
        },
      }));
    };

    websocket.onclose = () => {
      console.log('Disconnected from server');
      setIsConnected(false);

      // Tenter de se reconnecter après un délai (max 5 tentatives)
      if (reconnectAttempts < 5) {
        setTimeout(() => {
          setReconnectAttempts((prev) => prev + 1);
          initializeWebSocket();
        }, 5000); // Reconnecter après 5 secondes
      } else {
        console.error('Max reconnection attempts reached');
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        console.log('Received message:', data);

        // Gérer les différents types de messages ici
        switch (data.type) {
          case 'callRequest':
            console.log('Call request received:', data.payload);
            break;
          case 'message':
            console.log('Message received:', data.payload);
            break;
          default:
            console.warn('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    setWs(websocket);
  }, [generateDeviceId, reconnectAttempts]);

  // Envoyer un message via WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }, [ws]);

  // Initialiser la connexion WebSocket au montage du composant
  useEffect(() => {
    initializeWebSocket();

    // Nettoyer la connexion WebSocket lors du démontage
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [initializeWebSocket]);

  return (
    <WebSocketContext.Provider value={{ ws, isConnected, deviceId, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook pour utiliser le contexte WebSocket
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};