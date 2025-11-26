import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import IconButton from "@/components/IconButton";
import Logo from "@/components/Logo";
import ScenarioCard from "@/components/ScenarioCard";
import { SpacerMedium, SpacerSmall } from "@/components/spacers";
import { useScenarios } from "@/hooks";
import type { ScenarioCategory } from "@/types";

const SCENARIO_CATEGORIES = [
	{ id: 1, name: "All" as const },
	{ id: 2, name: "Team Management" as ScenarioCategory },
	{ id: 3, name: "Conflict Resolution" as ScenarioCategory },
	{ id: 4, name: "Leadership" as ScenarioCategory },
	{ id: 5, name: "Performance" as ScenarioCategory },
];

export default function TabOneScreen() {
	const [selectedCategory, setSelectedCategory] = useState<number>(1);
	// Fetch scenarios with the data layer
	const filter =
		selectedCategory === 1
			? undefined
			: { category: SCENARIO_CATEGORIES[selectedCategory - 1].name };
	const { data: scenarios = [], isLoading, error } = useScenarios(filter);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
			<View style={styles.container}>
				<View style={[styles.logoContainer]}>
					<Logo />
				</View>
				<SpacerSmall />
				<View style={styles.headerContainer}>
					<Text style={styles.title}>Practice Scenarios</Text>
					<SpacerSmall />
					<Text>Choose a scenario to practice your leadership skills</Text>
				</View>
				<SpacerMedium />
				<View>
					<IconButton
						icon="add"
						label="Create New Scenario"
						onPress={() => router.push("/create-scenario")}
					/>
				</View>
				<SpacerMedium />
			</View>
			<View style={{ flex: 1 }}>
				{/* Horizontal scrollable list of scenario categories */}
				<View
					style={{
						maxHeight: 48,
						backgroundColor: "white",
					}}
				>
					<FlatList
						style={{ paddingHorizontal: 16, paddingVertical: 8 }}
						data={SCENARIO_CATEGORIES}
						renderItem={({ item }) => (
							<Pressable
								style={{
									marginRight: 8,
									paddingHorizontal: 8,
									paddingVertical: 4,
									backgroundColor:
										selectedCategory === item.id ? "#009999" : "#f0f0f0",
									borderRadius: 8,
								}}
								onPress={() => setSelectedCategory(item.id)}
							>
								<Text
									style={{
										fontSize: 12,
										color: selectedCategory === item.id ? "#fff" : "#1f1f1f",
									}}
								>
									{item.name}
								</Text>
							</Pressable>
						)}
						horizontal
						showsHorizontalScrollIndicator={false}
					/>
				</View>

				{/* List of scenarios */}
				<View style={{ flex: 1, padding: 16, backgroundColor: "#f5f5f5" }}>
					{isLoading && (
						<Text style={{ textAlign: "center", marginTop: 20 }}>
							Loading scenarios...
						</Text>
					)}
					{error && (
						<Text
							style={{ textAlign: "center", marginTop: 20, color: "#ff0000" }}
						>
							Error loading scenarios
						</Text>
					)}
					{!isLoading && scenarios.length === 0 && (
						<Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
							No scenarios found
						</Text>
					)}
					<FlatList
						data={scenarios}
						renderItem={({ item }) => (
							<ScenarioCard
								title={item.title}
								description={item.description}
								category={item.category}
								duration={`${item.duration} min`}
								imageSource={item.imageSource}
								onPress={() => {}}
							/>
						)}
						keyExtractor={(item) => item.id}
						showsVerticalScrollIndicator={false}
					/>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#fff",
	},
	container: {
		backgroundColor: "#fff",
		paddingHorizontal: 16,
	},
	logoContainer: {
		alignItems: "center",
		justifyContent: "flex-end",
		flexDirection: "row",
		maxHeight: 32,
	},
	headerContainer: {
		borderColor: "#05D1D1",
		borderWidth: 1,
		padding: 16,
		borderRadius: 12,
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
	},
});
