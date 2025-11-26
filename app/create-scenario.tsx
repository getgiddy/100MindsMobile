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

const SUGGESTED_TAGS = [
	"Team Management",
	"Leadership",
	"Performance",
	"Recruitment HR",
	"Conflict Resolution",
];

export default function CreateScenarioScreen() {
	const [label, setLabel] = useState("");
	const [description, setDescription] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");

	const descriptionCount = useMemo(() => description.length, [description]);

	function addTag(tag: string) {
		const t = tag.trim();
		if (!t) return;
		if (!tags.includes(t)) {
			setTags([...tags, t]);
		}
		setTagInput("");
	}

	function removeTag(tag: string) {
		setTags(tags.filter((t) => t !== tag));
	}

	const onSubmit = () => {
		router.back();
	};

	return (
		<SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
			<Stack.Screen options={{ title: "Create Scenario" }} />
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView contentContainerStyle={styles.container}>
					{/* Label */}
					<View style={styles.card}>
						<Text style={styles.label}>
							Label<Text style={styles.required}> *</Text>
						</Text>
						<View style={styles.inputBox}>
							<TextInput
								placeholder="Placeholder text..."
								value={label}
								onChangeText={setLabel}
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
								placeholder="Briefly Describe Your Scenario"
								value={description}
								onChangeText={setDescription}
								multiline
								style={[styles.textInput, { height: 96 }]}
							/>
							<Text style={styles.counter}>{descriptionCount}/150</Text>
						</View>
						<Text style={styles.helper}>Briefly Describe Your Scenario</Text>
					</View>

					{/* Tag input */}
					<View style={styles.card}>
						<Text style={styles.label}>
							Tag input<Text style={styles.required}> *</Text>
						</Text>
						<View style={styles.inputBox}>
							<TextInput
								placeholder="Add tags..."
								value={tagInput}
								onChangeText={setTagInput}
								onSubmitEditing={() => addTag(tagInput)}
								style={styles.textInput}
								returnKeyType="done"
							/>
						</View>
						<Text style={styles.helper}>Add a tag and press Enter</Text>

						{/* Current tags */}
						{tags.length > 0 && (
							<View style={styles.tagsContainer}>
								{tags.map((t) => (
									<View key={t} style={styles.tagChipSelected}>
										<Text style={styles.tagTextSelected}>{t}</Text>
									</View>
								))}
							</View>
						)}
					</View>

					{/* Suggested Tags */}
					<View style={styles.card}>
						<Text style={styles.label}>Suggested Tags</Text>
						<View style={styles.tagsContainer}>
							{SUGGESTED_TAGS.map((t) => {
								const isSelected = tags.includes(t);
								return (
									<Text
										key={t}
										onPress={() => (isSelected ? removeTag(t) : addTag(t))}
										style={
											isSelected
												? styles.tagChipSelectedText
												: styles.tagChipText
										}
									>
										{t}
									</Text>
								);
							})}
						</View>
					</View>

					{/* Actions */}
					<View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
						<Button title="Create Scenario" onPress={onSubmit} variant="primary" style={{ marginBottom: 12 }} />
						<Button title="Cancel" onPress={() => router.back()} variant="secondary" />
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
	helper: { marginTop: 8, color: "#7a7a7a" },
	counter: { position: "absolute", right: 10, bottom: 10, color: "#7a7a7a" },
	tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	tagChipText: {
		backgroundColor: "#dff5f2",
		color: "#006d6d",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 16,
		marginRight: 8,
		marginBottom: 8,
	},
	tagChipSelectedText: {
		backgroundColor: "#006d6d",
		color: "#fff",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 16,
		marginRight: 8,
		marginBottom: 8,
	},
	tagChipSelected: {
		backgroundColor: "#006d6d",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 16,
		marginRight: 8,
		marginBottom: 8,
	},
	tagTextSelected: { color: "#fff" },
 
});
