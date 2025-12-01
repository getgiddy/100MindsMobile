import { DailyMediaView } from "@daily-co/react-native-daily-js";
import { Ionicons } from "@expo/vector-icons";
import React, { memo, useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useCVICall } from "../../hooks/use-cvi-call";
import { useLocalScreenshare } from "../../hooks/use-local-screenshare";
import { useReplicaIDs } from "../../hooks/use-replica-ids";
import { AudioWave } from "../audio-wave";
import { useDailyContext } from "../cvi-provider";
import {
	CameraSelectBtn,
	MicSelectBtn,
	ScreenShareButton,
} from "../device-select";

interface ConversationProps {
	onLeave: () => void;
	conversationUrl: string;
}

const VideoPreview = memo(
	({
		sessionId,
		isScreenShare = false,
	}: {
		sessionId: string;
		isScreenShare?: boolean;
	}) => {
		const { callObject } = useDailyContext();
		const [hasVideo, setHasVideo] = useState(true);

		useEffect(() => {
			if (!callObject) return;

			const updateVideoState = () => {
				const participants = callObject.participants();
				const participant = Object.values(participants).find(
					(p) => p.session_id === sessionId
				);
				if (participant) {
					setHasVideo(
						isScreenShare
							? participant.tracks?.screenVideo?.state === "playable"
							: participant.tracks?.video?.state === "playable"
					);
				}
			};

			updateVideoState();
			callObject.on("participant-updated", updateVideoState);

			return () => {
				callObject.off("participant-updated", updateVideoState);
			};
		}, [callObject, sessionId, isScreenShare]);

		if (!hasVideo) return null;

		return (
			<View style={styles.previewVideoContainer}>
				<DailyMediaView
					videoTrack={
						isScreenShare
							? callObject?.participants()[sessionId]?.tracks?.screenVideo
									?.track ?? null
							: callObject?.participants()[sessionId]?.tracks?.video?.track ??
							  null
					}
					audioTrack={
						callObject?.participants()[sessionId]?.tracks?.audio?.track ?? null
					}
					mirror={!isScreenShare}
					style={styles.previewVideo}
				/>
				<AudioWave id={sessionId} />
			</View>
		);
	}
);

VideoPreview.displayName = "VideoPreview";

const PreviewVideos = memo(() => {
	const { callObject } = useDailyContext();
	const { isScreenSharing } = useLocalScreenshare();
	const replicaIds = useReplicaIDs();
	const [localSessionId, setLocalSessionId] = useState<string | null>(null);
	const replicaId = replicaIds[0];

	useEffect(() => {
		if (!callObject) return;

		const updateLocalSessionId = () => {
			const localParticipant = callObject.participants().local;
			if (localParticipant) {
				setLocalSessionId(localParticipant.session_id);
			}
		};

		updateLocalSessionId();
		callObject.on("joined-meeting", updateLocalSessionId);

		return () => {
			callObject.off("joined-meeting", updateLocalSessionId);
		};
	}, [callObject]);

	return (
		<View style={styles.selfViewContainer}>
			{!!isScreenSharing && !!replicaId && (
				<VideoPreview sessionId={replicaId} />
			)}
			{localSessionId && <VideoPreview sessionId={localSessionId} />}
		</View>
	);
});

PreviewVideos.displayName = "PreviewVideos";

const MainVideoComponent = () => {
	const replicaIds = useReplicaIDs();
	const { callObject } = useDailyContext();
	const { isScreenSharing } = useLocalScreenshare();
	const [localSessionId, setLocalSessionId] = useState<string | null>(null);
	const [hasVideo, setHasVideo] = useState(true);
	const replicaId = replicaIds[0];

	useEffect(() => {
		if (!callObject) return;

		const updateState = () => {
			const localParticipant = callObject.participants().local;
			if (localParticipant) {
				setLocalSessionId(localParticipant.session_id);
			}
			if (replicaId) {
				const participants = callObject.participants();
				const replica = Object.values(participants).find(
					(p) => p.session_id === replicaId
				);
				if (replica) {
					setHasVideo(replica.tracks?.video?.state === "playable");
				}
			}
		};

		updateState();
		callObject.on("participant-updated", updateState);
		callObject.on("joined-meeting", updateState);

		return () => {
			callObject.off("participant-updated", updateState);
			callObject.off("joined-meeting", updateState);
		};
	}, [callObject, replicaId]);

	if (!replicaId) {
		return (
			<View style={styles.waitingContainer}>
				<Text style={styles.waitingText}>Connecting...</Text>
			</View>
		);
	}

	const displaySessionId =
		isScreenSharing && localSessionId ? localSessionId : replicaId;
	const isDisplayingScreenShare = isScreenSharing && localSessionId;

	// Get the actual video/audio track objects
	const participants = callObject?.participants() || {};
	const participant = Object.values(participants).find(
		(p: any) => p.session_id === displaySessionId
	);
	let videoTrack = null;
	let audioTrack = null;
	if (
		participant &&
		typeof participant === "object" &&
		"tracks" in participant &&
		participant.tracks
	) {
		const tracks = participant.tracks as {
			screenVideo?: { track?: any };
			video?: { track?: any };
			audio?: { track?: any };
		};
		if (isDisplayingScreenShare) {
			videoTrack = tracks.screenVideo?.track ?? null;
		} else {
			videoTrack = tracks.video?.track ?? null;
		}
		audioTrack = tracks.audio?.track ?? null;
	}

	// Only apply hidden style if hasVideo is false
	const mainVideoStyle = hasVideo
		? styles.mainVideo
		: { ...styles.mainVideo, ...styles.mainVideoHidden };

	return (
		<View style={styles.mainVideoContainer}>
			<DailyMediaView
				videoTrack={videoTrack}
				audioTrack={audioTrack}
				mirror={false}
				style={mainVideoStyle}
				zOrder={1}
			/>
		</View>
	);
};

