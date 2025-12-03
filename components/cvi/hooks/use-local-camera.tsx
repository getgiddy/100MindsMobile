import { useCallback, useEffect, useState } from 'react';
import { useDailyContext } from '../components/cvi-provider';

export const useLocalCamera = (): {
  isCamReady: boolean;
  isCamMuted: boolean;
  localSessionId: string | null;
  onToggleCamera: () => void;
} => {
  const { callObject } = useDailyContext();
  const [isCamMuted, setIsCamMuted] = useState(false);
  const [isCamReady, setIsCamReady] = useState(false);
  const [localSessionId, setLocalSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!callObject) return;

    const updateCameraState = () => {
      const localParticipant = callObject.participants().local;
      if (localParticipant) {
        setLocalSessionId(localParticipant.session_id);
        // Consider the video active when state === 'playable', otherwise treat as muted.
        const videoState = localParticipant?.tracks?.video?.state;
        setIsCamMuted(videoState !== 'playable');
        setIsCamReady(true);
      }
    };

    updateCameraState();

    callObject.on('participant-updated', updateCameraState);
    callObject.on('joined-meeting', updateCameraState);

    return () => {
      callObject.off('participant-updated', updateCameraState);
      callObject.off('joined-meeting', updateCameraState);
    };
  }, [callObject]);

  const onToggleCamera = useCallback(() => {
    if (callObject) {
      callObject.setLocalVideo(!isCamMuted);
    }
  }, [callObject, isCamMuted]);

  return {
    isCamReady,
    isCamMuted,
    localSessionId,
    onToggleCamera,
  };
};
