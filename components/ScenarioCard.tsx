import Colors from "@/constants/Colors";
import React from "react";
import {
	Image,
	ImageSourcePropType,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";

export type ScenarioCardProps = {
	title: string;
	description: string;
	category: string;
	duration: string; // e.g. "15 min"
	imageSource?: ImageSourcePropType; // local asset or remote via { uri }
	onPress?: () => void;
};

export default function ScenarioCard(props: Readonly<ScenarioCardProps>) {
	const { title, description, category, duration, imageSource, onPress } =
		props;
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
					<View style={styles.metaRow}>
						<View style={styles.pill}>
							<Text style={styles.pillText}>{category}</Text>
						</View>
						<View style={styles.dot} />
						<Text style={styles.duration}>{duration}</Text>
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
});