const MainVideo = memo(MainVideoComponent);
MainVideo.displayName = "MainVideo";

export const Conversation = memo(
	({ onLeave, conversationUrl }: ConversationProps) => {
		const { joinCall, leaveCall } = useCVICall();
		const { callObject } = useDailyContext();
		// Removed unused meetingState variable
		const [hasError, setHasError] = useState(false);

		useEffect(() => {
			if (!callObject) return;

			const handleMeetingStateChange = (event: any) => {
				if (event.state === "error") {
					setHasError(true);
					Alert.alert("Error", "Failed to join the call. Please try again.");
					onLeave();
				}
			};

			callObject.on("meeting-session-state-updated", handleMeetingStateChange);

			return () => {
				callObject.off(
					"meeting-session-state-updated",
					handleMeetingStateChange
				);
			};
		}, [callObject, onLeave]);

		// Initialize call when conversation is available
		useEffect(() => {
			joinCall({ url: conversationUrl });
		}, [conversationUrl, joinCall]);

		const handleLeave = useCallback(async () => {
			await leaveCall();
			onLeave();
		}, [leaveCall, onLeave]);

		return (
			<View style={styles.container}>
				<View style={styles.videoContainer}>
					{hasError && (
						<View style={styles.errorContainer}>
							<Text style={styles.errorText}>
								Camera or microphone access denied. Please check your settings
								and try again.
							</Text>
						</View>
					)}

					{/* Main video */}
					<View style={styles.mainVideoWrapper}>
						<MainVideo />
					</View>

					{/* Self view */}
					<PreviewVideos />
				</View>

				<View style={styles.footer}>
					<View style={styles.footerControls}>
						<MicSelectBtn />
						<CameraSelectBtn />
						<ScreenShareButton />
						<TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
							<Ionicons name="close" size={24} color="#fff" />
						</TouchableOpacity>
					</View>
				</View>
			</View>
		);
	}
);

Conversation.displayName = "Conversation";

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1e1e1e",
	},
	videoContainer: {
		flex: 1,
		position: "relative",
	},
	mainVideoWrapper: {
		flex: 1,
	},
	mainVideoContainer: {
		flex: 1,
		backgroundColor: "#000",
		justifyContent: "center",
		alignItems: "center",
	},
	mainVideo: {
		width: "100%",
		height: "100%",
	},
	mainVideoHidden: {
		opacity: 0,
	},
	waitingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#000",
	},
	waitingText: {
		color: "#fff",
		fontSize: 18,
	},
	previewVideoContainer: {
		width: 120,
		height: 160,
		borderRadius: 12,
		overflow: "hidden",
		backgroundColor: "#2d2d2d",
		marginBottom: 8,
		position: "relative",
	},
	previewVideo: {
		width: "100%",
		height: "100%",
	},
	selfViewContainer: {
		position: "absolute",
		top: 60,
		right: 16,
		zIndex: 10,
	},
	errorContainer: {
		position: "absolute",
		top: 50,
		left: 16,
		right: 16,
		backgroundColor: "rgba(239, 68, 68, 0.9)",
		padding: 16,
		borderRadius: 8,
		zIndex: 100,
	},
	errorText: {
		color: "#fff",
		fontSize: 14,
		textAlign: "center",
	},
	footer: {
		backgroundColor: "rgba(0, 0, 0, 0.8)",
		paddingVertical: 20,
		paddingBottom: 40,
	},
	footerControls: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
	leaveButton: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: "#ef4444",
		justifyContent: "center",
		alignItems: "center",
		marginHorizontal: 8,
	},
});
