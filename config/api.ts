// API Configuration
export const API_CONFIG = {
    // Update these when you have a backend
    BASE_URL: __DEV__ ? "http://localhost:3000/api" : "https://api.100minds.app",
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
};

export const API_ENDPOINTS = {
    // Scenarios
    SCENARIOS: "/scenarios",
    SCENARIO_BY_ID: (id: string) => `/scenarios/${id}`,

    // Feedback
    FEEDBACK: "/feedback",
    FEEDBACK_BY_ID: (id: string) => `/feedback/${id}`,
    USER_PROGRESS: "/feedback/progress",

    // Auth (for future use)
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    PROFILE: "/auth/profile",
} as const;
