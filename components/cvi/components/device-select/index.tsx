import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useLocalCamera } from "../../hooks/use-local-camera";
import { useLocalMicrophone } from "../../hooks/use-local-microphone";
import { useLocalScreenshare } from "../../hooks/use-local-screenshare";

export const MicSelectBtn = memo(() => {
	const { onToggleMicrophone, isMicReady, isMicMuted } = useLocalMicrophone();

	return (
		<TouchableOpacity
			onPress={onToggleMicrophone}
			disabled={!isMicReady}
			style={[
				styles.deviceButton,
				isMicMuted && styles.deviceButtonMuted,
				!isMicReady && styles.deviceButtonDisabled,
			]}
		>
			<Ionicons
				name={isMicMuted || !isMicReady ? "mic-off" : "mic"}
				size={24}
				color={isMicMuted || !isMicReady ? "#ef4444" : "#fff"}
			/>
		</TouchableOpacity>
	);
});

MicSelectBtn.displayName = "MicSelectBtn";

export const CameraSelectBtn = memo(() => {
	const { onToggleCamera, isCamReady, isCamMuted } = useLocalCamera();

	return (
		<TouchableOpacity
			onPress={onToggleCamera}
			disabled={!isCamReady}
			style={[
				styles.deviceButton,
				isCamMuted && styles.deviceButtonMuted,
				!isCamReady && styles.deviceButtonDisabled,
			]}
		>
			<Ionicons
				name={isCamMuted ? "videocam-off" : "videocam"}
				size={24}
				color={isCamMuted ? "#ef4444" : "#fff"}
			/>
		</TouchableOpacity>
	);
});

CameraSelectBtn.displayName = "CameraSelectBtn";

export const ScreenShareButton = memo(() => {
	const { onToggleScreenshare, isScreenSharing } = useLocalScreenshare();

	return (
		<TouchableOpacity
			onPress={onToggleScreenshare}
			style={[
				styles.deviceButton,
				isScreenSharing && styles.deviceButtonActive,
			]}
		>
			<Ionicons
				name={isScreenSharing ? "stop-circle" : "share"}
				size={24}
				color={isScreenSharing ? "#2D65FF" : "#fff"}
			/>
		</TouchableOpacity>
	);
});

ScreenShareButton.displayName = "ScreenShareButton";

const styles = StyleSheet.create({
	deviceButton: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
		marginHorizontal: 8,
	},
	deviceButtonMuted: {
		backgroundColor: "rgba(239, 68, 68, 0.2)",
	},
	deviceButtonActive: {
		backgroundColor: "rgba(45, 101, 255, 0.2)",
	},
	deviceButtonDisabled: {
		opacity: 0.5,
	},
});
