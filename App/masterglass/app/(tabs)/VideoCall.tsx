import React, { useEffect } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { useWebrtc } from '@/hooks/useWebrtc';
import VideoCallComponent from '@/components/VideoCallComponent';
import { CustomMediaStream } from '@/models/CustomMediaStream';

const VideoCallScreen = () => {
  const { 
    localStream, 
    remoteStream, 
    callState, 
    startLocalStream, 
    startCall, 
    endCall 
  } = useWebrtc();

  useEffect(() => {
    startLocalStream();
  }, [startLocalStream]);

  return (
    <View style={styles.container}>
      {localStream && (
        <VideoCallComponent 
          localStream={localStream as CustomMediaStream} 
          remoteStream={remoteStream as CustomMediaStream | null} 
        />
      )}
      {callState === 'idle' && (
        <Button title="Start Call" onPress={startCall} />
      )}
      <Button title="End Call" onPress={endCall} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center'
  }
});

export default VideoCallScreen;