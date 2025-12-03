import { useCallback, useEffect, useState } from 'react';
import { useDailyContext } from '../components/cvi-provider';

export const useLocalMicrophone = (): {
  isMicReady: boolean;
  isMicMuted: boolean;
  localSessionId: string | null;
  onToggleMicrophone: () => void;
} => {
  const { callObject } = useDailyContext();
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isMicReady, setIsMicReady] = useState(false);
  const [localSessionId, setLocalSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!callObject) return;

    const updateMicrophoneState = () => {
      const localParticipant = callObject.participants().local;
      if (localParticipant) {
        setLocalSessionId(localParticipant.session_id);
        const audioState = localParticipant.tracks?.audio?.state;
        // consider the microphone muted when the audio track state is explicitly 'off'
        setIsMicMuted(audioState === 'off');
        setIsMicReady(true);
      }
    };

    updateMicrophoneState();

    callObject.on('participant-updated', updateMicrophoneState);
    callObject.on('joined-meeting', updateMicrophoneState);

    return () => {
      callObject.off('participant-updated', updateMicrophoneState);
      callObject.off('joined-meeting', updateMicrophoneState);
    };
  }, [callObject]);

  const onToggleMicrophone = useCallback(() => {
    if (callObject) {
      callObject.setLocalAudio(!isMicMuted);
    }
  }, [callObject, isMicMuted]);

  return {
    isMicReady,
    isMicMuted,
    localSessionId,
    onToggleMicrophone,
  };
};
