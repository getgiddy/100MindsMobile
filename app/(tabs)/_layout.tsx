import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";
import React from "react";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

function TabBarIcon(props: {
	name: React.ComponentProps<typeof Feather>["name"];
	color: string;
}) {
	return <Feather size={28} style={{ marginBottom: -3 }} {...props} />;
}

function HomeTabBarIcon({ color }: { color: string }) {
	return <TabBarIcon name="home" color={color} />;
}

function FeedbackTabBarIcon({ color }: { color: string }) {
	return <TabBarIcon name="star" color={color} />;
}

function ProgressTabBarIcon({ color }: { color: string }) {
	return <TabBarIcon name="loader" color={color} />;
}

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? "light"].tabIconDefault,
				// Disable the static render of the header on web
				// to prevent a hydration error in React Navigation v6.
				headerShown: useClientOnlyValue(false, true),
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: HomeTabBarIcon,
					headerShown: false,
				}}
			/>
			<Tabs.Screen
				name="feedback"
				options={{
					title: "Feedback",
					tabBarIcon: FeedbackTabBarIcon,
				}}
			/>
			<Tabs.Screen
				name="progress"
				options={{
					title: "Progress",
					tabBarIcon: ProgressTabBarIcon,
				}}
			/>
		</Tabs>
	);
}
