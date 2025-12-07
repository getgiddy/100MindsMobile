import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

interface TavusWebhookPayload {
	properties: {
		replica_id: string;
		transcript?: TavusTranscriptMessage[];
		shutdown_reason?: string;
		[key: string]: any;
	};
	conversation_id: string;
	webhook_url: string;
	event_type:
		| "application.transcription_ready"
		| "system.shutdown"
		| "system.replica_joined";
	message_type: "system" | "application";
	timestamp: string;
}

interface TavusTranscriptMessage {
	role: "user" | "assistant" | "system";
	content: string;
}

serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		// Only accept POST requests
		if (req.method !== "POST") {
			return new Response(
				JSON.stringify({ error: "Method not allowed" }),
				{
					status: 405,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		// Parse webhook payload
		const payload: TavusWebhookPayload = await req.json();

		console.log("[TavusWebhook] Received webhook:", {
			conversationId: payload.conversation_id,
			eventType: payload.event_type,
			messageType: payload.message_type,
			timestamp: payload.timestamp,
			hasTranscript: !!payload.properties.transcript,
		});

		// Validate required fields
		if (!payload.conversation_id) {
			return new Response(
				JSON.stringify({ error: "Missing conversation_id" }),
				{
					status: 400,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		// Optional: Verify webhook signature from Tavus if they provide one
		// This would add security to ensure requests are really from Tavus
		const webhookSecret = Deno.env.get("TAVUS_WEBHOOK_SECRET");
		if (webhookSecret) {
			// Implement signature verification if Tavus provides it
			// For now, we'll skip this step
		}

		// Create Supabase client with SERVICE ROLE key (bypasses RLS)
		// This is safe for webhooks because they're server-to-server
		const supabaseClient = createClient(
			Deno.env.get("SUPABASE_URL") ?? "",
			Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
		);

		// Find existing conversation record by conversation_id
		const { data: conversation, error: findError } = await supabaseClient
			.from("conversations")
			.select("*")
			.eq("conversation_id", payload.conversation_id)
			.single();

		if (findError) {
			console.error("[TavusWebhook] Conversation not found:", {
				conversationId: payload.conversation_id,
				error: findError.message,
			});

			// If conversation doesn't exist, we can't process webhook
			return new Response(
				JSON.stringify({
					error: "Conversation not found",
					conversationId: payload.conversation_id,
				}),
				{
					status: 404,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		console.log("[TavusWebhook] Found conversation:", {
			id: conversation.id,
			userId: conversation.user_id,
			scenarioId: conversation.scenario_id,
			currentStatus: conversation.status,
		});

		// Handle different event types
		let responseMessage = "Webhook processed";

		switch (payload.event_type) {
			case "system.replica_joined":
				// Replica has joined - conversation is now active
				await handleReplicaJoined(supabaseClient, conversation, payload);
				responseMessage = "Replica joined";
				break;

			case "system.shutdown":
				// Conversation ended - update status
				await handleSystemShutdown(supabaseClient, conversation, payload);
				responseMessage = "Conversation shutdown processed";
				break;

			case "application.transcription_ready":
				// Transcript ready - create feedback session
				await handleTranscriptionReady(
					supabaseClient,
					conversation,
					payload,
				);
				responseMessage = "Feedback session created";
				break;

			default:
				console.warn("[TavusWebhook] Unknown event type:", payload.event_type);
				responseMessage = "Unknown event type";
		}

		return new Response(
			JSON.stringify({
				success: true,
				conversationId: payload.conversation_id,
				eventType: payload.event_type,
				message: responseMessage,
			}),
			{
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("[TavusWebhook] Error processing webhook:", error);
		return new Response(
			JSON.stringify({
				error: error.message || "Internal server error",
			}),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	}
});

/**
 * Handle system.replica_joined event
 */
async function handleReplicaJoined(
	supabaseClient: any,
	conversation: any,
	payload: TavusWebhookPayload,
) {
	console.log("[TavusWebhook] Replica joined:", {
		conversationId: payload.conversation_id,
		replicaId: payload.properties.replica_id,
	});

	// Update conversation to ensure it's marked as active
	const { error } = await supabaseClient
		.from("conversations")
		.update({
			status: "active",
			tavus_metadata: payload,
		})
		.eq("id", conversation.id);

	if (error) {
		console.error("[TavusWebhook] Failed to update conversation:", error);
		throw error;
	}
}

/**
 * Handle system.shutdown event
 */
async function handleSystemShutdown(
	supabaseClient: any,
	conversation: any,
	payload: TavusWebhookPayload,
) {
	const shutdownReason = payload.properties.shutdown_reason || "unknown";

	console.log("[TavusWebhook] System shutdown:", {
		conversationId: payload.conversation_id,
		shutdownReason,
	});

	// Determine final status based on shutdown reason
	let finalStatus = "ended";
	if (
		shutdownReason.includes("error") ||
		shutdownReason.includes("exception")
	) {
		finalStatus = "failed";
	} else if (
		shutdownReason === "end_conversation_endpoint_hit" ||
		shutdownReason === "participant_left_timeout reached" ||
		shutdownReason === "max_call_duration reached"
	) {
		finalStatus = "completed";
	}

	// Update conversation with shutdown info
	const { error } = await supabaseClient
		.from("conversations")
		.update({
			status: finalStatus,
			ended_at: new Date().toISOString(),
			tavus_metadata: payload,
		})
		.eq("id", conversation.id);

	if (error) {
		console.error("[TavusWebhook] Failed to update conversation:", error);
		throw error;
	}

	console.log("[TavusWebhook] Updated conversation status to:", finalStatus);
}

/**
 * Handle application.transcription_ready event
 */
async function handleTranscriptionReady(
	supabaseClient: any,
	conversation: any,
	payload: TavusWebhookPayload,
) {
	console.log(
		"[TavusWebhook] Transcription ready, creating feedback session...",
	);

	const transcript = payload.properties.transcript;
	if (!transcript || transcript.length === 0) {
		console.warn("[TavusWebhook] No transcript available");
		return;
	}

	// Fetch scenario details for context
	const { data: scenario } = await supabaseClient
		.from("scenarios")
		.select("title, description, category")
		.eq("id", conversation.scenario_id)
		.single();

	// Transform Tavus transcript to app format
	const formattedTranscript = transcript.map((msg, index) => ({
		id: `${payload.conversation_id}-${index}`,
		role: msg.role === "assistant"
			? "assistant"
			: msg.role === "user"
			? "user"
			: "system",
		content: msg.content,
		timestamp: new Date().toISOString(), // Tavus doesn't include timestamp in transcript
	}));

	// Generate AI-powered analysis
	const analysis = await generateAIAnalysis(transcript, scenario);

	// Calculate duration from conversation timestamps
	let duration = 60; // Default
	if (conversation.started_at && conversation.ended_at) {
		const start = new Date(conversation.started_at).getTime();
		const end = new Date(conversation.ended_at).getTime();
		duration = Math.floor((end - start) / 1000);
	} else if (conversation.started_at) {
		const start = new Date(conversation.started_at).getTime();
		const now = new Date().getTime();
		duration = Math.floor((now - start) / 1000);
	}

	// Create feedback session
	const { data: feedbackSession, error: insertError } = await supabaseClient
		.from("feedback_sessions")
		.insert({
			user_id: conversation.user_id,
			scenario_id: conversation.scenario_id,
			conversation_id: conversation.id,
			score: analysis.overallScore,
			completed_at: conversation.ended_at || new Date().toISOString(),
			duration,
			transcript: formattedTranscript,
			analysis,
		})
		.select()
		.single();

	if (insertError) {
		console.error("[TavusWebhook] Failed to create feedback session:", {
			error: insertError.message,
		});
		throw insertError;
	}

	console.log("[TavusWebhook] Feedback session created:", {
		feedbackId: feedbackSession.id,
		score: analysis.overallScore,
		messageCount: formattedTranscript.length,
		duration,
	});
}

/**
 * Generate AI-powered analysis from transcript using GPT-4
 */
async function generateAIAnalysis(
	transcript: TavusTranscriptMessage[],
	scenario: any,
): Promise<any> {
	const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
	if (!openaiApiKey) {
		console.warn(
			"[TavusWebhook] OpenAI API key not configured, using fallback analysis",
		);
		return generateFallbackAnalysis(transcript);
	}

	try {
		// Format transcript for GPT
		const conversationText = transcript
			.map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
			.join("\n");

		const systemPrompt =
			`You are an expert leadership coach analyzing a training conversation. Evaluate the participant's performance in this ${
				scenario?.category || "leadership"
			} scenario.

Scenario: ${scenario?.title || "Leadership Training"}
Description: ${scenario?.description || "Practice session"}

Provide a detailed analysis in the following JSON format:
{
  "strengths": ["3-5 specific strengths demonstrated"],
  "areasForImprovement": ["3-5 specific areas to improve"],
  "keyInsights": ["3-5 key observations about their approach"],
  "communicationScore": <0-100>,
  "empathyScore": <0-100>,
  "problemSolvingScore": <0-100>,
  "overallScore": <0-100>
}

Be specific, constructive, and reference actual examples from the conversation.`;

		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${openaiApiKey}`,
			},
			body: JSON.stringify({
				model: "gpt-4o",
				messages: [
					{ role: "system", content: systemPrompt },
					{
						role: "user",
						content: `Analyze this conversation:\n\n${conversationText}`,
					},
				],
				temperature: 0.7,
				response_format: { type: "json_object" },
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			console.error("[TavusWebhook] OpenAI API error:", error);
			return generateFallbackAnalysis(transcript);
		}

		const data = await response.json();
		const analysis = JSON.parse(data.choices[0].message.content);

		console.log("[TavusWebhook] AI analysis generated successfully");
		return analysis;
	} catch (error) {
		console.error("[TavusWebhook] Error generating AI analysis:", error);
		return generateFallbackAnalysis(transcript);
	}
}

/**
 * Fallback analysis when AI is unavailable
 */
function generateFallbackAnalysis(transcript: TavusTranscriptMessage[]): any {
	const userMessages = transcript.filter((msg) => msg.role === "user");
	const agentMessages = transcript.filter((msg) => msg.role === "assistant");

	const totalMessages = transcript.length;
	const userMessageCount = userMessages.length;
	const agentMessageCount = agentMessages.length;

	const avgUserMessageLength = userMessages.length > 0
		? userMessages.reduce((sum, msg) => sum + msg.content.length, 0) /
			userMessages.length
		: 0;

	const communicationScore = Math.min(
		100,
		Math.floor((userMessageCount / Math.max(agentMessageCount, 1)) * 50 + 25),
	);

	const problemSolvingScore = Math.min(
		100,
		Math.floor((avgUserMessageLength / 50) * 50 + 25),
	);

	const empathyScore = 70;

	const overallScore = Math.floor(
		(communicationScore + problemSolvingScore + empathyScore) / 3,
	);

	return {
		strengths: [
			"Completed the conversation",
			`Engaged in ${userMessageCount} exchanges`,
			"Demonstrated active participation",
		],
		areasForImprovement: [
			"Consider more detailed responses",
			"Practice active listening techniques",
			"Explore deeper into the scenario context",
		],
		keyInsights: [
			`Exchanged ${totalMessages} total messages`,
			`User contributed ${userMessageCount} messages`,
			"Completed full conversation session",
		],
		communicationScore,
		empathyScore,
		problemSolvingScore,
		overallScore,
	};
}
