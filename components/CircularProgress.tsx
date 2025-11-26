import { Text, View } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

type CircularProgressProps = {
	readonly score: number;
	readonly size?: number;
};

export default function CircularProgress({
	score,
	size = 56,
}: CircularProgressProps) {
	const strokeWidth = 4;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const progress = (score / 100) * circumference;
	const color = ringColor(score);
	const center = size / 2;

	return (
		<View
			style={[
				styles.container,
				{ width: size, height: size, borderRadius: size / 2 },
			]}
		>
			<Svg width={size} height={size} style={styles.svg}>
				{/* Background circle */}
				<Circle
					cx={center}
					cy={center}
					r={radius}
					stroke="#E0E0E0"
					strokeWidth={strokeWidth}
					fill="none"
				/>
				{/* Progress circle */}
				<Circle
					cx={center}
					cy={center}
					r={radius}
					stroke={color}
					strokeWidth={strokeWidth}
					fill="none"
					strokeDasharray={`${progress} ${circumference}`}
					strokeLinecap="round"
					rotation="-90"
					origin={`${center}, ${center}`}
				/>
			</Svg>
			<Text style={[styles.scoreText, { fontSize: size * 0.32 }]}>{score}</Text>
		</View>
	);
}

function ringColor(score: number) {
	if (score >= 80) return Colors.light.tint; // green
	if (score >= 60) return "#F4C44E"; // yellow
	return "#E35D5D"; // red
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#F7F7F7",
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
	},
	svg: {
		position: "absolute",
	},
	scoreText: {
		fontWeight: "700",
		color: "#333",
	},
});
