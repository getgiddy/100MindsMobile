import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Storage utility for managing local persistence
 * Provides type-safe wrapper around AsyncStorage
 */

const STORAGE_KEYS = {
    SCENARIOS: "@100minds/scenarios",
    FEEDBACK_SESSIONS: "@100minds/feedback_sessions",
    USER_PREFERENCES: "@100minds/user_preferences",
    AUTH_TOKEN: "@100minds/auth_token",
} as const;

export const storage = {
    /**
     * Save data to storage
     */
    async set<T>(key: string, value: T): Promise<void> {
        try {
            const jsonValue = JSON.stringify(value);
            await AsyncStorage.setItem(key, jsonValue);
        } catch (error) {
            console.error(`Error saving to storage (${key}):`, error);
            throw error;
        }
    },

    /**
     * Get data from storage
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const jsonValue = await AsyncStorage.getItem(key);
            return jsonValue === null ? null : JSON.parse(jsonValue);
        } catch (error) {
            console.error(`Error reading from storage (${key}):`, error);
            return null;
        }
    },

    /**
     * Remove item from storage
     */
    async remove(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing from storage (${key}):`, error);
            throw error;
        }
    },

    /**
     * Clear all storage
     */
    async clear(): Promise<void> {
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.error("Error clearing storage:", error);
            throw error;
        }
    },

    /**
     * Get multiple items
     */
    async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
        try {
            const values = await AsyncStorage.multiGet(keys);
            return values.reduce(
                (acc, [key, value]) => {
                    acc[key] = value ? JSON.parse(value) : null;
                    return acc;
                },
                {} as Record<string, T | null>,
            );
        } catch (error) {
            console.error("Error getting multiple items:", error);
            throw error;
        }
    },
};

export { STORAGE_KEYS };
