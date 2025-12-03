import { API_CONFIG, API_ENDPOINTS } from "@/config/api";
import type { PersonaConfig, PersonaInput, PersonaLayersConfig } from "@/types";

/**
 * Tavus Persona Service
 * Proxies calls to backend for secure Tavus API integration
 * Backend should handle API key and validation
 */

export interface TavusPersonaResponse {
    persona_id: string;
    persona_name?: string;
    created_at: string;
    status?: "queued" | "processing" | "ready" | "error";
}

export interface TavusDocumentInfo {
    id: string;
    name: string;
    tags: string[];
    created_at: string;
}

export interface TavusReplicaInfo {
    id: string;
    name: string;
    thumbnail_url?: string;
}

class TavusService {
    /**
     * Create a new Tavus persona via backend proxy
     * Backend should validate, add API key, and call Tavus API
     */
    async createPersona(input: PersonaInput): Promise<TavusPersonaResponse> {
        try {
            const body = this.buildPersonaPayload(input);

            const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_ENDPOINTS.TAVUS_CREATE_PERSONA}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        // Authorization header should be added by backend proxy
                    },
                    body: JSON.stringify(body),
                    signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
                },
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message || `Persona creation failed: ${response.status}`,
                );
            }

            const data: TavusPersonaResponse = await response.json();
            return data;
        } catch (error) {
            console.error("TavusService.createPersona error:", error);
            throw error;
        }
    }

    /**
     * Poll persona status until ready or error
     * Uses exponential backoff: 2s, 4s, 8s, 16s (max 30s)
     */
    async pollPersonaStatus(
        personaId: string,
        maxAttempts: number = 10,
    ): Promise<PersonaConfig> {
        let attempt = 0;
        while (attempt < maxAttempts) {
            try {
                const status = await this.getPersonaStatus(personaId);

                if (status.status === "ready" || status.status === "error") {
                    return status;
                }

                // Exponential backoff: min 2s, max 30s
                const delay = Math.min(2000 * 2 ** attempt, 30000);
                await new Promise((resolve) => setTimeout(resolve, delay));
                attempt++;
            } catch (error) {
                console.error(`Poll attempt ${attempt} failed:`, error);
                attempt++;
                if (attempt >= maxAttempts) throw error;
            }
        }

        throw new Error("Persona status polling timed out");
    }

    /**
     * Get current persona status from backend
     */
    async getPersonaStatus(personaId: string): Promise<PersonaConfig> {
        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_ENDPOINTS.TAVUS_PERSONA_STATUS(personaId)}`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
                },
            );

            if (!response.ok) {
                throw new Error(`Status fetch failed: ${response.status}`);
            }

            const data = await response.json();
            return {
                personaId: data.persona_id,
                personaName: data.persona_name,
                status: data.status || "processing",
                lastStatusAt: new Date(data.last_status_at || Date.now()),
                syncError: data.error || null,
                isSyncedRemote: true,
            };
        } catch (error) {
            console.error("TavusService.getPersonaStatus error:", error);
            throw error;
        }
    }

    /**
     * List available pre-indexed documents from backend
     */
    async listDocuments(): Promise<TavusDocumentInfo[]> {
        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_ENDPOINTS.TAVUS_LIST_DOCUMENTS}`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
                },
            );

            if (!response.ok) {
                throw new Error(`List documents failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("TavusService.listDocuments error:", error);
            return []; // Graceful fallback
        }
    }

    /**
     * List available replicas from backend
     */
    async listReplicas(): Promise<TavusReplicaInfo[]> {
        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_ENDPOINTS.TAVUS_LIST_REPLICAS}`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
                },
            );

            if (!response.ok) {
                throw new Error(`List replicas failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("TavusService.listReplicas error:", error);
            return []; // Graceful fallback
        }
    }

    /**
     * Build Tavus API payload from PersonaInput
     */
    private buildPersonaPayload(input: PersonaInput): Record<string, any> {
        const payload: Record<string, any> = {
            pipeline_mode: input.pipelineMode || "full",
        };

        if (input.personaName) payload.persona_name = input.personaName;
        if (input.systemPrompt) payload.system_prompt = input.systemPrompt;
        if (input.context) payload.context = input.context;
        if (input.defaultReplicaId) payload.default_replica_id = input.defaultReplicaId;

        // Add layers if provided
        if (input.layers) {
            payload.layers = this.buildLayersPayload(input.layers);
        }

        return payload;
    }

    /**
     * Build layers configuration for Tavus API
     */
    private buildLayersPayload(layers: PersonaLayersConfig): Record<string, any> {
        const payload: Record<string, any> = {};

        if (layers.llm) payload.llm = layers.llm;
        if (layers.tts) payload.tts = layers.tts;
        if (layers.perception) payload.perception = layers.perception;
        if (layers.stt) payload.stt = layers.stt;
        if (layers.conversational_flow) payload.conversational_flow = layers.conversational_flow;
        if (layers.document_ids) payload.document_ids = layers.document_ids;
        if (layers.document_tags) payload.document_tags = layers.document_tags;

        return payload;
    }
}

// Export singleton instance
export const tavusService = new TavusService();
