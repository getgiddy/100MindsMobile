import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TAVUS_API_BASE = "https://tavusapi.com";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

interface PersonaInput {
	personaName?: string;
	systemPrompt?: string;
	pipelineMode?: string;
	context?: string;
	defaultReplicaId?: string;
	layers?: any;
}

serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		// Get Tavus API key from environment
		const tavusApiKey = Deno.env.get("TAVUS_API_KEY");
		if (!tavusApiKey) {
			throw new Error("TAVUS_API_KEY not configured");
		}

		// Verify authentication
		const supabaseClient = createClient(
			Deno.env.get("SUPABASE_URL") ?? "",
			Deno.env.get("SUPABASE_ANON_KEY") ?? "",
			{
				global: {
					headers: {
						Authorization: req.headers.get("Authorization")!,
					},
				},
			},
		);

		const {
			data: { user },
			error: authError,
		} = await supabaseClient.auth.getUser();

		if (authError || !user) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		// Parse URL to determine the route
		const url = new URL(req.url);
		const pathParts = url.pathname.split("/").filter((p) => p);

		// Remove 'tavus-proxy' from path if present
		const routeParts = pathParts.filter((p) => p !== "tavus-proxy");
		const resource = routeParts[0]; // 'personas', 'documents', 'replicas'
		const resourceId = routeParts[1]; // optional ID

		// Route the request
		switch (req.method) {
			case "POST":
				if (resource === "personas") {
					return await createPersona(req, tavusApiKey);
				}
				break;

			case "GET":
				if (resource === "personas" && resourceId) {
					return await getPersonaStatus(resourceId, tavusApiKey);
				} else if (resource === "documents") {
					return await getDocuments(tavusApiKey);
				} else if (resource === "replicas") {
					return await getReplicas(tavusApiKey);
				}
				break;

			default:
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

		return new Response(JSON.stringify({ error: "Not found" }), {
			status: 404,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Edge function error:", error);
		return new Response(
			JSON.stringify({ error: error.message || "Internal server error" }),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	}
});

/**
 * Create a new Tavus persona
 */
async function createPersona(req: Request, apiKey: string): Promise<Response> {
	const { personaInput } = await req.json();

	if (!personaInput) {
		return new Response(
			JSON.stringify({ error: "personaInput is required" }),
			{
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	}

	const response = await fetch(`${TAVUS_API_BASE}/v2/personas`, {
		method: "POST",
		headers: {
			"x-api-key": apiKey,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(personaInput),
	});

	const data = await response.json();

	return new Response(JSON.stringify(data), {
		status: response.status,
		headers: { ...corsHeaders, "Content-Type": "application/json" },
	});
}

/**
 * Get persona status
 */
async function getPersonaStatus(
	personaId: string,
	apiKey: string,
): Promise<Response> {
	console.log(`[Edge Function] Fetching persona status for: ${personaId}`);

	try {
		const response = await fetch(
			`${TAVUS_API_BASE}/v2/personas/${personaId}`,
			{
				method: "GET",
				headers: {
					"x-api-key": apiKey,
					"Content-Type": "application/json",
				},
			},
		);

		const data = await response.json();

		console.log(`[Edge Function] Tavus API response for ${personaId}:`, {
			status: response.status,
			personaStatus: data.status,
			hasError: !!data.error,
		});

		return new Response(JSON.stringify(data), {
			status: response.status,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error(
			`[Edge Function] Error fetching persona status for ${personaId}:`,
			error,
		);
		return new Response(
			JSON.stringify({
				error: error.message || "Failed to fetch persona status",
				persona_id: personaId,
				status: "error",
			}),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	}
}

/**
 * Get indexed documents
 */
async function getDocuments(apiKey: string): Promise<Response> {
	const response = await fetch(`${TAVUS_API_BASE}/v2/knowledge/documents`, {
		method: "GET",
		headers: {
			"x-api-key": apiKey,
			"Content-Type": "application/json",
		},
	});

	const data = await response.json();

	return new Response(JSON.stringify(data), {
		status: response.status,
		headers: { ...corsHeaders, "Content-Type": "application/json" },
	});
}

/**
 * Get available replicas (video avatars)
 */
async function getReplicas(apiKey: string): Promise<Response> {
	const response = await fetch(`${TAVUS_API_BASE}/v2/replicas`, {
		method: "GET",
		headers: {
			"x-api-key": apiKey,
			"Content-Type": "application/json",
		},
	});

	const data = await response.json();

	return new Response(JSON.stringify(data), {
		status: response.status,
		headers: { ...corsHeaders, "Content-Type": "application/json" },
	});
}
