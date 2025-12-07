/**
 * Conversation Types
 * Types for Tavus conversations and webhook data
 */

export type ConversationStatus = "active" | "completed" | "ended" | "failed";

export interface Conversation {
    id: string;
    conversationId: string; // Tavus conversation ID
    userId: string;
    scenarioId: string;
    startedAt: Date;
    endedAt?: Date;
    status: ConversationStatus;
    tavusMetadata?: TavusWebhookPayload;
    recordingUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface TavusWebhookPayload {
    conversation_id: string;
    status: "active" | "ended" | "error";
    end_reason?: string;
    started_at?: string;
    ended_at?: string;
    duration?: number;
    transcript?: TavusTranscriptMessage[];
    participant_name?: string;
    recording_url?: string;
    participant_left_at?: string;
    error_message?: string;
}

export interface TavusTranscriptMessage {
    role: "user" | "agent";
    content: string;
    timestamp: string;
}

export interface ConversationListItem {
    id: string;
    conversationId: string;
    scenarioTitle: string;
    status: ConversationStatus;
    startedAt: Date;
    duration?: number; // in seconds
}
