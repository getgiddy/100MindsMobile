export interface FeedbackSession {
    id: string;
    scenarioId: string;
    userId?: string;
    score: number; // 0-100
    completedAt: Date;
    duration: number; // actual time taken in seconds
    transcript?: ConversationMessage[];
    analysis?: FeedbackAnalysis;
}

export interface ConversationMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
}

export interface FeedbackAnalysis {
    strengths: string[];
    areasForImprovement: string[];
    keyInsights: string[];
    communicationScore: number;
    empathyScore: number;
    problemSolvingScore: number;
    overallScore: number;
}

export interface FeedbackListItem {
    id: string;
    scenarioTitle: string;
    category: string;
    score: number;
    dateLabel: string; // e.g., "Nov. 11th, 2025"
    completedAt: Date;
}

export interface UserProgress {
    totalSessionsCompleted: number;
    averageScore: number;
    categoryBreakdown: {
        category: string;
        sessionsCompleted: number;
        averageScore: number;
    }[];
    improvementTrend: number; // percentage change over time
    lastSessionDate?: Date;
}
