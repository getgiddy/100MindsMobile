import CircularProgress from "@/components/CircularProgress";
import { Text, View } from "@/components/Themed";
import Colors from "@/constants/Colors";
import type { FeedbackListItem } from "@/types";
import { View as RNView, StyleSheet } from "react-native";

export default function FeedbackCard({
	item,
}: {
	readonly item: FeedbackListItem;
}) {
	return (
		<View style={styles.card}>
			<RNView style={styles.row}>
				<RNView style={styles.scoreBadgeOuter}>
					<CircularProgress score={item.score} size={56} />
				</RNView>
				<RNView style={styles.main}>
					<Text style={styles.title}>{item.scenarioTitle}</Text>
					<RNView style={styles.metaRow}>
						<RNView style={styles.pill}>
							<Text style={styles.pillText}>{item.category}</Text>
						</RNView>
						<Text style={styles.date}>{item.dateLabel}</Text>
					</RNView>
				</RNView>
			</RNView>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#fff",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#E3E3E3",
		padding: 16,
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
	},
	scoreBadgeOuter: {
		marginRight: 12,
	},
	main: {
		flex: 1,
	},
	title: {
		fontSize: 16,
		fontWeight: "600",
		color: "#222",
		marginBottom: 6,
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	pill: {
		backgroundColor: "#E6F5EF",
		borderRadius: 16,
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	pillText: {
		color: Colors.light.tint,
		fontSize: 12,
		fontWeight: "600",
	},
	date: {
		color: "#7A7A7A",
		fontSize: 12,
		fontWeight: "500",
	},
});
