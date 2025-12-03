import type { PersonaStatus } from "@/types";
import { StyleSheet, Text, View } from "react-native";

interface PersonaStatusBadgeProps {
	status?: PersonaStatus;
	size?: "small" | "medium";
}

/**
 * Status badge component for Tavus persona lifecycle
 * Displays current status with color coding
 */
export default function PersonaStatusBadge({
	status,
	size = "small",
}: PersonaStatusBadgeProps) {
	if (!status) return null;

	const config = getStatusConfig(status);
	const badgeStyle = size === "small" ? styles.badgeSmall : styles.badgeMedium;
	const textStyle = size === "small" ? styles.textSmall : styles.textMedium;

	return (
		<View style={[badgeStyle, { backgroundColor: config.backgroundColor }]}>
			<View style={[styles.dot, { backgroundColor: config.dotColor }]} />
			<Text style={[textStyle, { color: config.textColor }]}>
				{config.label}
			</Text>
		</View>
	);
}

function getStatusConfig(status: PersonaStatus) {
	switch (status) {
		case "queued":
			return {
				label: "Queued",
				backgroundColor: "#FFF4E6",
				dotColor: "#F59E0B",
				textColor: "#92400E",
			};
		case "processing":
			return {
				label: "Processing",
				backgroundColor: "#DBEAFE",
				dotColor: "#3B82F6",
				textColor: "#1E3A8A",
			};
		case "ready":
			return {
				label: "Ready",
				backgroundColor: "#D1FAE5",
				dotColor: "#10B981",
				textColor: "#065F46",
			};
		case "error":
			return {
				label: "Error",
				backgroundColor: "#FEE2E2",
				dotColor: "#EF4444",
				textColor: "#991B1B",
			};
	}
}

const styles = StyleSheet.create({
	badgeSmall: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
		gap: 4,
	},
	badgeMedium: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		gap: 6,
	},
	dot: {
		width: 6,
		height: 6,
		borderRadius: 3,
	},
	textSmall: {
		fontSize: 11,
		fontWeight: "600",
	},
	textMedium: {
		fontSize: 13,
		fontWeight: "600",
	},
});
