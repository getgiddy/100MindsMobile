import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
// Create a QueryClient instance
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 60 * 24, // 24 hours (previously cacheTime)
			retry: 2,
			refetchOnWindowFocus: false,
		},
	},
});

export default function RootLayout() {
	const [loaded, error] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
		...FontAwesome.font,
	});

	// Expo Router uses Error Boundaries to catch errors in the navigation tree.
	useEffect(() => {
		if (error) throw error;
	}, [error]);

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return <RootLayoutNav />;
}

function RootLayoutNav() {
	const colorScheme = useColorScheme();

	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<ThemeProvider
					value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
				>
					<NavigationContent />
				</ThemeProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}

function NavigationContent() {
	const { session, loading } = useAuth();

	// Show nothing while checking auth state
	if (loading) {
		return null;
	}

	return (
		<Stack>
			<Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
			<Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />
			<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
			<Stack.Screen
				name="auth/forgot-password"
				options={{ title: "Reset Password" }}
			/>
			<Stack.Screen name="modal" options={{ presentation: "modal" }} />
			<Stack.Screen
				name="create-scenario"
				options={{ presentation: "modal" }}
			/>
			<Stack.Screen
				name="feedback/[id]"
				options={{ headerBackButtonDisplayMode: "minimal" }}
			/>
		</Stack>
	);
}
