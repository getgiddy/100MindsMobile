import DocumentPicker from "@/components/DocumentPicker";
import Picker from "@/components/Picker";
import { documentService } from "@/services/documentService";
import { scenarioService } from "@/services/scenarioService";
import type {
	CreateScenarioInput,
	Document,
	PersonaInput,
	ScenarioCategory,
	ScenarioDifficulty,
} from "@/types";
import { validateScenarioInput } from "@/utils/validation";
import { personaSyncService } from "@/services/personaSyncService";
import { Stack, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
	const [category, setCategory] = useState<ScenarioCategory>("Leadership");
	const [duration, setDuration] = useState<number>(10);
	const [difficulty, setDifficulty] =
		useState<ScenarioDifficulty>("intermediate");
	const [pipelineMode, setPipelineMode] = useState<"full" | "echo">("full");
	const [systemPrompt, setSystemPrompt] = useState<string>("");
	const [context, setContext] = useState<string>("");
	const [validationErrors, setValidationErrors] = useState<string[]>([]);
	const [documentPickerVisible, setDocumentPickerVisible] = useState(false);
	const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
	const [selectedDocumentTags, setSelectedDocumentTags] = useState<string[]>(
		[]
	);
	const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);

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

	// Load selected documents when IDs change
	useEffect(() => {
		if (selectedDocumentIds.length > 0) {
			documentService
				.getDocumentsByIds(selectedDocumentIds)
				.then(setSelectedDocuments)
				.catch(console.error);
		} else {
			setSelectedDocuments([]);
		}
	}, [selectedDocumentIds]);

	const onSubmit = async () => {
		const persona: PersonaInput = {
			systemPrompt: systemPrompt.trim() || undefined,
			pipelineMode,
			context: context.trim() || undefined,
			layers: {
				document_ids:
					selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined,
				document_tags:
					selectedDocumentTags.length > 0 ? selectedDocumentTags : undefined,
			},
		};

		const input: CreateScenarioInput = {
			title: label.trim(),
			description: description.trim(),
			category,
			duration,
			difficulty,
			tags,
			persona,
		};

		const validation = validateScenarioInput(input);
		if (!validation.isValid) {
			setValidationErrors(validation.errors.map((e) => e.message));
			return;
		}

		setValidationErrors([]);

		try {
			const created = await scenarioService.createScenario(input);

			// Optimistically mark persona as queued and enqueue remote creation
			if (input.persona) {
				await scenarioService.updateScenario({
					id: created.id,
					persona: {
						...created.persona,
						status: "queued",
						lastStatusAt: new Date(),
						isSyncedRemote: false,
						syncError: null,
					},
				});

				await personaSyncService.enqueue({
					scenarioId: created.id,
					personaInput: input.persona,
					enqueuedAt: new Date().toISOString(),
					attempts: 0,
				});
			}

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

					{/* Duration and Difficulty */}
					<View style={styles.row}>
						<View style={[styles.card, { flex: 1, marginRight: 8 }]}>
							<Text style={styles.label}>Duration (min)</Text>
							<View style={styles.inputBox}>
								<TextInput
									placeholder="10"
									value={String(duration)}
									onChangeText={(text) => {
										const num = Number.parseInt(text, 10);
										if (!Number.isNaN(num)) setDuration(num);
									}}
									keyboardType="number-pad"
									style={styles.textInput}
								/>
							</View>
						</View>
						<View style={[styles.card, { flex: 1, marginLeft: 8 }]}>
							<Picker
								label="Difficulty"
								value={difficulty}
								options={["beginner", "intermediate", "advanced"] as const}
								onChange={setDifficulty}
								formatLabel={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
							/>
						</View>
					</View>

					{/* Persona Prompt */}
					<View style={styles.card}>
						<Text style={styles.label}>Persona Prompt</Text>
						<View style={[styles.inputBox, { minHeight: 112 }]}>
							<TextInput
								placeholder="System prompt defining persona behavior"
								value={systemPrompt}
								onChangeText={setSystemPrompt}
								multiline
								style={[styles.textInput, { height: 96 }]}
							/>
						</View>
						<Text style={styles.helper}>
							Required for Tavus pipeline_mode "full"
						</Text>
					</View>

					{/* Persona Context */}
					<View style={styles.card}>
						<Text style={styles.label}>Persona Context</Text>
						<View style={[styles.inputBox, { minHeight: 88 }]}>
							<TextInput
								placeholder="Optional context examples or guidance"
								value={context}
								onChangeText={setContext}
								multiline
								style={[styles.textInput, { height: 72 }]}
							/>
						</View>
						<Text style={styles.helper}>
							Optional, enhances persona responses
						</Text>
					</View>

					{/* Pipeline Mode */}
					<View style={styles.card}>
						<Text style={styles.label}>Pipeline Mode</Text>
						<View style={styles.tagsContainer}>
							{(["full", "echo"] as const).map((mode) => (
								<Text
									key={mode}
									onPress={() => setPipelineMode(mode)}
									style={
										pipelineMode === mode
											? styles.tagChipSelectedText
											: styles.tagChipText
									}
								>
									{mode}
								</Text>
							))}
						</View>
						<Text style={styles.helper}>
							"full" uses LLM+TTS; "echo" mirrors inputs.
						</Text>
					</View>

					{/* Knowledge Documents */}
					<View style={styles.card}>
						<Text style={styles.label}>Knowledge Documents</Text>
						<Button
							title={
								selectedDocumentIds.length > 0
									? `${selectedDocumentIds.length} document(s) selected`
									: "Select Documents"
							}
							onPress={() => setDocumentPickerVisible(true)}
							variant="secondary"
						/>
						{selectedDocuments.length > 0 && (
							<View style={{ marginTop: 12 }}>
								{selectedDocuments.slice(0, 3).map((doc) => (
									<View key={doc.id} style={styles.selectedDoc}>
										<Text style={styles.selectedDocName} numberOfLines={1}>
											{doc.name}
										</Text>
										<Text style={styles.selectedDocSize}>
											{documentService.formatFileSize(doc.size)}
										</Text>
									</View>
								))}
								{selectedDocuments.length > 3 && (
									<Text style={styles.moreDocsText}>
										+{selectedDocuments.length - 3} more documents
									</Text>
								)}
							</View>
						)}
						<Text style={styles.helper}>
							Pre-indexed documents to enhance persona knowledge
						</Text>
					</View>

					{/* Document Tags */}
					<View style={styles.card}>
						<Text style={styles.label}>Document Tags (Optional)</Text>
						<View style={styles.inputBox}>
							<TextInput
								placeholder="e.g., leadership, policies, training"
								value={selectedDocumentTags.join(", ")}
								onChangeText={(text) =>
									setSelectedDocumentTags(
										text
											.split(",")
											.map((t) => t.trim())
											.filter((t) => t)
									)
								}
								style={styles.textInput}
							/>
						</View>
						<Text style={styles.helper}>
							Comma-separated tags to filter knowledge base
						</Text>
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

			{/* Document Picker Modal */}
			<DocumentPicker
				visible={documentPickerVisible}
				onClose={() => setDocumentPickerVisible(false)}
				selectedDocumentIds={selectedDocumentIds}
				onSelectionChange={setSelectedDocumentIds}
				maxSelection={50}
			/>
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
	row: {
		flexDirection: "row",
		marginHorizontal: 16,
		marginBottom: 16,
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
	selectedDoc: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 6,
		paddingHorizontal: 8,
		backgroundColor: "#f9fafb",
		borderRadius: 6,
		marginBottom: 6,
	},
	selectedDocName: {
		fontSize: 13,
		color: "#374151",
		flex: 1,
		marginRight: 8,
	},
	selectedDocSize: {
		fontSize: 11,
		color: "#9ca3af",
	},
	moreDocsText: {
		fontSize: 12,
		color: "#6b7280",
		fontStyle: "italic",
		marginTop: 4,
	},
});
