import PersonaStatusBadge from "@/components/PersonaStatusBadge";
import { documentService } from "@/services/documentService";
import type { Document, Scenario } from "@/types";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScenarioDetailViewProps {
	scenario: Scenario;
}

/**
 * Scenario detail view component
 * Shows full scenario information including persona configuration and knowledge
 */
export default function ScenarioDetailView({
	scenario,
}: ScenarioDetailViewProps) {
	const [documents, setDocuments] = useState<Document[]>([]);

	useEffect(() => {
		if (scenario.persona?.layers?.document_ids) {
			documentService
				.getDocumentsByIds(scenario.persona.layers.document_ids)
				.then(setDocuments)
				.catch(console.error);
		}
	}, [scenario.persona?.layers?.document_ids]);

	return (
		<SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
			<ScrollView contentContainerStyle={styles.content}>
				{/* Header */}
				<View style={styles.header}>
					{scenario.imageSource && (
						<Image source={scenario.imageSource} style={styles.avatar} />
					)}
					<Text style={styles.title}>{scenario.title}</Text>
					<Text style={styles.description}>{scenario.description}</Text>
				</View>

				{/* Metadata */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Details</Text>
					<View style={styles.metaRow}>
						<View style={styles.metaItem}>
							<Text style={styles.metaLabel}>Category</Text>
							<View style={styles.categoryPill}>
								<Text style={styles.categoryText}>{scenario.category}</Text>
							</View>
						</View>
						<View style={styles.metaItem}>
							<Text style={styles.metaLabel}>Duration</Text>
							<Text style={styles.metaValue}>{scenario.duration} min</Text>
						</View>
						{scenario.difficulty && (
							<View style={styles.metaItem}>
								<Text style={styles.metaLabel}>Difficulty</Text>
								<Text style={styles.metaValue}>
									{scenario.difficulty.charAt(0).toUpperCase() +
										scenario.difficulty.slice(1)}
								</Text>
							</View>
						)}
					</View>
				</View>

				{/* Tags */}
				{scenario.tags && scenario.tags.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Tags</Text>
						<View style={styles.tagsContainer}>
							{scenario.tags.map((tag) => (
								<View key={tag} style={styles.tag}>
									<Text style={styles.tagText}>{tag}</Text>
								</View>
							))}
						</View>
					</View>
				)}

				{/* Persona Configuration */}
				{scenario.persona && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Persona Configuration</Text>

						{scenario.persona.status && (
							<View style={styles.statusRow}>
								<Text style={styles.label}>Status:</Text>
								<PersonaStatusBadge
									status={scenario.persona.status}
									size="medium"
								/>
							</View>
						)}

						{scenario.persona.pipelineMode && (
							<View style={styles.infoRow}>
								<Text style={styles.label}>Pipeline Mode:</Text>
								<Text style={styles.value}>
									{scenario.persona.pipelineMode}
								</Text>
							</View>
						)}

						{scenario.persona.systemPrompt && (
							<View style={styles.promptSection}>
								<Text style={styles.label}>System Prompt:</Text>
								<View style={styles.promptBox}>
									<Text style={styles.promptText}>
										{scenario.persona.systemPrompt}
									</Text>
								</View>
							</View>
						)}

						{scenario.persona.context && (
							<View style={styles.promptSection}>
								<Text style={styles.label}>Context:</Text>
								<View style={styles.promptBox}>
									<Text style={styles.promptText}>
										{scenario.persona.context}
									</Text>
								</View>
							</View>
						)}
					</View>
				)}

				{/* Knowledge Documents */}
				{documents.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>
							Knowledge Documents ({documents.length})
						</Text>
						{documents.map((doc) => (
							<View key={doc.id} style={styles.documentCard}>
								<Text style={styles.documentName}>{doc.name}</Text>
								{doc.description && (
									<Text style={styles.documentDescription} numberOfLines={2}>
										{doc.description}
									</Text>
								)}
								<View style={styles.documentMeta}>
									<View style={styles.documentTags}>
										{doc.tags.slice(0, 3).map((tag) => (
											<View key={tag} style={styles.documentTag}>
												<Text style={styles.documentTagText}>{tag}</Text>
											</View>
										))}
										{doc.tags.length > 3 && (
											<Text style={styles.moreTagsText}>
												+{doc.tags.length - 3}
											</Text>
										)}
									</View>
									<Text style={styles.documentSize}>
										{documentService.formatFileSize(doc.size)}
									</Text>
								</View>
							</View>
						))}
					</View>
				)}

				{/* Document Tags */}
				{scenario.persona?.layers?.document_tags &&
					scenario.persona.layers.document_tags.length > 0 && (
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Document Tag Filters</Text>
							<View style={styles.tagsContainer}>
								{scenario.persona.layers.document_tags.map((tag) => (
									<View key={tag} style={styles.filterTag}>
										<Text style={styles.filterTagText}>{tag}</Text>
									</View>
								))}
							</View>
						</View>
					)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	content: {
		padding: 16,
	},
	header: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		alignItems: "center",
	},
	avatar: {
		width: 80,
		height: 80,
		borderRadius: 40,
		marginBottom: 12,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: "#000",
		textAlign: "center",
		marginBottom: 8,
	},
	description: {
		fontSize: 15,
		color: "#666",
		textAlign: "center",
		lineHeight: 22,
	},
	section: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#000",
		marginBottom: 12,
	},
	metaRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
	},
	metaItem: {
		flex: 1,
		minWidth: 100,
	},
	metaLabel: {
		fontSize: 12,
		color: "#7a7a7a",
		marginBottom: 4,
		fontWeight: "600",
	},
	metaValue: {
		fontSize: 15,
		color: "#000",
		fontWeight: "500",
	},
	categoryPill: {
		backgroundColor: "#E6F7F7",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		alignSelf: "flex-start",
	},
	categoryText: {
		fontSize: 13,
		color: "#006d6d",
		fontWeight: "600",
        wordWrap: 'break-word',
	},
	tagsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	tag: {
		backgroundColor: "#F3F4F6",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 12,
	},
	tagText: {
		fontSize: 13,
		color: "#4B5563",
		fontWeight: "500",
	},
	statusRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginBottom: 12,
	},
	infoRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 12,
	},
	label: {
		fontSize: 14,
		color: "#7a7a7a",
		fontWeight: "600",
	},
	value: {
		fontSize: 14,
		color: "#000",
		fontWeight: "500",
	},
	promptSection: {
		marginBottom: 12,
	},
	promptBox: {
		backgroundColor: "#f9fafb",
		borderRadius: 8,
		padding: 12,
		marginTop: 6,
		borderWidth: 1,
		borderColor: "#e5e7eb",
	},
	promptText: {
		fontSize: 13,
		color: "#374151",
		lineHeight: 20,
	},
	documentCard: {
		backgroundColor: "#f9fafb",
		borderRadius: 8,
		padding: 12,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: "#e5e7eb",
	},
	documentName: {
		fontSize: 14,
		fontWeight: "600",
		color: "#000",
		marginBottom: 4,
	},
	documentDescription: {
		fontSize: 12,
		color: "#666",
		marginBottom: 8,
		lineHeight: 16,
	},
	documentMeta: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	documentTags: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 4,
		flex: 1,
		marginRight: 8,
	},
	documentTag: {
		backgroundColor: "#e0e7ff",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 6,
	},
	documentTagText: {
		fontSize: 10,
		color: "#4338ca",
		fontWeight: "500",
	},
	moreTagsText: {
		fontSize: 10,
		color: "#9ca3af",
		alignSelf: "center",
	},
	documentSize: {
		fontSize: 11,
		color: "#9ca3af",
	},
	filterTag: {
		backgroundColor: "#fef3c7",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#fbbf24",
	},
	filterTagText: {
		fontSize: 13,
		color: "#92400e",
		fontWeight: "600",
	},
});
