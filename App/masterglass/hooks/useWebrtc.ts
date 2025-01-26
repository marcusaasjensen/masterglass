import { useState, useRef, useCallback } from 'react';
import { 
 mediaDevices, 
 RTCPeerConnection, 
 RTCSessionDescription, 
 RTCIceCandidate 
} from 'react-native-webrtc';
import { CustomMediaStream } from '@/models/CustomMediaStream';

export const useWebrtc = () => {
 const [localStream, setLocalStream] = useState<CustomMediaStream | null>(null);
 const [remoteStream, setRemoteStream] = useState<CustomMediaStream | null>(null);
 const [callState, setCallState] = useState<'idle' | 'connecting' | 'connected'>('idle');
 
 const peerConnection = useRef<RTCPeerConnection | null>(null);

 const startLocalStream = useCallback(async () => {
   try {
     const stream = await mediaDevices.getUserMedia({
       audio: true,
       video: true
     }) as CustomMediaStream;
     setLocalStream(stream);
     return stream;
   } catch (error) {
     console.error('Error accessing media devices', error);
     return null;
   }
 }, []);

 const startCall = useCallback(async () => {
   if (!localStream) {
     await startLocalStream();
     return;
   }

   const configuration = { 
     iceServers: [
       { urls: 'stun:stun.l.google.com:19302' }
       // Add TURN servers if needed
     ]
   };
   peerConnection.current = new RTCPeerConnection(configuration);

   localStream.getTracks().forEach(track => {
     peerConnection.current?.addTrack(track as any, localStream);
   });

   setCallState('connecting');
 }, [localStream, startLocalStream]);

 const endCall = useCallback(() => {
   localStream?.getTracks().forEach(track => track.stop());
   peerConnection.current?.close();
   
   setLocalStream(null);
   setRemoteStream(null);
   setCallState('idle');
 }, [localStream]);

 return {
   localStream,
   remoteStream,
   callState,
   startLocalStream,
   startCall,
   endCall
 };
};