import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import React, { useState } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

export default function ForgotPasswordScreen() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const { resetPassword } = useAuth();

	const handleResetPassword = async () => {
		if (!email) {
			return;
		}

		setLoading(true);
		try {
			await resetPassword(email);
			router.back();
		} catch (error) {
			// Error handled by AuthContext
		} finally {
			setLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<View style={styles.content}>
				<Logo />
				<Text style={styles.title}>Reset Password</Text>
				<Text style={styles.subtitle}>
					Enter your email and we'll send you a link to reset your password
				</Text>

				<View style={styles.form}>
					<TextInput
						style={styles.input}
						placeholder="Email"
						value={email}
						onChangeText={setEmail}
						autoCapitalize="none"
						keyboardType="email-address"
						editable={!loading}
					/>

					<TouchableOpacity
						style={[styles.button, loading && styles.buttonDisabled]}
						onPress={handleResetPassword}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.buttonText}>Send Reset Link</Text>
						)}
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.linkButton}
						onPress={() => router.back()}
						disabled={loading}
					>
						<Text style={styles.linkText}>Back to Sign In</Text>
					</TouchableOpacity>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	content: {
		flex: 1,
		padding: 24,
		justifyContent: "center",
	},
	title: {
		fontSize: 32,
		fontWeight: "bold",
		marginTop: 24,
		marginBottom: 8,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		color: "#666",
		marginBottom: 32,
		textAlign: "center",
		lineHeight: 22,
	},
	form: {
		width: "100%",
	},
	input: {
		height: 50,
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		paddingHorizontal: 16,
		marginBottom: 16,
		fontSize: 16,
		backgroundColor: "#f9f9f9",
	},
	button: {
		height: 50,
		backgroundColor: "#007AFF",
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
		marginTop: 8,
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	linkButton: {
		marginTop: 16,
		alignItems: "center",
	},
	linkText: {
		color: "#007AFF",
		fontSize: 14,
		fontWeight: "500",
	},
});
