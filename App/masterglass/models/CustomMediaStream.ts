import { MediaStream } from 'react-native-webrtc';

export type CustomMediaStream = MediaStream & {
  toURL(): string;
  _reactTag?: number;
  id?: string;
  onaddtrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null;
  onremovetrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null;
};