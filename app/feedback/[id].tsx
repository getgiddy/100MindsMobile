import CircularProgress from "@/components/CircularProgress";
import { Text, View } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { feedbackItems } from "@/constants/feedback";
import { Stack, useLocalSearchParams } from "expo-router";
import { View as RNView, ScrollView, StyleSheet } from "react-native";

export default function FeedbackDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const item = feedbackItems.find((f) => f.id === id);

	return (
		<>
			<Stack.Screen options={{ title: "Session Feedback" }} />
			<ScrollView contentContainerStyle={styles.container}>
				{/* Overall Performance Card */}
				<View style={styles.card}>
					<RNView style={styles.centerRow}>
						<CircularProgress score={item?.score ?? 0} size={64} />
					</RNView>
					<Text style={styles.heading}>Overall Performance</Text>
					<Text style={styles.subtext}>
						Great Job! You handled the situations well
					</Text>
					<RNView style={styles.starsRow}>
						<Text style={styles.star}>⭐️⭐️⭐️⭐️☆</Text>
					</RNView>
				</View>

				{/* Performance Breakdown */}
				<View style={styles.card}>
					<Text style={styles.sectionTitle}>Performance Breakdown</Text>
					{breakdown.map((b) => (
						<RNView key={b.label} style={styles.breakdownRow}>
							<Text style={styles.breakdownLabel}>{b.label}</Text>
							<RNView style={styles.progressBarBg}>
								<RNView
									style={[
										styles.progressBarFill,
										{ width: `${b.value}%`, backgroundColor: b.color },
									]}
								/>
							</RNView>
							<Text style={styles.breakdownValue}>{b.value}%</Text>
						</RNView>
					))}
				</View>

				{/* What you did well */}
				<View style={styles.card}>
					<RNView style={styles.sectionHeaderRow}>
						<RNView style={[styles.iconCircle, { backgroundColor: "#E6F5EF" }]}>
							<Text style={[styles.iconText, { color: Colors.light.tint }]}>
								👍
							</Text>
						</RNView>
						<Text style={styles.sectionTitle}>What you did well</Text>
					</RNView>

					{positives.map((p) => (
						<RNView key={p.title} style={styles.bulletBlock}>
							<RNView
								style={[
									styles.bulletDot,
									{ backgroundColor: Colors.light.tint },
								]}
							/>
							<RNView style={styles.bulletContent}>
								<Text style={styles.bulletTitle}>{p.title}</Text>
								<Text style={styles.bulletText}>{p.text}</Text>
							</RNView>
						</RNView>
					))}
				</View>

				{/* Areas to Improve */}
				<View style={styles.card}>
					<RNView style={styles.sectionHeaderRow}>
						<RNView style={[styles.iconCircle, { backgroundColor: "#FFF3D6" }]}>
							<Text style={[styles.iconText, { color: "#F4C44E" }]}>🔧</Text>
						</RNView>
						<Text style={styles.sectionTitle}>Areas to Improve</Text>
					</RNView>

					{improvements.map((p) => (
						<RNView key={p.title} style={styles.bulletBlock}>
							<RNView
								style={[styles.bulletDot, { backgroundColor: p.dotColor }]}
							/>
							<RNView style={styles.bulletContent}>
								<Text style={styles.bulletTitle}>{p.title}</Text>
								<Text style={styles.bulletText}>{p.text}</Text>
								<View style={[styles.tipBox, { backgroundColor: p.tipBg }]}>
									<Text style={styles.tipText}>{p.tip}</Text>
								</View>
							</RNView>
						</RNView>
					))}
				</View>

				{/* Actions */}
				<RNView style={styles.actions}>
					<View
						style={[styles.primaryBtn, { backgroundColor: Colors.light.tint }]}
					>
						<Text style={styles.primaryBtnText}>Replay Scenario</Text>
					</View>
					<View style={styles.secondaryBtn}>
						<Text style={styles.secondaryBtnText}>View All Feedbacks</Text>
					</View>
				</RNView>
			</ScrollView>
		</>
	);
}

const breakdown = [
	{ label: "Communication", value: 90, color: Colors.light.tint },
	{ label: "Problem Solving", value: 70, color: "#F4C44E" },
	{ label: "Empathy", value: 44, color: "#E35D5D" },
	{ label: "Response Time", value: 52, color: "#F4C44E" },
	{ label: "Ideation", value: 12, color: "#E35D5D" },
];

const positives = [
	{
		title: "Active Listening",
		text: "You demonstrated excellent active listening skills by acknowledging the customer's concerns and asking clarifying questions.",
	},
	{
		title: "Empathy & Understanding",
		text: "Your empathetic responses helped build rapport and made the customer feel heard and valued.",
	},
	{
		title: "Solution-Oriented Approach",
		text: "You quickly identified the problem and provided practical solutions that addressed the customer's needs.",
	},
];

const improvements = [
	{
		title: "Response Time",
		text: "Consider responding more quickly to maintain conversation flow and show engagement.",
		tip: "Tip: Aim to respond within 2-3 seconds to maintain natural conversation rhythm.",
		tipBg: "#FFF3D6",
		dotColor: "#F4C44E",
	},
	{
		title: "Follow-up Questions",
		text: "Ask more follow-up questions to better understand the customer's specific situation and needs.",
		tip: 'Tip: Use open-ended questions like "Can you tell me more about..." or "How did that make you feel?"',
		tipBg: "#FFF3D6",
		dotColor: "#F4C44E",
	},
];

const styles = StyleSheet.create({
	container: {
		padding: 16,
		gap: 16,
	},
	card: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		shadowColor: "#000",
		shadowOpacity: 0.08,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
	},
	centerRow: {
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 6,
	},
	heading: {
		marginTop: 8,
		fontSize: 18,
		fontWeight: "700",
		color: "#222",
		textAlign: "center",
	},
	subtext: {
		marginTop: 4,
		fontSize: 14,
		color: "#666",
		textAlign: "center",
	},
	starsRow: {
		alignItems: "center",
		marginTop: 8,
	},
	star: {
		fontSize: 18,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#222",
		marginBottom: 12,
	},
	breakdownRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 10,
	},
	breakdownLabel: {
		width: 130,
		fontSize: 14,
		color: "#444",
		fontWeight: "600",
	},
	progressBarBg: {
		flex: 1,
		height: 8,
		borderRadius: 8,
		backgroundColor: "#EFEFEF",
		overflow: "hidden",
	},
	progressBarFill: {
		height: 8,
		borderRadius: 8,
	},
	breakdownValue: {
		width: 40,
		textAlign: "right",
		fontSize: 14,
		color: "#666",
		fontWeight: "600",
	},
	sectionHeaderRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginBottom: 12,
	},
	iconCircle: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	iconText: {
		fontSize: 16,
		fontWeight: "700",
	},
	bulletBlock: {
		flexDirection: "row",
		gap: 12,
		marginBottom: 12,
	},
	bulletDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginTop: 6,
	},
	bulletContent: {
		flex: 1,
	},
	bulletTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#222",
		marginBottom: 6,
	},
	bulletText: {
		fontSize: 14,
		color: "#444",
	},
	tipBox: {
		marginTop: 10,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	tipText: {
		fontSize: 13,
		color: "#6A5B2E",
		fontWeight: "600",
	},
	actions: {
		marginTop: 8,
		gap: 12,
	},
	primaryBtn: {
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: "center",
	},
	primaryBtnText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 16,
	},
	secondaryBtn: {
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#E0E0E0",
		backgroundColor: "#fff",
	},
	secondaryBtnText: {
		color: "#333",
		fontWeight: "700",
		fontSize: 16,
	},
});
