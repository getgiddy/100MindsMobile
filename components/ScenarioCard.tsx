import Colors from "@/constants/Colors";
import type { PersonaStatus } from "@/types";
import React from "react";
import {
	Image,
	ImageSourcePropType,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import PersonaStatusBadge from "./PersonaStatusBadge";

export type ScenarioCardProps = {
	title: string;
	description: string;
	category: string;
	duration: string; // e.g. "15 min"
	imageSource?: ImageSourcePropType; // local asset or remote via { uri }
	tags?: string[];
	personaStatus?: PersonaStatus;
	pipelineMode?: "full" | "echo";
	onPress?: () => void;
};

export default function ScenarioCard(props: Readonly<ScenarioCardProps>) {
	const {
		title,
		description,
		category,
		duration,
		imageSource,
		tags,
		personaStatus,
		pipelineMode,
		onPress,
	} = props;
	return (
		<Pressable
			style={styles.card}
			onPress={onPress}
			android_ripple={{ color: "#eee" }}
		>
			<View style={styles.row}>
				<Image
					source={imageSource || { uri: "https://i.pravatar.cc/80?img=12" }}
					style={styles.avatar}
				/>
				<View style={styles.content}>
					<Text style={styles.title} numberOfLines={1}>
						{title}
					</Text>
					<Text style={styles.description} numberOfLines={2}>
						{description}
					</Text>

					{/* Tags */}
					{tags && tags.length > 0 && (
						<View style={styles.tagsRow}>
							{tags.slice(0, 3).map((tag) => (
								<View key={tag} style={styles.tag}>
									<Text style={styles.tagText}>{tag}</Text>
								</View>
							))}
							{tags.length > 3 && (
								<Text style={styles.moreText}>+{tags.length - 3} more</Text>
							)}
						</View>
					)}

					<View style={styles.metaRow}>
						<View style={styles.pill}>
							<Text style={styles.pillText}>{category}</Text>
						</View>
						<View style={styles.dot} />
						<Text style={styles.duration}>{duration}</Text>
						{pipelineMode && (
							<>
								<View style={styles.dot} />
								<Text style={styles.pipelineText}>{pipelineMode}</Text>
							</>
						)}
						{personaStatus && (
							<>
								<View style={styles.dot} />
								<PersonaStatusBadge status={personaStatus} size="small" />
							</>
						)}
					</View>
				</View>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	card: {
		padding: 16,
		borderColor: "#E9EAEB",
		borderWidth: 1,
		borderRadius: 12,
		marginBottom: 12,
		backgroundColor: "#fff",
		// CSS equivalent: box-shadow: 0px 1px 4px 0px #0C0C0D0D;
		shadowColor: "#0C0C0D",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	row: {
		flexDirection: "row",
		alignItems: "flex-start",
	},
	avatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		marginRight: 12,
	},
	content: {
		flex: 1,
	},
	title: {
		fontSize: 16,
		fontWeight: "600",
		color: Colors.light.text,
	},
	description: {
		marginTop: 6,
		fontSize: 13,
		lineHeight: 18,
		color: "#666",
	},
	metaRow: {
		marginTop: 10,
		flexDirection: "row",
		alignItems: "center",
	},
	pill: {
		backgroundColor: "#E6F7F7",
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 999,
	},
	pillText: {
		fontSize: 12,
		color: Colors.light.tint,
		fontWeight: "600",
	},
	dot: {
		width: 4,
		height: 4,
		borderRadius: 2,
		backgroundColor: "#c4c4c4",
		marginHorizontal: 8,
	},
	duration: {
		fontSize: 12,
		color: "#8a8a8a",
	},
	tagsRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
		marginTop: 8,
		marginBottom: 4,
	},
	tag: {
		backgroundColor: "#F3F4F6",
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 8,
	},
	tagText: {
		fontSize: 11,
		color: "#4B5563",
		fontWeight: "500",
	},
	moreText: {
		fontSize: 11,
		color: "#9CA3AF",
		alignSelf: "center",
	},
	pipelineText: {
		fontSize: 11,
		color: "#6366F1",
		fontWeight: "600",
		textTransform: "uppercase",
	},
});
