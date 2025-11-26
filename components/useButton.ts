import { useCallback } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";

type Variant = "primary" | "secondary";

type UseButtonArgs = {
    variant?: Variant;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
};

/**
 * useButton returns a Pressable style function that applies
 * consistent button styles, pressed feedback, and disabled state.
 */
export function useButton({ variant = "primary", disabled = false, style }: UseButtonArgs) {
    const pressableStyle = useCallback(
        ({ pressed }: { pressed: boolean }) => [
            styles.base,
            variant === "primary" ? styles.primary : styles.secondary,
            pressed && styles.pressed,
            disabled && styles.disabled,
            style,
        ],
        [variant, disabled, style]
    );

    return pressableStyle;
}

const styles = StyleSheet.create({
    base: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
    },
    primary: {
        backgroundColor: "#05A4A4",
    },
    secondary: {
        borderWidth: 1,
        borderColor: "#d8d8d8",
        backgroundColor: "#fff",
    },
    pressed: {
        opacity: 0.85,
    },
    disabled: {
        opacity: 0.5,
    },
});

export type { Variant };
