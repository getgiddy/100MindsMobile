import Picker from "@/components/Picker";
import { scenarioService } from "@/services/scenarioService";
import type { CreateScenarioInput, ScenarioCategory } from "@/types";
import { validateScenarioInput } from "@/utils/validation";
import { Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button";

export default function CreateScenarioScreen() {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState<ScenarioCategory>("Leadership");
	const [validationErrors, setValidationErrors] = useState<string[]>([]);

	const descriptionCount = useMemo(() => description.length, [description]);

	const onSubmit = async () => {
		const input: CreateScenarioInput = {
			title: title.trim(),
			description: description.trim(),
			category,
			duration: 5, // Default 5 minutes
		};

		const validation = validateScenarioInput(input);
		if (!validation.isValid) {
			setValidationErrors(validation.errors.map((e) => e.message));
			return;
		}

		setValidationErrors([]);

		try {
			await scenarioService.createScenario(input);
			router.back();
		} catch (e) {
			const error = e as Error;
			setValidationErrors([error.message || "Failed to create scenario"]);
		}
	};

	return (
		<SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
			<Stack.Screen options={{ title: "Create Scenario" }} />
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView contentContainerStyle={styles.container}>
					{/* Title */}
					<View style={styles.card}>
						<Text style={styles.label}>
							Title<Text style={styles.required}> *</Text>
						</Text>
						<View style={styles.inputBox}>
							<TextInput
								placeholder="Enter scenario title..."
								value={title}
								onChangeText={setTitle}
								style={styles.textInput}
							/>
						</View>
					</View>

					{/* Description */}
					<View style={styles.card}>
						<Text style={styles.label}>
							Description<Text style={styles.required}> *</Text>
						</Text>
					<View style={[styles.inputBox, { minHeight: 112 }]}>
						<TextInput
							placeholder="Briefly describe your scenario..."
							value={description}
							onChangeText={setDescription}
							multiline
							style={[styles.textInput, { height: 96 }]}
							maxLength={500}
						/>
						<Text style={styles.counter}>{descriptionCount}/500</Text>
					</View>
					</View>

					{/* Validation Errors */}
					{validationErrors.length > 0 && (
						<View style={styles.errorCard}>
							{validationErrors.map((error, idx) => (
								<Text key={idx} style={styles.errorText}>
									• {error}
								</Text>
							))}
						</View>
					)}

					{/* Category */}
					<View style={styles.card}>
						<Picker
							label="Category"
							value={category}
							options={
								[
									"Team Management",
									"Leadership",
									"Performance",
									"Conflict Resolution",
									"Communication",
									"Decision Making",
								] as const
							}
							onChange={setCategory}
						/>
					</View>

					{/* Actions */}
					<View
						style={{ paddingHorizontal: 16, paddingBottom: 24, marginTop: 8 }}
					>
						<Button
							title="Create Scenario"
							onPress={onSubmit}
							variant="primary"
							style={{ marginBottom: 12 }}
						/>
						<Button
							title="Cancel"
							onPress={() => router.back()}
							variant="secondary"
						/>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#fff" },
	container: { paddingBottom: 24 },
	card: {
		marginHorizontal: 16,
		marginBottom: 16,
		backgroundColor: "#fff",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#eee",
		padding: 12,
	},
	label: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
	required: { color: "#e34a4a" },
	inputBox: {
		borderWidth: 1,
		borderColor: "#e5e5e5",
		backgroundColor: "#f8f8f8",
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	textInput: { fontSize: 14 },
	helper: { marginTop: 8, fontSize: 13, color: "#7a7a7a" },
	counter: {
		position: "absolute",
		right: 10,
		bottom: 10,
		fontSize: 12,
		color: "#7a7a7a",
	},
	errorCard: {
		marginHorizontal: 16,
		marginBottom: 16,
		backgroundColor: "#FEF2F2",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#FCA5A5",
		padding: 12,
	},
	errorText: {
		color: "#991B1B",
		fontSize: 13,
		marginBottom: 4,
	},
});
