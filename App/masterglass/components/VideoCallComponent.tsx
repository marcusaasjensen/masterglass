import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';

interface VideoCallComponentProps {
  localStream: MediaStream;
  remoteStream?: MediaStream | null;
}

const VideoCallComponent: React.FC<VideoCallComponentProps> = ({ 
  localStream, 
  remoteStream 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Video Call</Text>
      <View style={styles.videoContainer}>
        {localStream && (
          <RTCView streamURL={getStreamUrl(localStream)} />
        )}
        {remoteStream && (
          <RTCView streamURL={getStreamUrl(remoteStream)} />
        )}
      </View>
    </View>
  );
};

const getStreamUrl = (stream: MediaStream | null) => {
    return stream ? (stream as any).toURL() : undefined;
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black'
  },
  header: {
    color: 'white',
    textAlign: 'center',
    padding: 10
  },
  videoContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  video: {
    width: '45%',
    height: '80%',
    margin: 10
  }
});

export default VideoCallComponent;