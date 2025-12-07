import { API_CONFIG } from "@/config/api";
import { supabase } from "@/lib/supabase";
import type { PersonaConfig, PersonaInput, PersonaLayersConfig } from "@/types";
import Constants from "expo-constants";

/**
 * Tavus Persona Service
 * Uses Supabase Edge Functions to securely proxy Tavus API calls
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

export interface CreateConversationInput {
	replicaId: string;
	personaId: string;
	scenarioId: string; // Required to link conversation to scenario
	conversationName?: string;
	conversationalContext?: string;
	maxCallDuration?: number;
	participantLeftTimeout?: number;
	participantAbsentTimeout?: number;
}

export interface ConversationResponse {
	conversation_url: string;
	conversation_id: string;
}

class TavusService {
	/**
	 * Get the Edge Function URL
	 */
	private getEdgeFunctionUrl(): string {
		const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || "";
		const url = `${supabaseUrl}/functions/v1/tavus-proxy`;

		console.log("[TavusService] Edge Function URL:", {
			supabaseUrl,
			fullUrl: url,
			hasSupabaseUrl: !!supabaseUrl,
		});

		return url;
	}

	/**
	 * Get auth headers for Edge Function calls
	 */
	private async getAuthHeaders(): Promise<Record<string, string>> {
		const { data: { session }, error } = await supabase.auth.getSession();

		console.log("[TavusService] Auth session check:", {
			hasSession: !!session,
			hasAccessToken: !!session?.access_token,
			tokenLength: session?.access_token?.length || 0,
			userEmail: session?.user?.email,
			error: error?.message,
		});

		if (!session?.access_token) {
			console.error("[TavusService] No access token available!");
		}

		return {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${session?.access_token || ""}`,
		};
	}

	/**
	 * Create a new Tavus persona via Supabase Edge Function
	 */
	async createPersona(input: PersonaInput): Promise<TavusPersonaResponse> {
		try {
			const body = this.buildPersonaPayload(input);
			const headers = await this.getAuthHeaders();
			const url = `${this.getEdgeFunctionUrl()}/personas`;

			console.log("[TavusService] Creating persona:", {
				url,
				hasAuthorization: !!headers.Authorization,
				authorizationPrefix: headers.Authorization?.substring(0, 20),
				payload: JSON.stringify(body).substring(0, 200),
			});

			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				API_CONFIG.TIMEOUT,
			);

			const response = await fetch(url, {
				method: "POST",
				headers,
				body: JSON.stringify({ personaInput: body }),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			console.log("[TavusService] Response:", {
				status: response.status,
				statusText: response.statusText,
				ok: response.ok,
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error("[TavusService] Error response:", {
					status: response.status,
					errorData,
					responseHeaders: Object.fromEntries(
						response.headers.entries(),
					),
				});
				throw new Error(
					errorData.error ||
						`Persona creation failed: ${response.status}`,
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
		maxAttempts: number = 20,
	): Promise<PersonaConfig> {
		console.log(
			`[TavusService] Starting to poll persona status for ${personaId}`,
		);
		let attempt = 0;
		let lastStatus = "unknown";

		while (attempt < maxAttempts) {
			try {
				const status = await this.getPersonaStatus(personaId);
				lastStatus = status.status || "unknown";

				console.log(
					`[TavusService] Poll attempt ${
						attempt + 1
					}/${maxAttempts}: status = ${lastStatus}`,
				);

				if (status.status === "ready") {
					console.log(
						`[TavusService] Persona ${personaId} is ready!`,
					);
					return status;
				}

				if (status.status === "error") {
					console.error(
						`[TavusService] Persona ${personaId} has error:`,
						status.syncError,
					);
					return status;
				}

				// Exponential backoff: min 2s, max 30s
				const delay = Math.min(2000 * 2 ** attempt, 30000);
				console.log(
					`[TavusService] Waiting ${delay}ms before next poll...`,
				);
				await new Promise((resolve) => setTimeout(resolve, delay));
				attempt++;
			} catch (error) {
				console.error(
					`[TavusService] Poll attempt ${attempt + 1} failed:`,
					error,
				);

				// Don't fail immediately on network errors, keep retrying
				attempt++;
				if (attempt >= maxAttempts) {
					console.error(
						`[TavusService] Max polling attempts reached for ${personaId}`,
					);
					throw error;
				}

				// Wait a bit before retrying after error
				const delay = Math.min(2000 * 2 ** attempt, 30000);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}

		const timeoutError = new Error(
			`Persona status polling timed out after ${maxAttempts} attempts. Last status: ${lastStatus}`,
		);
		console.error(`[TavusService] ${timeoutError.message}`);
		throw timeoutError;
	}

	/**
	 * Get current persona status from Edge Function
	 */
	async getPersonaStatus(personaId: string): Promise<PersonaConfig> {
		try {
			const headers = await this.getAuthHeaders();
			const url = `${this.getEdgeFunctionUrl()}/personas/${personaId}`;

			// Use longer timeout for status checks (30 seconds)
			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				30000,
			);

			const response = await fetch(url, {
				method: "GET",
				headers,
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error("[TavusService] Status fetch error:", {
					status: response.status,
					errorData,
					personaId,
				});
				throw new Error(
					errorData.error ||
						`Status fetch failed: ${response.status}`,
				);
			}

			const data = await response.json();
			console.log("[TavusService] Persona status data:", {
				personaId,
				status: data.status,
				hasError: !!data.error,
			});

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
	 * List available pre-indexed documents from Edge Function
	 */
	async listDocuments(): Promise<TavusDocumentInfo[]> {
		try {
			const headers = await this.getAuthHeaders();

			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				API_CONFIG.TIMEOUT,
			);

			const response = await fetch(
				`${this.getEdgeFunctionUrl()}/documents`,
				{
					method: "GET",
					headers,
					signal: controller.signal,
				},
			);

			clearTimeout(timeoutId);

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
	 * List available replicas from Edge Function
	 */
	async listReplicas(): Promise<TavusReplicaInfo[]> {
		try {
			const headers = await this.getAuthHeaders();

			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				API_CONFIG.TIMEOUT,
			);

			const response = await fetch(
				`${this.getEdgeFunctionUrl()}/replicas`,
				{
					method: "GET",
					headers,
					signal: controller.signal,
				},
			);

			clearTimeout(timeoutId);

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
	 * Create a new conversation via Tavus API
	 */
	async createConversation(
		input: CreateConversationInput,
	): Promise<ConversationResponse> {
		try {
			const apiKey = process.env.EXPO_PUBLIC_TAVUS_API_KEY;
			if (!apiKey) {
				throw new Error("Tavus API key not configured");
			}

			// Validate required fields
			if (!input.scenarioId) {
				console.error(
					"[TavusService] Missing required scenarioId:",
					input,
				);
				throw new Error(
					"scenarioId is required for conversation creation",
				);
			}

			// Get webhook URL
			const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || "";
			const webhookUrl = `${supabaseUrl}/functions/v1/tavus-webhook`;

			const payload: Record<string, any> = {
				replica_id: input.replicaId,
				persona_id: input.personaId,
				memory_stores: input.conversationalContext
					? [input.conversationalContext]
					: undefined,
				conversation_name: input.conversationName,
				conversational_context: input.conversationalContext,
				// custom_greeting: "Hey there!",
				callback_url: webhookUrl, // Add webhook URL for conversation completion
				properties: {
					max_call_duration: input.maxCallDuration || 300,
					participant_left_timeout: input.participantLeftTimeout ||
						15,
					participant_absent_timeout:
						input.participantAbsentTimeout || 30,
				},
				test_mode: false,
			};

			console.log("[TavusService] Creating conversation:", {
				replicaId: input.replicaId,
				personaId: input.personaId,
				scenarioId: input.scenarioId,
				hasName: !!input.conversationName,
				hasContext: !!input.conversationalContext,
				webhookUrl,
			});

			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				API_CONFIG.TIMEOUT,
			);

			const response = await fetch(
				"https://tavusapi.com/v2/conversations",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"x-api-key": apiKey,
					},
					body: JSON.stringify(payload),
					signal: controller.signal,
				},
			);

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error("[TavusService] Conversation creation error:", {
					status: response.status,
					errorData,
				});
				throw new Error(
					errorData.error ||
						`Conversation creation failed: ${response.status}`,
				);
			}

			const data = await response.json();
			console.log("[TavusService] Conversation created:", {
				conversationId: data.conversation_id,
				hasUrl: !!data.conversation_url,
			});

			// Store conversation record in database
			if (!input.scenarioId) {
				console.error("[TavusService] Missing scenarioId in input:", {
					conversationId: data.conversation_id,
					input: JSON.stringify(input),
				});
				console.warn(
					"[TavusService] Skipping conversation record storage - scenarioId is required",
				);
			} else {
				await this.storeConversationRecord(
					data.conversation_id,
					input.scenarioId,
				);
			}

			return {
				conversation_url: data.conversation_url,
				conversation_id: data.conversation_id,
			};
		} catch (error) {
			console.error("TavusService.createConversation error:", error);
			throw error;
		}
	}

	/**
	 * Store conversation record in database for webhook tracking
	 */
	private async storeConversationRecord(
		conversationId: string,
		scenarioId: string,
	): Promise<void> {
		try {
			const { data: { user }, error: authError } = await supabase.auth
				.getUser();

			if (authError || !user) {
				console.error(
					"[TavusService] No authenticated user for conversation record",
				);
				throw new Error("User not authenticated");
			}

			const { error: insertError } = await supabase
				.from("conversations")
				.insert({
					conversation_id: conversationId,
					user_id: user.id,
					scenario_id: scenarioId,
					status: "active",
					started_at: new Date().toISOString(),
				});

			if (insertError) {
				console.error("[TavusService] Failed to store conversation:", {
					error: insertError.message,
					conversationId,
				});
				// Don't throw - conversation was created successfully in Tavus
				// This is just for tracking purposes
				console.warn("Continuing despite database insert failure");
			} else {
				console.log("[TavusService] Stored conversation record:", {
					conversationId,
					scenarioId,
					userId: user.id,
				});
			}
		} catch (error) {
			console.error("TavusService.storeConversationRecord error:", error);
			// Don't throw - this is non-critical
		}
	}

	/**
	 * End a conversation via Tavus API
	 * Should be called when user leaves to properly clean up resources
	 */
	async endConversation(conversationId: string): Promise<void> {
		try {
			const apiKey = process.env.EXPO_PUBLIC_TAVUS_API_KEY;
			if (!apiKey) {
				throw new Error("Tavus API key not configured");
			}

			console.log("[TavusService] Ending conversation:", {
				conversationId,
			});

			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				API_CONFIG.TIMEOUT,
			);

			const response = await fetch(
				`https://tavusapi.com/v2/conversations/${conversationId}/end`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"x-api-key": apiKey,
					},
					signal: controller.signal,
				},
			);

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error("[TavusService] End conversation error:", {
					status: response.status,
					errorData,
					conversationId,
				});
				// Don't throw error on end conversation - log it but continue
				console.warn(
					`Failed to end conversation ${conversationId}: ${response.status}`,
				);
				return;
			}

			console.log("[TavusService] Conversation ended successfully:", {
				conversationId,
			});
		} catch (error) {
			console.error("TavusService.endConversation error:", error);
			// Don't throw - ending conversation should be best effort
			console.warn("Failed to end conversation, but continuing");
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
		if (input.defaultReplicaId) {
			payload.default_replica_id = input.defaultReplicaId;
		}

		// Add layers if provided
		if (input.layers) {
			payload.layers = this.buildLayersPayload(input.layers);
		}

		return payload;
	}

	/**
	 * Build layers configuration for Tavus API
	 */
	private buildLayersPayload(
		layers: PersonaLayersConfig,
	): Record<string, any> {
		const payload: Record<string, any> = {};

		if (layers.llm) payload.llm = layers.llm;
		if (layers.tts) payload.tts = layers.tts;
		if (layers.perception) payload.perception = layers.perception;
		if (layers.stt) payload.stt = layers.stt;
		if (layers.conversational_flow) {
			payload.conversational_flow = layers.conversational_flow;
		}
		if (layers.document_ids) payload.document_ids = layers.document_ids;
		if (layers.document_tags) payload.document_tags = layers.document_tags;

		return payload;
	}
}

// Export singleton instance
export const tavusService = new TavusService();
