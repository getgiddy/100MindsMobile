import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
	readonly icon: keyof typeof MaterialIcons.glyphMap;
	readonly label: string;
	readonly onPress: () => void;
};

export default function IconButton({ icon, label, onPress }: Props) {
	return (
		<Pressable style={styles.iconButton} onPress={onPress}>
			<MaterialIcons name={icon} size={24} style={{ color: "#fff" }} />
			<Text style={styles.iconButtonLabel}>{label}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	iconButton: {
		justifyContent: "center",
		alignItems: "center",
		flexDirection: "row",
		backgroundColor: "#009999",
		borderRadius: 12,
		padding: 16,
	},
	iconButtonLabel: {
		marginLeft: 4,
		color: "#fff",
		fontWeight: "600",
	},
});
