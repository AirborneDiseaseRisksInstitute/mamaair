import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const { MotionGate: MotionGateNative } = NativeModules;

// MotionGate now bridges only TYPE_SIGNIFICANT_MOTION (hardware sensor, no
// Play Services). The previous Activity Recognition Transition API path was
// removed after it caused IncompatibleClassChangeError SIGSEGVs on CIS-region
// devices whose bundled Play Services Location version differs from what we
// compiled against.
export interface MotionEvent {
  type: 'sigmotion';
}

const emitter =
  Platform.OS === 'android' && MotionGateNative
    ? new NativeEventEmitter(MotionGateNative)
    : null;

export const MotionGate = {
  isAvailable(): boolean {
    return Platform.OS === 'android' && !!MotionGateNative;
  },

  async start(): Promise<void> {
    if (!MotionGateNative) return;
    await MotionGateNative.start();
  },

  async stop(): Promise<void> {
    if (!MotionGateNative) return;
    await MotionGateNative.stop();
  },

  addListener(listener: (event: MotionEvent) => void): () => void {
    if (!emitter) return () => {};
    const sub = emitter.addListener('MotionGate', listener);
    return () => sub.remove();
  },
};
