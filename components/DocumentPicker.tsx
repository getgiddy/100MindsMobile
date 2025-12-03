import { documentService } from "@/services/documentService";
import type { Document, DocumentFilter } from "@/types";
import { useEffect, useState } from "react";
import {
	FlatList,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";

interface DocumentPickerProps {
	visible: boolean;
	onClose: () => void;
	selectedDocumentIds: string[];
	onSelectionChange: (documentIds: string[]) => void;
	maxSelection?: number;
}

/**
 * Document picker modal for selecting pre-indexed documents
 * Supports search, tag filtering, and multi-selection
 */
export default function DocumentPicker({
	visible,
	onClose,
	selectedDocumentIds,
	onSelectionChange,
	maxSelection = 50,
}: DocumentPickerProps) {
	const [documents, setDocuments] = useState<Document[]>([]);
	const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [availableTags, setAvailableTags] = useState<
		{ name: string; count: number }[]
	>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (visible) {
			loadDocuments();
			loadTags();
		}
	}, [visible]);

	useEffect(() => {
		applyFilters();
	}, [documents, searchQuery, selectedTags]);

	async function loadDocuments() {
		setLoading(true);
		try {
			const docs = await documentService.getDocuments();
			setDocuments(docs);
		} catch (error) {
			console.error("Failed to load documents:", error);
		} finally {
			setLoading(false);
		}
	}

	async function loadTags() {
		try {
			const tags = await documentService.getTags();
			setAvailableTags(tags.slice(0, 10)); // Top 10 tags
		} catch (error) {
			console.error("Failed to load tags:", error);
		}
	}

	function applyFilters() {
		const filter: DocumentFilter = {
			searchQuery: searchQuery || undefined,
			tags: selectedTags.length > 0 ? selectedTags : undefined,
		};

		let filtered = documents;

		if (filter.searchQuery) {
			const query = filter.searchQuery.toLowerCase();
			filtered = filtered.filter(
				(doc) =>
					doc.name.toLowerCase().includes(query) ||
					doc.description?.toLowerCase().includes(query) ||
					doc.tags.some((tag) => tag.toLowerCase().includes(query))
			);
		}

		if (filter.tags && filter.tags.length > 0) {
			filtered = filtered.filter((doc) =>
				filter.tags!.some((tag) => doc.tags.includes(tag))
			);
		}

		setFilteredDocuments(filtered);
	}

	function toggleDocument(docId: string) {
		const isSelected = selectedDocumentIds.includes(docId);
		if (isSelected) {
			onSelectionChange(selectedDocumentIds.filter((id) => id !== docId));
		} else {
			if (selectedDocumentIds.length < maxSelection) {
				onSelectionChange([...selectedDocumentIds, docId]);
			}
		}
	}

	function toggleTag(tag: string) {
		if (selectedTags.includes(tag)) {
			setSelectedTags(selectedTags.filter((t) => t !== tag));
		} else {
			setSelectedTags([...selectedTags, tag]);
		}
	}

	function handleDone() {
		onClose();
		setSearchQuery("");
		setSelectedTags([]);
	}

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
		>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<Pressable onPress={handleDone}>
						<Text style={styles.cancelButton}>Done</Text>
					</Pressable>
					<Text style={styles.headerTitle}>Select Documents</Text>
					<Text style={styles.selectionCount}>
						{selectedDocumentIds.length}/{maxSelection}
					</Text>
				</View>

				{/* Search */}
				<View style={styles.searchContainer}>
					<TextInput
						style={styles.searchInput}
						placeholder="Search documents..."
						value={searchQuery}
						onChangeText={setSearchQuery}
						clearButtonMode="while-editing"
					/>
				</View>

				{/* Tag filters */}
				<View style={styles.tagsSection}>
					<Text style={styles.tagsLabel}>Filter by tags:</Text>
					<View style={styles.tagsContainer}>
						{availableTags.map((tag) => {
							const isSelected = selectedTags.includes(tag.name);
							return (
								<Pressable
									key={tag.name}
									onPress={() => toggleTag(tag.name)}
									style={[styles.tagChip, isSelected && styles.tagChipSelected]}
								>
									<Text
										style={[
											styles.tagChipText,
											isSelected && styles.tagChipTextSelected,
										]}
									>
										{tag.name} ({tag.count})
									</Text>
								</Pressable>
							);
						})}
					</View>
				</View>

				{/* Document list */}
				<FlatList
					data={filteredDocuments}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => {
						const isSelected = selectedDocumentIds.includes(item.id);
						return (
							<Pressable
								style={[styles.docItem, isSelected && styles.docItemSelected]}
								onPress={() => toggleDocument(item.id)}
							>
								<View style={styles.docContent}>
									<View style={styles.docHeader}>
										<Text style={styles.docName} numberOfLines={1}>
											{item.name}
										</Text>
										<View
											style={[
												styles.checkbox,
												isSelected && styles.checkboxSelected,
											]}
										>
											{isSelected && <Text style={styles.checkmark}>✓</Text>}
										</View>
									</View>
									{item.description && (
										<Text style={styles.docDescription} numberOfLines={2}>
											{item.description}
										</Text>
									)}
									<View style={styles.docMeta}>
										<View style={styles.docTags}>
											{item.tags.slice(0, 3).map((tag) => (
												<View key={tag} style={styles.docTag}>
													<Text style={styles.docTagText}>{tag}</Text>
												</View>
											))}
											{item.tags.length > 3 && (
												<Text style={styles.docTagMore}>
													+{item.tags.length - 3}
												</Text>
											)}
										</View>
										<Text style={styles.docSize}>
											{documentService.formatFileSize(item.size)}
										</Text>
									</View>
								</View>
							</Pressable>
						);
					}}
					ListEmptyComponent={
						<View style={styles.emptyState}>
							<Text style={styles.emptyText}>
								{loading ? "Loading documents..." : "No documents found"}
							</Text>
						</View>
					}
					contentContainerStyle={styles.listContent}
				/>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#e5e5e5",
	},
	cancelButton: {
		fontSize: 16,
		color: "#006d6d",
		fontWeight: "600",
		minWidth: 60,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "700",
		flex: 1,
		textAlign: "center",
	},
	selectionCount: {
		fontSize: 14,
		color: "#7a7a7a",
		minWidth: 60,
		textAlign: "right",
	},
	searchContainer: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	searchInput: {
		backgroundColor: "#f8f8f8",
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 15,
	},
	tagsSection: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	tagsLabel: {
		fontSize: 13,
		color: "#7a7a7a",
		marginBottom: 8,
		fontWeight: "600",
	},
	tagsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	tagChip: {
		backgroundColor: "#f3f4f6",
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 12,
	},
	tagChipSelected: {
		backgroundColor: "#006d6d",
	},
	tagChipText: {
		fontSize: 12,
		color: "#4b5563",
		fontWeight: "500",
	},
	tagChipTextSelected: {
		color: "#fff",
	},
	listContent: {
		padding: 16,
	},
	docItem: {
		backgroundColor: "#fff",
		borderWidth: 1,
		borderColor: "#e5e5e5",
		borderRadius: 12,
		padding: 12,
		marginBottom: 12,
	},
	docItemSelected: {
		borderColor: "#006d6d",
		borderWidth: 2,
		backgroundColor: "#f0fffe",
	},
	docContent: {
		flex: 1,
	},
	docHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 6,
	},
	docName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#000",
		flex: 1,
		marginRight: 12,
	},
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: "#d1d5db",
		alignItems: "center",
		justifyContent: "center",
	},
	checkboxSelected: {
		backgroundColor: "#006d6d",
		borderColor: "#006d6d",
	},
	checkmark: {
		color: "#fff",
		fontSize: 14,
		fontWeight: "700",
	},
	docDescription: {
		fontSize: 13,
		color: "#666",
		marginBottom: 8,
		lineHeight: 18,
	},
	docMeta: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	docTags: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 4,
		flex: 1,
		marginRight: 8,
	},
	docTag: {
		backgroundColor: "#e0e7ff",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 6,
	},
	docTagText: {
		fontSize: 10,
		color: "#4338ca",
		fontWeight: "500",
	},
	docTagMore: {
		fontSize: 10,
		color: "#9ca3af",
		alignSelf: "center",
	},
	docSize: {
		fontSize: 11,
		color: "#9ca3af",
	},
	emptyState: {
		paddingVertical: 40,
		alignItems: "center",
	},
	emptyText: {
		fontSize: 15,
		color: "#9ca3af",
	},
});
