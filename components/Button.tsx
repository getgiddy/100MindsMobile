import React from "react";
import {
	Pressable,
	StyleProp,
	StyleSheet,
	Text,
	TextStyle,
	ViewStyle,
} from "react-native";
import { useButton, Variant } from "./useButton";

type ButtonProps = {
	title?: string;
	children?: React.ReactNode;
	onPress?: () => void;
	variant?: Variant;
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
	accessibilityLabel?: string;
	testID?: string;
};

export default function Button(props: Readonly<ButtonProps>) {
	const {
		title,
		children,
		onPress,
		variant = "primary",
		disabled = false,
		style,
		textStyle,
		accessibilityLabel,
		testID,
	} = props;
	const pressableStyle = useButton({ variant, disabled, style });

	const content =
		typeof children === "string" || typeof title === "string" ? (
			<Text
				style={[
					styles.text,
					variant === "primary" ? styles.textPrimary : styles.textSecondary,
					textStyle,
				]}
			>
				{title ?? (children as string)}
			</Text>
		) : (
			children
		);

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={
				accessibilityLabel || (typeof title === "string" ? title : undefined)
			}
			testID={testID}
			onPress={onPress}
			disabled={disabled}
			style={pressableStyle}
		>
			{content}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	text: {
		fontWeight: "700",
	},
	textPrimary: {
		color: "#fff",
	},
	textSecondary: {
		color: "#111",
	},
});
