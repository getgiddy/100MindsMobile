import ScenarioDetailView from "@/components/ScenarioDetailView";
import { useScenario } from "@/hooks";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Scenario detail screen
 * Dynamic route: /scenario/[id]
 */
export default function ScenarioDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { data: scenario, isLoading, error } = useScenario(id);

	if (isLoading) {
		return (
			<SafeAreaView style={styles.container}>
				<Stack.Screen options={{ title: "Loading..." }} />
				<View style={styles.centerContainer}>
					<ActivityIndicator size="large" color="#006d6d" />
					<Text style={styles.loadingText}>Loading scenario...</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (error || !scenario) {
		return (
			<SafeAreaView style={styles.container}>
				<Stack.Screen options={{ title: "Error" }} />
				<View style={styles.centerContainer}>
					<Text style={styles.errorText}>Scenario not found</Text>
					<Text style={styles.backLink} onPress={() => router.back()}>
						Go Back
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<>
			<Stack.Screen options={{ title: scenario.title }} />
			<ScenarioDetailView scenario={scenario} />
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	centerContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	loadingText: {
		marginTop: 12,
		fontSize: 15,
		color: "#666",
	},
	errorText: {
		fontSize: 16,
		color: "#ef4444",
		marginBottom: 16,
	},
	backLink: {
		fontSize: 15,
		color: "#006d6d",
		fontWeight: "600",
	},
});
