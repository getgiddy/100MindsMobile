import { supabase } from "@/lib/supabase";
import type { Conversation } from "@/types/conversation";

/**
 * Conversation Service
 * Manages Tavus conversations and their lifecycle
 */

type DbConversation = {
    id: string;
    conversation_id: string;
    user_id: string;
    scenario_id: string;
    started_at: string;
    ended_at: string | null;
    status: string;
    tavus_metadata: any;
    recording_url: string | null;
    created_at: string;
    updated_at: string;
};

class ConversationService {
    /**
     * Map database row to app Conversation type
     */
    private mapDbToConversation(dbConv: DbConversation): Conversation {
        return {
            id: dbConv.id,
            conversationId: dbConv.conversation_id,
            userId: dbConv.user_id,
            scenarioId: dbConv.scenario_id,
            startedAt: new Date(dbConv.started_at),
            endedAt: dbConv.ended_at ? new Date(dbConv.ended_at) : undefined,
            status: dbConv.status as any,
            tavusMetadata: dbConv.tavus_metadata,
            recordingUrl: dbConv.recording_url || undefined,
            createdAt: new Date(dbConv.created_at),
            updatedAt: new Date(dbConv.updated_at),
        };
    }

    /**
     * Get current user ID from Supabase session
     */
    private async getCurrentUserId(): Promise<string | null> {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id || null;
    }

    /**
     * Get all conversations for current user
     */
    async getConversations(): Promise<Conversation[]> {
        const userId = await this.getCurrentUserId();
        if (!userId) return [];

        try {
            const { data, error } = await supabase
                .from("conversations")
                .select("*")
                .eq("user_id", userId)
                .order("started_at", { ascending: false });

            if (error) throw error;
            return (data || []).map(this.mapDbToConversation);
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
            return [];
        }
    }

    /**
     * Get conversation by ID
     */
    async getConversationById(id: string): Promise<Conversation | null> {
        const userId = await this.getCurrentUserId();
        if (!userId) return null;

        try {
            const { data, error } = await supabase
                .from("conversations")
                .select("*")
                .eq("id", id)
                .eq("user_id", userId)
                .single();

            if (error) throw error;
            return data ? this.mapDbToConversation(data) : null;
        } catch (error) {
            console.error("Failed to fetch conversation:", error);
            return null;
        }
    }

    /**
     * Get conversation by Tavus conversation ID
     */
    async getConversationByTavusId(
        conversationId: string,
    ): Promise<Conversation | null> {
        const userId = await this.getCurrentUserId();
        if (!userId) return null;

        try {
            const { data, error } = await supabase
                .from("conversations")
                .select("*")
                .eq("conversation_id", conversationId)
                .eq("user_id", userId)
                .single();

            if (error) throw error;
            return data ? this.mapDbToConversation(data) : null;
        } catch (error) {
            console.error("Failed to fetch conversation by Tavus ID:", error);
            return null;
        }
    }

    /**
     * Get conversations for a specific scenario
     */
    async getConversationsByScenario(
        scenarioId: string,
    ): Promise<Conversation[]> {
        const userId = await this.getCurrentUserId();
        if (!userId) return [];

        try {
            const { data, error } = await supabase
                .from("conversations")
                .select("*")
                .eq("user_id", userId)
                .eq("scenario_id", scenarioId)
                .order("started_at", { ascending: false });

            if (error) throw error;
            return (data || []).map(this.mapDbToConversation);
        } catch (error) {
            console.error("Failed to fetch scenario conversations:", error);
            return [];
        }
    }

    /**
     * Get active conversations (not completed/ended/failed)
     */
    async getActiveConversations(): Promise<Conversation[]> {
        const userId = await this.getCurrentUserId();
        if (!userId) return [];

        try {
            const { data, error } = await supabase
                .from("conversations")
                .select("*")
                .eq("user_id", userId)
                .eq("status", "active")
                .order("started_at", { ascending: false });

            if (error) throw error;
            return (data || []).map(this.mapDbToConversation);
        } catch (error) {
            console.error("Failed to fetch active conversations:", error);
            return [];
        }
    }

    /**
     * Update conversation status
     */
    async updateConversationStatus(
        id: string,
        status: "active" | "completed" | "ended" | "failed",
    ): Promise<void> {
        const userId = await this.getCurrentUserId();
        if (!userId) throw new Error("User not authenticated");

        try {
            const { error } = await supabase
                .from("conversations")
                .update({
                    status,
                    ended_at: status !== "active"
                        ? new Date().toISOString()
                        : null,
                })
                .eq("id", id)
                .eq("user_id", userId);

            if (error) throw error;
        } catch (error) {
            console.error("Failed to update conversation status:", error);
            throw error;
        }
    }
}

// Export singleton instance
export const conversationService = new ConversationService();
