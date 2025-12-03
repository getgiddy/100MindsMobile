import { useState } from "react";
import {
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";

interface PickerProps<T extends string> {
	label: string;
	value: T;
	options: readonly T[];
	onChange: (value: T) => void;
	formatLabel?: (value: T) => string;
}

/**
 * Custom picker component for categories, difficulties, etc.
 * Uses modal for cross-platform consistency
 */
export default function Picker<T extends string>({
	label,
	value,
	options,
	onChange,
	formatLabel = (v) => v,
}: PickerProps<T>) {
	const [visible, setVisible] = useState(false);

	function handleSelect(option: T) {
		onChange(option);
		setVisible(false);
	}

	return (
		<>
			<View>
				<Text style={styles.label}>{label}</Text>
				<Pressable style={styles.trigger} onPress={() => setVisible(true)}>
					<Text style={styles.triggerText}>{formatLabel(value)}</Text>
					<Text style={styles.chevron}>▼</Text>
				</Pressable>
			</View>

			<Modal visible={visible} transparent animationType="fade">
				<Pressable style={styles.overlay} onPress={() => setVisible(false)}>
					<View style={styles.modal}>
						<View style={styles.header}>
							<Text style={styles.headerText}>Select {label}</Text>
						</View>
						<ScrollView style={styles.optionsList}>
							{options.map((option) => (
								<Pressable
									key={option}
									style={[
										styles.option,
										option === value && styles.optionSelected,
									]}
									onPress={() => handleSelect(option)}
								>
									<Text
										style={[
											styles.optionText,
											option === value && styles.optionTextSelected,
										]}
									>
										{formatLabel(option)}
									</Text>
									{option === value && <Text style={styles.check}>✓</Text>}
								</Pressable>
							))}
						</ScrollView>
					</View>
				</Pressable>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	label: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 8,
	},
	trigger: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderWidth: 1,
		borderColor: "#e5e5e5",
		backgroundColor: "#f8f8f8",
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 12,
	},
	triggerText: {
		fontSize: 14,
		color: "#000",
	},
	chevron: {
		fontSize: 10,
		color: "#7a7a7a",
	},
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modal: {
		backgroundColor: "#fff",
		borderRadius: 16,
		width: "80%",
		maxHeight: "60%",
		overflow: "hidden",
	},
	header: {
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#e5e5e5",
	},
	headerText: {
		fontSize: 18,
		fontWeight: "700",
		textAlign: "center",
	},
	optionsList: {
		maxHeight: 300,
	},
	option: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	optionSelected: {
		backgroundColor: "#dff5f2",
	},
	optionText: {
		fontSize: 16,
		color: "#000",
	},
	optionTextSelected: {
		fontWeight: "600",
		color: "#006d6d",
	},
	check: {
		fontSize: 18,
		color: "#006d6d",
		fontWeight: "700",
	},
});
