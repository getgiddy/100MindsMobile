import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, router } from "expo-router";
import React, { useState } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

export default function SignUpScreen() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const { signUp, session, loading: authLoading } = useAuth();

	// Redirect to tabs if already authenticated
	if (session && !authLoading) {
		return <Redirect href="/(tabs)" />;
	}

	const handleSignUp = async () => {
		if (!email || !password || !confirmPassword) {
			return;
		}

		if (password !== confirmPassword) {
			alert("Passwords don't match");
			return;
		}

		if (password.length < 6) {
			alert("Password must be at least 6 characters");
			return;
		}

		setLoading(true);
		try {
			await signUp(email, password, name);
			router.replace("/auth/sign-in");
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
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.content}>
					<Logo />
					<Text style={styles.title}>Create Account</Text>
					<Text style={styles.subtitle}>Join 100 Minds today</Text>

					<View style={styles.form}>
						<TextInput
							style={styles.input}
							placeholder="Full Name"
							value={name}
							onChangeText={setName}
							autoCapitalize="words"
							editable={!loading}
						/>
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
						<TextInput
							style={styles.input}
							placeholder="Confirm Password"
							value={confirmPassword}
							onChangeText={setConfirmPassword}
							secureTextEntry
							editable={!loading}
						/>

						<TouchableOpacity
							style={[styles.button, loading && styles.buttonDisabled]}
							onPress={handleSignUp}
							disabled={loading}
						>
							{loading ? (
								<ActivityIndicator color="#fff" />
							) : (
								<Text style={styles.buttonText}>Sign Up</Text>
							)}
						</TouchableOpacity>

						<View style={styles.footer}>
							<Text style={styles.footerText}>Already have an account? </Text>
							<TouchableOpacity
								onPress={() => router.push("/auth/sign-in")}
								disabled={loading}
							>
								<Text style={styles.linkText}>Sign In</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	scrollContent: {
		flexGrow: 1,
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
	footer: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 32,
	},
	footerText: {
		fontSize: 14,
		color: "#666",
	},
	linkText: {
		color: "#05A4A4",
		fontSize: 14,
		fontWeight: "500",
	},
});
