export interface User {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
    createdAt: Date;
    preferences?: UserPreferences;
}

export interface UserPreferences {
    notificationsEnabled: boolean;
    dailyReminderTime?: string; // HH:mm format
    defaultDifficulty?: "beginner" | "intermediate" | "advanced";
    theme?: "light" | "dark" | "auto";
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error?: string;
}
