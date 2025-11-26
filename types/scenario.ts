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
}

export interface UpdateScenarioInput extends Partial<CreateScenarioInput> {
    id: string;
}
