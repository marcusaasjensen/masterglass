import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Device from 'expo-device';

interface WebSocketMessage {
  clientId?: string;
  recipientIds?: string[];
  content?: string;
  audioData?: string;
  sender?: string;
}

interface WebSocketContextType {
  ws: WebSocket | null;
  isConnected: boolean;
  deviceId: string;
  sendMessage: (message: WebSocketMessage) => void;
}

interface CallState {
  isInCall: boolean;
  remotePartyId: string | null;
  isOutgoing: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  ws: null,
  isConnected: false,
  deviceId: '',
  sendMessage: () => {},
});

export const WebSocketProvider: React.FC<{ 
  children: React.ReactNode;
  onIncomingCall?: (callerId: string) => Promise<boolean>; 
}> = ({ children, onIncomingCall }) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    remotePartyId: null,
    isOutgoing: false
  });

  const generateDeviceId = useCallback(() => {
    return `app-${Device.brand}-${Device.modelName}-${Date.now()}`;
  }, []);

  const handleIncomingCall = async (callerId: string) => {
    if (!callState.isInCall && onIncomingCall) {
      const accepted = await onIncomingCall(callerId);
      if (accepted && ws) {
        setCallState({
          isInCall: true,
          remotePartyId: callerId,
          isOutgoing: false
        });
        ws.send(JSON.stringify({
          clientId: deviceId,
          recipientIds: [callerId],
          content: 'callAccepted'
        }));
        return true;
      } else if (ws) {
        ws.send(JSON.stringify({
          clientId: deviceId,
          recipientIds: [callerId],
          content: 'callRejected'
        }));
      }
    }
    return false;
  };

  const initializeWebSocket = useCallback(() => {
    const uniqueId = "App";
    setDeviceId(uniqueId);

    const websocket = new WebSocket(`ws://192.168.229.31:8080`);

    websocket.onopen = () => {
      console.log('Connected to server');
      setIsConnected(true);
      setReconnectAttempts(0);

      websocket.send(JSON.stringify({
        clientId: uniqueId
      }));
    };

    websocket.onclose = () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      setCallState({
        isInCall: false,
        remotePartyId: null,
        isOutgoing: false
      });

      if (reconnectAttempts < 5) {
        setTimeout(() => {
          setReconnectAttempts((prev) => prev + 1);
          initializeWebSocket();
        }, 5000);
      } else {
        console.error('Max reconnection attempts reached');
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onmessage = async (event) => {
      try {
        if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
          // Ne traiter l'audio que si nous sommes en appel
          if (callState.isInCall) {
            console.log('Received audio data during active call');
          }
          return;
        }

        const data = JSON.parse(event.data);
        const senderId = data.sender || data.clientId;
        console.log('Received message:', data);

        switch (data.content) {
          case 'callStart':
            if (!callState.isInCall) {
              await handleIncomingCall(senderId);
            }
            break;

          case 'callAccepted':
            if (callState.isOutgoing && senderId === callState.remotePartyId) {
              console.log('Call accepted by remote party');
              setCallState(prev => ({
                ...prev,
                isInCall: true
              }));
            }
            break;

          case 'callRejected':
            if (callState.isOutgoing && senderId === callState.remotePartyId) {
              console.log('Call rejected by remote party');
              setCallState({
                isInCall: false,
                remotePartyId: null,
                isOutgoing: false
              });
            }
            break;

          case 'callEnd':
            if (senderId === callState.remotePartyId) {
              console.log('Call ended by remote party');
              setCallState({
                isInCall: false,
                remotePartyId: null,
                isOutgoing: false
              });
            }
            break;
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    setWs(websocket);

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [reconnectAttempts, deviceId, onIncomingCall, callState]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      if (message.content === 'callStart' && message.recipientIds?.[0]) {
        setCallState({
          isInCall: false, // sera mis à true quand l'autre partie accepte
          remotePartyId: message.recipientIds[0],
          isOutgoing: true
        });
      }
      
      ws.send(JSON.stringify({
        ...message,
        clientId: deviceId
      }));
    } else {
      console.error('WebSocket is not connected');
    }
  }, [ws, deviceId]);

  useEffect(() => {
    const cleanup = initializeWebSocket();
    return () => {
      cleanup();
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

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};