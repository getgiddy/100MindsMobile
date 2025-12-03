import { useCallback, useEffect, useState } from 'react';
import { useDailyContext } from '../components/cvi-provider';
import { Alert, Platform } from 'react-native';

export const useLocalScreenshare = (): {
  isScreenSharing: boolean;
  localSessionId: string | null;
  onToggleScreenshare: () => void;
} => {
  const { callObject } = useDailyContext();
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localSessionId, setLocalSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!callObject) return;

    const updateScreenShareState = () => {
      const localParticipant = callObject.participants().local;
      if (localParticipant) {
        setLocalSessionId(localParticipant.session_id);
        const screenState = localParticipant.tracks?.screenVideo?.state;
        setIsScreenSharing(!!screenState && screenState !== 'off');
      }
    };

    updateScreenShareState();

    callObject.on('participant-updated', updateScreenShareState);
    callObject.on('joined-meeting', updateScreenShareState);

    return () => {
      callObject.off('participant-updated', updateScreenShareState);
      callObject.off('joined-meeting', updateScreenShareState);
    };
  }, [callObject]);

  const onToggleScreenshare = useCallback(() => {
    // Screen sharing on mobile is limited and requires additional setup
    // For iOS, it requires Broadcast Upload Extension
    // For Android, it requires proper permissions
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Screen Share',
        'Screen sharing on iOS requires additional setup with Broadcast Upload Extension. This feature is not yet implemented.'
      );
      return;
    }

    if (callObject) {
      if (isScreenSharing) {
        callObject.stopScreenShare();
      } else {
        // On Android, this requires proper permissions
        callObject.startScreenShare();
      }
    }
  }, [callObject, isScreenSharing]);

  return {
    isScreenSharing,
    localSessionId,
    onToggleScreenshare,
  };
};
