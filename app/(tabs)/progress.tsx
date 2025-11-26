import CircularProgress from "@/components/CircularProgress";
import { Text, View } from "@/components/Themed";
import { useUserProgress } from "@/hooks";
import {
	ActivityIndicator,
	View as RNView,
	ScrollView,
	StyleSheet,
} from "react-native";

export default function ProgressScreen() {
	const { data: progress, isLoading, error } = useUserProgress();

	if (isLoading) {
		return (
			<View style={styles.container}>
				<ActivityIndicator size="large" color="#009999" />
			</View>
		);
	}

	if (error || !progress) {
		return (
			<View style={styles.container}>
				<Text style={styles.errorText}>Error loading progress</Text>
			</View>
		);
	}

	return (
		<ScrollView style={styles.scrollView}>
			<View style={styles.container}>
				<Text style={styles.header}>Your Progress</Text>

				{/* Overall Score Card */}
				<RNView style={styles.card}>
					<RNView style={styles.scoreContainer}>
						<CircularProgress score={progress.averageScore} size={120} />
					</RNView>
					<Text style={styles.cardTitle}>Overall Average Score</Text>
					<Text style={styles.sessionCount}>
						{progress.totalSessionsCompleted}{" "}
						{progress.totalSessionsCompleted === 1 ? "session" : "sessions"}{" "}
						completed
					</Text>
				</RNView>

				{/* Improvement Trend */}
				{progress.improvementTrend !== 0 && (
					<RNView style={styles.card}>
						<Text style={styles.cardTitle}>Improvement Trend</Text>
						<Text
							style={[
								styles.trendValue,
								{
									color: progress.improvementTrend > 0 ? "#22c55e" : "#ef4444",
								},
							]}
						>
							{progress.improvementTrend > 0 ? "+" : ""}
							{progress.improvementTrend}%
						</Text>
						<Text style={styles.trendLabel}>
							{progress.improvementTrend > 0
								? "You're improving!"
								: "Keep practicing!"}
						</Text>
					</RNView>
				)}

				{/* Category Breakdown */}
				{progress.categoryBreakdown.length > 0 && (
					<RNView style={styles.card}>
						<Text style={styles.cardTitle}>Performance by Category</Text>
						{progress.categoryBreakdown.map((cat) => (
							<RNView key={cat.category} style={styles.categoryRow}>
								<RNView style={styles.categoryInfo}>
									<Text style={styles.categoryName}>{cat.category}</Text>
									<Text style={styles.categoryCount}>
										{cat.sessionsCompleted}{" "}
										{cat.sessionsCompleted === 1 ? "session" : "sessions"}
									</Text>
								</RNView>
								<RNView style={styles.categoryScore}>
									<Text style={styles.scoreText}>
										{Math.round(cat.averageScore)}
									</Text>
								</RNView>
							</RNView>
						))}
					</RNView>
				)}

				{progress.totalSessionsCompleted === 0 && (
					<RNView style={styles.emptyState}>
						<Text style={styles.emptyText}>No sessions completed yet</Text>
						<Text style={styles.emptySubtext}>
							Start practicing scenarios to see your progress!
						</Text>
					</RNView>
				)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	container: {
		flex: 1,
		padding: 16,
	},
	header: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 20,
		color: "#1f1f1f",
	},
	card: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 20,
		marginBottom: 16,
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	scoreContainer: {
		alignItems: "center",
		marginBottom: 16,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#1f1f1f",
		marginBottom: 12,
		textAlign: "center",
	},
	sessionCount: {
		fontSize: 14,
		color: "#666",
		textAlign: "center",
	},
	trendValue: {
		fontSize: 36,
		fontWeight: "bold",
		textAlign: "center",
		marginVertical: 8,
	},
	trendLabel: {
		fontSize: 14,
		color: "#666",
		textAlign: "center",
	},
	categoryRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	categoryInfo: {
		flex: 1,
	},
	categoryName: {
		fontSize: 14,
		fontWeight: "600",
		color: "#1f1f1f",
		marginBottom: 4,
	},
	categoryCount: {
		fontSize: 12,
		color: "#666",
	},
	categoryScore: {
		backgroundColor: "#E6F7F7",
		borderRadius: 20,
		width: 48,
		height: 48,
		alignItems: "center",
		justifyContent: "center",
	},
	scoreText: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#009999",
	},
	errorText: {
		color: "#ff0000",
		fontSize: 16,
		textAlign: "center",
	},
	emptyState: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 40,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#333",
		marginBottom: 8,
	},
	emptySubtext: {
		fontSize: 14,
		color: "#666",
		textAlign: "center",
	},
});
