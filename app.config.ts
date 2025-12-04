module.exports = {
	expo: {
		name: "100MindsMobile",
		slug: "100MindsMobile",
		version: "1.0.0",
		orientation: "portrait",
		icon: "./assets/images/icon.png",
		scheme: "100mindsmobile",
		userInterfaceStyle: "automatic",
		newArchEnabled: true,
		splash: {
			image: "./assets/images/splash-icon.png",
			resizeMode: "contain",
			backgroundColor: "#ffffff",
		},
		ios: {
			supportsTablet: true,
			infoPlist: {
				NSCameraUsageDescription:
					"This app needs camera access for video calls.",
				NSMicrophoneUsageDescription:
					"This app needs microphone access for voice calls.",
				ITSAppUsesNonExemptEncryption: false,
				UIBackgroundModes: ["voip"],
			},
			bundleIdentifier: "com.elevateadm.100MindsMobile",
		},
		android: {
			package: "com.elevateadm.x100MindsMobile",
			adaptiveIcon: {
				foregroundImage: "./assets/images/adaptive-icon.png",
				backgroundColor: "#ffffff",
			},
			edgeToEdgeEnabled: true,
			predictiveBackGestureEnabled: false,
			permissions: [
				"CAMERA",
				"RECORD_AUDIO",
				"MODIFY_AUDIO_SETTINGS",
				"CAMERA",
				"RECORD_AUDIO",
				"MODIFY_AUDIO_SETTINGS",
			],
		},
		web: {
			bundler: "metro",
			output: "static",
			favicon: "./assets/images/favicon.png",
		},
		plugins: [
			[
				"@daily-co/config-plugin-rn-daily-js",
				{
					enableCamera: true,
					enableMicrophone: true,
					enableScreenShare: true,
				},
			],
			"expo-router",
		],
		experiments: {
			typedRoutes: true,
		},
		extra: {
			router: {},
			eas: {
				projectId: "371cfcf6-2a1d-4ffb-8127-84921335224d",
			},
			supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
			supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
		},
		owner: "elevateadm",
	},
};
