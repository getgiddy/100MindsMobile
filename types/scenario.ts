export type ScenarioDifficulty = "beginner" | "intermediate" | "advanced";

export type ScenarioCategory =
    | "Team Management"
    | "Conflict Resolution"
    | "Leadership"
    | "Performance"
    | "Communication"
    | "Decision Making";

export interface Scenario {
    id: string;
    title: string;
    description: string;
    category: ScenarioCategory;
    duration: number; // in minutes
    difficulty?: ScenarioDifficulty;
    imageUrl?: string;
    imageSource?: any; // For local images via require()
    createdAt: Date;
    updatedAt: Date;
    isCustom?: boolean; // User-created vs pre-built scenarios
    tags?: string[];
    persona?: PersonaConfig; // Tavus persona configuration linkage
}

export interface ScenarioFilter {
    category?: ScenarioCategory | "All";
    difficulty?: ScenarioDifficulty;
    searchQuery?: string;
    isCustomOnly?: boolean;
}

export interface CreateScenarioInput {
    title: string;
    description: string;
    category: ScenarioCategory;
    duration: number;
    difficulty?: ScenarioDifficulty;
    imageUrl?: string;
    tags?: string[];
    persona?: PersonaInput;
}

export interface UpdateScenarioInput extends Partial<CreateScenarioInput> {
    id: string;
    // Allow updating full persona config (e.g., status updates)
    persona?: PersonaInput | PersonaConfig;
}

// Persona related types (Tavus)
export type PersonaPipelineMode = "full" | "echo";

export type PersonaStatus = "queued" | "processing" | "ready" | "error";

export interface PersonaLLMTool {
    type: "function";
    function: {
        name: string;
        description?: string;
        parameters?: Record<string, any>;
    };
}

export interface PersonaLayersConfig {
    llm?: {
        model?: string;
        speculative_inference?: boolean;
        tools?: PersonaLLMTool[];
    };
    tts?: {
        tts_engine?: string;
        voice_settings?: Record<string, any>;
        tts_emotion_control?: boolean;
        tts_model_name?: string;
    };
    perception?: {
        perception_model?: string;
        ambient_awareness_queries?: string[];
        perception_tool_prompt?: string;
        perception_tools?: PersonaLLMTool[];
    };
    stt?: {
        stt_engine?: string;
        participant_pause_sensitivity?: "low" | "medium" | "high";
        participant_interrupt_sensitivity?: "low" | "medium" | "high";
        smart_turn_detection?: boolean;
    };
    conversational_flow?: {
        turn_detection_model?: string;
        turn_taking_patience?: "low" | "medium" | "high";
        turn_commitment?: "low" | "medium" | "high";
        replica_interruptibility?: "low" | "medium" | "high";
        active_listening?: "low" | "medium" | "high";
    };
    document_ids?: string[];
    document_tags?: string[];
}

export interface PersonaConfig {
    personaId?: string;
    replicaId?: string;
    personaName?: string;
    systemPrompt?: string;
    pipelineMode?: PersonaPipelineMode;
    context?: string;
    defaultReplicaId?: string;
    layers?: PersonaLayersConfig;
    status?: PersonaStatus;
    lastStatusAt?: Date;
    syncError?: string | null;
    isSyncedRemote?: boolean;
}

export interface PersonaInput extends Omit<PersonaConfig, "status" | "lastStatusAt" | "syncError" | "isSyncedRemote"> { }
