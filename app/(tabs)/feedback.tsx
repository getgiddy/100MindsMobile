import FeedbackCard from "@/components/FeedbackCard";
import { View } from "@/components/Themed";
import { feedbackKeys, useFeedbackList } from "@/hooks";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useCallback, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	RefreshControl,
	StyleSheet,
	Text,
} from "react-native";

export default function FeedbackListScreen() {
	const queryClient = useQueryClient();
	const [refreshing, setRefreshing] = useState(false);
	const {
		data: feedbackItems = [],
		isLoading,
		error,
		refetch,
	} = useFeedbackList();

	// Refresh feedback when screen comes into focus
	useFocusEffect(
		useCallback(() => {
			queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
		}, [queryClient])
	);

	// Handle pull-to-refresh
	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	}, [refetch]);

	return (
		<View style={styles.container}>
			{isLoading && (
				<View style={styles.centerContent}>
					<ActivityIndicator size="large" color="#009999" />
				</View>
			)}
			{error && (
				<View style={styles.centerContent}>
					<Text style={styles.errorText}>Error loading feedback</Text>
				</View>
			)}
			{!isLoading && feedbackItems.length === 0 && (
				<View style={styles.centerContent}>
					<Text style={styles.emptyText}>No feedback sessions yet</Text>
					<Text style={styles.emptySubtext}>
						Complete a scenario to see your feedback here
					</Text>
				</View>
			)}
			<FlatList
				data={feedbackItems}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContent}
				ItemSeparatorComponent={Separator}
				renderItem={({ item }) => (
					<Link
						href={{ pathname: "/feedback/[id]", params: { id: item.id } }}
						asChild
					>
						<Pressable>
							<FeedbackCard item={item} />
						</Pressable>
					</Link>
				)}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={["#009999"]}
						tintColor="#009999"
					/>
				}
			/>
		</View>
	);
}

function Separator() {
	return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	centerContent: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 20,
	},
	errorText: {
		color: "#ff0000",
		fontSize: 16,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#333",
		marginBottom: 8,
	},
	emptySubtext: {
		fontSize: 14,
		color: "#666",
		textAlign: "center",
	},
	listContent: {
		padding: 16,
	},
	separator: {
		height: 12,
	},
});
