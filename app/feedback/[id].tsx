import CircularProgress from "@/components/CircularProgress";
import { Text, View } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useFeedbackSession, useScenario } from "@/hooks";
import { Stack, useLocalSearchParams } from "expo-router";
import {
	ActivityIndicator,
	View as RNView,
	ScrollView,
	StyleSheet,
} from "react-native";

export default function FeedbackDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { data: session, isLoading, error } = useFeedbackSession(id || "");
	const { data: scenario } = useScenario(session?.scenarioId || "");
	const analysis = session?.analysis;

	const breakdown = analysis
		? [
				{
					label: "Communication",
					value: analysis.communicationScore,
					color: Colors.light.tint,
				},
				{
					label: "Problem Solving",
					value: analysis.problemSolvingScore,
					color: "#F4C44E",
				},
				{ label: "Empathy", value: analysis.empathyScore, color: "#E35D5D" },
		  ]
		: [];

	return (
		<>
			<Stack.Screen options={{ title: "Session Feedback" }} />
			{isLoading && (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={Colors.light.tint} />
					<Text style={styles.loadingText}>Loading feedback...</Text>
				</View>
			)}
			{!isLoading && error && (
				<View style={styles.loadingContainer}>
					<Text style={styles.errorText}>Failed to load feedback.</Text>
				</View>
			)}
			{!isLoading && !error && !session && (
				<View style={styles.loadingContainer}>
					<Text style={styles.errorText}>Feedback session not found.</Text>
				</View>
			)}
			{session && (
				<ScrollView contentContainerStyle={styles.container}>
					<View style={styles.card}>
						<RNView style={styles.centerRow}>
							<CircularProgress score={session.score} size={80} />
						</RNView>
						<Text style={styles.heading}>{scenario?.title || "Scenario"}</Text>
						<Text style={styles.subtext}>
							{scenario?.category} •{" "}
							{new Date(session.completedAt).toLocaleDateString()}
						</Text>
					</View>

					<View style={styles.card}>
						<Text style={styles.sectionTitle}>Performance Breakdown</Text>
						{breakdown.length === 0 && (
							<Text style={styles.placeholderText}>
								No detailed analysis available.
							</Text>
						)}
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

					{analysis?.keyInsights?.length ? (
						<View style={styles.card}>
							<Text style={styles.sectionTitle}>Key Insights</Text>
							{analysis.keyInsights.map((k) => (
								<RNView key={k} style={styles.bulletBlock}>
									<RNView
										style={[
											styles.bulletDot,
											{ backgroundColor: Colors.light.tint },
										]}
									/>
									<RNView style={styles.bulletContent}>
										<Text style={styles.bulletText}>{k}</Text>
									</RNView>
								</RNView>
							))}
						</View>
					) : null}

					<View style={styles.card}>
						<RNView style={styles.sectionHeaderRow}>
							<RNView
								style={[styles.iconCircle, { backgroundColor: "#E6F5EF" }]}
							>
								<Text style={[styles.iconText, { color: Colors.light.tint }]}>
									👍
								</Text>
							</RNView>
							<Text style={styles.sectionTitle}>Strengths</Text>
						</RNView>
						{analysis?.strengths?.length ? (
							analysis.strengths.map((s) => (
								<RNView key={s} style={styles.bulletBlock}>
									<RNView
										style={[
											styles.bulletDot,
											{ backgroundColor: Colors.light.tint },
										]}
									/>
									<RNView style={styles.bulletContent}>
										<Text style={styles.bulletText}>{s}</Text>
									</RNView>
								</RNView>
							))
						) : (
							<Text style={styles.placeholderText}>No strengths recorded.</Text>
						)}
					</View>

					<View style={styles.card}>
						<RNView style={styles.sectionHeaderRow}>
							<RNView
								style={[styles.iconCircle, { backgroundColor: "#FFF3D6" }]}
							>
								<Text style={[styles.iconText, { color: "#F4C44E" }]}>🔧</Text>
							</RNView>
							<Text style={styles.sectionTitle}>Areas for Improvement</Text>
						</RNView>
						{analysis?.areasForImprovement?.length ? (
							analysis.areasForImprovement.map((a) => (
								<RNView key={a} style={styles.bulletBlock}>
									<RNView
										style={[styles.bulletDot, { backgroundColor: "#F4C44E" }]}
									/>
									<RNView style={styles.bulletContent}>
										<Text style={styles.bulletText}>{a}</Text>
									</RNView>
								</RNView>
							))
						) : (
							<Text style={styles.placeholderText}>
								No improvement suggestions.
							</Text>
						)}
					</View>

					<RNView style={styles.actions}>
						<View
							style={[
								styles.primaryBtn,
								{ backgroundColor: Colors.light.tint },
							]}
						>
							<Text style={styles.primaryBtnText}>Replay Scenario</Text>
						</View>
						<View style={styles.secondaryBtn}>
							<Text style={styles.secondaryBtnText}>View All Feedbacks</Text>
						</View>
					</RNView>
				</ScrollView>
			)}
		</>
	);
}

// Styles
const styles = StyleSheet.create({
	container: {
		padding: 16,
		gap: 16,
	},
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 32,
	},
	loadingText: {
		marginTop: 12,
		fontSize: 16,
		color: "#666",
	},
	errorText: {
		fontSize: 16,
		color: "#E53935",
		fontWeight: "600",
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
	scoreSummaryRow: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 12,
		gap: 8,
	},
	summaryScoreLabel: {
		fontSize: 14,
		color: "#555",
		fontWeight: "600",
	},
	summaryScoreValue: {
		fontSize: 16,
		fontWeight: "700",
		color: Colors.light.tint,
	},
	subtext: {
		marginTop: 4,
		fontSize: 14,
		color: "#666",
		textAlign: "center",
	},
	placeholderText: {
		fontSize: 14,
		color: "#777",
		fontStyle: "italic",
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
