import React, { memo, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useDailyContext } from "../cvi-provider";

interface AudioWaveProps {
	id: string;
}

export const AudioWave = memo(({ id }: AudioWaveProps) => {
	const { callObject } = useDailyContext();
	const [isActiveSpeaker, setIsActiveSpeaker] = useState(false);

	const leftBarHeight = useRef(new Animated.Value(20)).current;
	const centerBarHeight = useRef(new Animated.Value(20)).current;
	const rightBarHeight = useRef(new Animated.Value(20)).current;

	useEffect(() => {
		if (!callObject) return;

		const handleActiveSpeakerChange = (event: any) => {
			setIsActiveSpeaker(event.activeSpeaker?.peerId === id);
		};

		const handleAudioLevel = (event: any) => {
			if (event.participantId === id) {
				const volume = Math.max(0.01, event.audioLevel);

				Animated.parallel([
					Animated.timing(leftBarHeight, {
						toValue: 20 + volume * 40,
						duration: 100,
						useNativeDriver: false,
					}),
					Animated.timing(centerBarHeight, {
						toValue: 20 + volume * 130,
						duration: 100,
						useNativeDriver: false,
					}),
					Animated.timing(rightBarHeight, {
						toValue: 20 + volume * 40,
						duration: 100,
						useNativeDriver: false,
					}),
				]).start();
			}
		};

		callObject.on("active-speaker-change", handleActiveSpeakerChange);
		// Note: audio level events may need additional setup in Daily.co

		return () => {
			callObject.off("active-speaker-change", handleActiveSpeakerChange);
		};
	}, [callObject, id, leftBarHeight, centerBarHeight, rightBarHeight]);

	return (
		<View style={styles.container}>
			<View style={styles.waveContainer}>
				<Animated.View
					style={[
						styles.bar,
						!isActiveSpeaker && styles.barInactive,
						{
							height: leftBarHeight.interpolate({
								inputRange: [0, 100],
								outputRange: ["0%", "100%"],
							}),
						},
					]}
				/>
				<Animated.View
					style={[
						styles.bar,
						!isActiveSpeaker && styles.barInactive,
						{
							height: centerBarHeight.interpolate({
								inputRange: [0, 100],
								outputRange: ["0%", "100%"],
							}),
						},
					]}
				/>
				<Animated.View
					style={[
						styles.bar,
						!isActiveSpeaker && styles.barInactive,
						{
							height: rightBarHeight.interpolate({
								inputRange: [0, 100],
								outputRange: ["0%", "100%"],
							}),
						},
					]}
				/>
			</View>
		</View>
	);
});

AudioWave.displayName = "AudioWave";

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		bottom: 8,
		left: 8,
		right: 8,
	},
	waveContainer: {
		flexDirection: "row",
		alignItems: "flex-end",
		justifyContent: "center",
		height: 40,
		gap: 4,
	},
	bar: {
		width: 4,
		backgroundColor: "#22c55e",
		borderRadius: 2,
		minHeight: 8,
	},
	barInactive: {
		backgroundColor: "#64748b",
	},
});
