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

    // Tavus proxy (backend-secured)
    TAVUS_CREATE_PERSONA: "/tavus/personas",
    TAVUS_PERSONA_STATUS: (id: string) => `/tavus/personas/${id}/status`,
    TAVUS_LIST_DOCUMENTS: "/tavus/documents",
    TAVUS_LIST_REPLICAS: "/tavus/replicas",
} as const;
