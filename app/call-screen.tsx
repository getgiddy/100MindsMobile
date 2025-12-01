import { Conversation } from "@/components/cvi/components/conversation";
import { CVIProvider } from "@/components/cvi/components/cvi-provider";
import React, { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

export default function TabOneScreen() {
	const [conversationUrl, setConversationUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const createConversation = async () => {
		setLoading(true);
		try {
			const response = await fetch("https://tavusapi.com/v2/conversations", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": process.env.EXPO_PUBLIC_TAVUS_API_KEY || "",
				},
				body: JSON.stringify({
					replica_id: process.env.EXPO_PUBLIC_REPLICA_ID || "rfe12d8b9597",
					persona_id: process.env.EXPO_PUBLIC_PERSONA_ID || "pdced222244b",
				}),
			});

			const data = await response.json();
			if (data.conversation_url) {
				setConversationUrl(data.conversation_url);
			} else {
				console.error("Failed to create conversation:", data);
				Alert.alert("Error", "Failed to create conversation");
			}
		} catch (error) {
			console.error("Error creating conversation:", error);
			Alert.alert("Error", "Failed to create conversation. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<CVIProvider>
			<View style={styles.container}>
				{conversationUrl ? (
					<Conversation
						conversationUrl={conversationUrl}
						onLeave={() => setConversationUrl(null)}
					/>
				) : (
					<View style={styles.startContainer}>
						<Text style={styles.title}>Tavus CVI Integration</Text>
						<Text style={styles.subtitle}>React Native</Text>
						{loading ? (
							<ActivityIndicator
								size="large"
								color="#6a0dad"
								style={styles.loader}
							/>
						) : (
							<TouchableOpacity
								onPress={createConversation}
								style={styles.button}
							>
								<Text style={styles.buttonText}>Start Conversation</Text>
							</TouchableOpacity>
						)}
					</View>
				)}
			</View>
		</CVIProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1e1e1e",
	},
	startContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#fff",
		marginBottom: 8,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		color: "#a0a0a0",
		marginBottom: 40,
	},
	button: {
		backgroundColor: "#6a0dad",
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 8,
	},
	buttonText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "600",
	},
	loader: {
		marginTop: 20,
	},
});
