import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, router } from "expo-router";
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

export default function SignInScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const { signIn, session, loading: authLoading } = useAuth();

	// Redirect to tabs if already authenticated
	if (session && !authLoading) {
		return <Redirect href="/(tabs)" />;
	}

	const handleSignIn = async () => {
		if (!email || !password) {
			return;
		}

		setLoading(true);
		try {
			await signIn(email, password);
			// Navigation handled by auth state change
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
				<Text style={styles.title}>Welcome Back</Text>
				<Text style={styles.subtitle}>Sign in to continue</Text>

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
					<TextInput
						style={styles.input}
						placeholder="Password"
						value={password}
						onChangeText={setPassword}
						secureTextEntry
						editable={!loading}
					/>

					<TouchableOpacity
						style={[styles.button, loading && styles.buttonDisabled]}
						onPress={handleSignIn}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.buttonText}>Sign In</Text>
						)}
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.linkButton}
						onPress={() => router.push("/auth/forgot-password")}
						disabled={loading}
					>
						<Text style={styles.linkText}>Forgot Password?</Text>
					</TouchableOpacity>

					<View style={styles.footer}>
						<Text style={styles.footerText}>Don't have an account? </Text>
						<TouchableOpacity
							onPress={() => router.push("/auth/sign-up")}
							disabled={loading}
						>
							<Text style={styles.linkText}>Sign Up</Text>
						</TouchableOpacity>
					</View>
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
		backgroundColor: "#05A4A4",
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
		color: "#05A4A4",
		fontSize: 14,
		fontWeight: "500",
	},
	footer: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 32,
	},
	footerText: {
		fontSize: 14,
		color: "#666",
	},
});
