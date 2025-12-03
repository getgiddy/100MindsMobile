import type { Database } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import type {
	CreateScenarioInput,
	PersonaConfig,
	Scenario,
	ScenarioFilter,
	UpdateScenarioInput,
} from "@/types";
import { storage, STORAGE_KEYS } from "@/utils/storage";

/**
 * Scenario Service
 * Manages scenario data with Supabase backend and local storage fallback
 */

type DbScenario = Database["public"]["Tables"]["scenarios"]["Row"];
type DbScenarioInsert = Database["public"]["Tables"]["scenarios"]["Insert"];

// Mock data for initial population
const INITIAL_SCENARIOS: Scenario[] = [
	{
		id: "1",
		title: "Difficult Employee",
		description:
			"Handle a challenging team member who's always missing deadlines",
		category: "Team Management",
		duration: 15,
		difficulty: "intermediate",
		imageSource: require("../assets/images/avatars/avatar1.jpg"),
		createdAt: new Date("2025-11-01"),
		updatedAt: new Date("2025-11-01"),
		isCustom: false,
		tags: ["Team Management"],
		persona: defaultPersonaConfig(),
	},
	{
		id: "2",
		title: "Leading Through Change",
		description: "Guide your team during a major organizational shift",
		category: "Leadership",
		duration: 12,
		difficulty: "advanced",
		imageSource: require("../assets/images/avatars/avatar2.jpg"),
		createdAt: new Date("2025-11-01"),
		updatedAt: new Date("2025-11-01"),
		isCustom: false,
		tags: ["Leadership"],
		persona: defaultPersonaConfig(),
	},
	{
		id: "3",
		title: "Resolving Team Conflicts",
		description: "Mediate disagreements to restore collaboration and trust",
		category: "Conflict Resolution",
		duration: 10,
		difficulty: "intermediate",
		imageSource: require("../assets/images/avatars/avatar3.jpg"),
		createdAt: new Date("2025-11-01"),
		updatedAt: new Date("2025-11-01"),
		isCustom: false,
		tags: ["Conflict Resolution"],
		persona: defaultPersonaConfig(),
	},
	{
		id: "4",
		title: "Performance Management",
		description: "Deliver constructive feedback and set clear expectations",
		category: "Performance",
		duration: 8,
		difficulty: "beginner",
		imageSource: require("../assets/images/avatars/avatar4.jpg"),
		createdAt: new Date("2025-11-01"),
		updatedAt: new Date("2025-11-01"),
		isCustom: false,
		tags: ["Performance"],
		persona: defaultPersonaConfig(),
	},
];

class ScenarioService {
	/**
	 * Map database row to app Scenario type
	 */
	private mapDbToScenario(dbScenario: DbScenario): Scenario {
		return {
			id: dbScenario.id,
			title: dbScenario.title,
			description: dbScenario.description,
			category: dbScenario.category as any,
			duration: dbScenario.duration,
			difficulty: dbScenario.difficulty as
				| "beginner"
				| "intermediate"
				| "advanced"
				| undefined,
			imageSource: dbScenario.image_url
				? { uri: dbScenario.image_url }
				: require("../assets/images/avatars/avatar1.jpg"),
			createdAt: new Date(dbScenario.created_at),
			updatedAt: new Date(dbScenario.updated_at),
			isCustom: dbScenario.is_custom,
			tags: dbScenario.tags || [],
			persona: (dbScenario.persona as PersonaConfig) ||
				defaultPersonaConfig(),
		};
	}

	/**
	 * Map app Scenario to database insert type
	 */
	private async mapScenarioToDbInsert(
		input: CreateScenarioInput | UpdateScenarioInput,
		userId: string,
	): Promise<Partial<DbScenarioInsert>> {
		const imageUrl = "imageSource" in input &&
				typeof input.imageSource === "object" &&
				input.imageSource &&
				"uri" in input.imageSource &&
				typeof input.imageSource.uri === "string"
			? input.imageSource.uri
			: null;

		return {
			user_id: userId,
			title: input.title,
			description: input.description,
			category: input.category,
			duration: input.duration,
			difficulty: input.difficulty,
			image_url: imageUrl,
			tags: input.tags || [],
			persona: input.persona
				? JSON.parse(JSON.stringify(input.persona))
				: null,
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
	 * Initialize storage with default scenarios if empty (offline fallback)
	 */
	async initialize(): Promise<void> {
		const userId = await this.getCurrentUserId();

		// If user is logged in, sync with Supabase
		if (userId) {
			try {
				const { data, error } = await supabase
					.from("scenarios")
					.select("*")
					.eq("user_id", userId)
					.limit(1);

				// If Supabase is working and user has no scenarios, seed default ones
				if (!error && data && data.length === 0) {
					await this.seedDefaultScenarios(userId);
				}
				return;
			} catch (error) {
				console.warn(
					"Supabase initialization failed, using local storage:",
					error,
				);
			}
		}

		// Fallback to local storage
		const existing = await storage.get<Scenario[]>(STORAGE_KEYS.SCENARIOS);
		if (!existing || existing.length === 0) {
			await storage.set(STORAGE_KEYS.SCENARIOS, INITIAL_SCENARIOS);
			return;
		}

		// Migration: ensure new optional fields exist with safe defaults
		const migrated = existing.map((s) => ({
			...s,
			tags: s.tags ?? [],
			persona: s.persona ?? defaultPersonaConfig(),
		}));
		await storage.set(STORAGE_KEYS.SCENARIOS, migrated);
	}

	/**
	 * Seed default scenarios for new users
	 */
	private async seedDefaultScenarios(userId: string): Promise<void> {
		const defaultScenarios = INITIAL_SCENARIOS.map((scenario) => ({
			user_id: userId,
			title: scenario.title,
			description: scenario.description,
			category: scenario.category,
			duration: scenario.duration,
			difficulty: scenario.difficulty,
			image_url: null, // Will use local images for now
			tags: scenario.tags || [],
			persona: JSON.parse(
				JSON.stringify(scenario.persona || defaultPersonaConfig()),
			),
			is_custom: false,
		}));

		const { error } = await supabase
			.from("scenarios")
			.insert(defaultScenarios);

		if (error) {
			console.error("Error seeding default scenarios:", error);
		}
	}

	/**
	 * Get all scenarios with optional filtering
	 */
	async getScenarios(filter?: ScenarioFilter): Promise<Scenario[]> {
		const userId = await this.getCurrentUserId();

		// Try Supabase first if user is logged in
		if (userId) {
			try {
				let query = supabase
					.from("scenarios")
					.select("*")
					.eq("user_id", userId);

				// Apply database-level filters
				if (filter?.category && filter.category !== "All") {
					query = query.eq("category", filter.category);
				}
				if (filter?.difficulty) {
					query = query.eq("difficulty", filter.difficulty);
				}
				if (filter?.isCustomOnly) {
					query = query.eq("is_custom", true);
				}

				query = query.order("created_at", { ascending: false });

				const { data, error } = await query;

				if (error) throw error;

				let scenarios = (data || []).map(this.mapDbToScenario);

				// Apply client-side search filter
				if (filter?.searchQuery) {
					const query = filter.searchQuery.toLowerCase();
					scenarios = scenarios.filter(
						(s) =>
							s.title.toLowerCase().includes(query) ||
							s.description.toLowerCase().includes(query),
					);
				}

				return scenarios;
			} catch (error) {
				console.warn(
					"Supabase query failed, falling back to local storage:",
					error,
				);
			}
		}

		// Fallback to local storage
		await this.initialize();
		let scenarios = await storage.get<Scenario[]>(STORAGE_KEYS.SCENARIOS);

		if (!scenarios) {
			return [];
		}

		// Apply filters
		if (filter) {
			if (filter.category && filter.category !== "All") {
				scenarios = scenarios.filter((s) =>
					s.category === filter.category
				);
			}
			if (filter.difficulty) {
				scenarios = scenarios.filter((s) =>
					s.difficulty === filter.difficulty
				);
			}
			if (filter.searchQuery) {
				const query = filter.searchQuery.toLowerCase();
				scenarios = scenarios.filter(
					(s) =>
						s.title.toLowerCase().includes(query) ||
						s.description.toLowerCase().includes(query),
				);
			}
			if (filter.isCustomOnly) {
				scenarios = scenarios.filter((s) => s.isCustom === true);
			}
		}

		return scenarios;
	}

	/**
	 * Get scenario by ID
	 */
	async getScenarioById(id: string): Promise<Scenario | null> {
		const userId = await this.getCurrentUserId();

		// Try Supabase first if user is logged in
		if (userId) {
			try {
				const { data, error } = await supabase
					.from("scenarios")
					.select("*")
					.eq("id", id)
					.eq("user_id", userId)
					.single();

				if (error) throw error;
				if (data) return this.mapDbToScenario(data);
			} catch (error) {
				console.warn(
					"Supabase query failed, falling back to local storage:",
					error,
				);
			}
		}

		// Fallback to local storage
		const scenarios = await this.getScenarios();
		return scenarios.find((s) => s.id === id) || null;
	}

	/**
	 * Create new scenario
	 */
	async createScenario(input: CreateScenarioInput): Promise<Scenario> {
		const userId = await this.getCurrentUserId();

		// Try Supabase first if user is logged in
		if (userId) {
			try {
				const dbInput = await this.mapScenarioToDbInsert(input, userId);

				const { data, error } = await supabase
					.from("scenarios")
					.insert({
						...dbInput,
						is_custom: true,
					})
					.select()
					.single();

				if (error) throw error;
				if (data) return this.mapDbToScenario(data);
			} catch (error) {
				console.error(
					"Supabase insert failed, falling back to local storage:",
					error,
				);
			}
		}

		// Fallback to local storage
		const scenarios = await this.getScenarios();

		const newScenario: Scenario = {
			id: Date.now().toString(),
			...input,
			createdAt: new Date(),
			updatedAt: new Date(),
			isCustom: true,
			tags: input.tags ?? [],
			persona: input.persona ?? defaultPersonaConfig(),
		};

		const updated = [...scenarios, newScenario];
		await storage.set(STORAGE_KEYS.SCENARIOS, updated);

		return newScenario;
	}

	/**
	 * Update existing scenario
	 */
	async updateScenario(input: UpdateScenarioInput): Promise<Scenario | null> {
		const userId = await this.getCurrentUserId();

		// Try Supabase first if user is logged in
		if (userId) {
			try {
				const dbInput = await this.mapScenarioToDbInsert(input, userId);

				const { data, error } = await supabase
					.from("scenarios")
					.update(dbInput)
					.eq("id", input.id)
					.eq("user_id", userId)
					.select()
					.single();

				if (error) throw error;
				if (data) return this.mapDbToScenario(data);
			} catch (error) {
				console.error(
					"Supabase update failed, falling back to local storage:",
					error,
				);
			}
		}

		// Fallback to local storage
		const scenarios = await this.getScenarios();
		const index = scenarios.findIndex((s) => s.id === input.id);

		if (index === -1) {
			return null;
		}

		const updated = {
			...scenarios[index],
			...input,
			updatedAt: new Date(),
		};

		scenarios[index] = updated;
		await storage.set(STORAGE_KEYS.SCENARIOS, scenarios);

		return updated;
	}

	/**
	 * Delete scenario
	 */
	async deleteScenario(id: string): Promise<boolean> {
		const userId = await this.getCurrentUserId();

		// Try Supabase first if user is logged in
		if (userId) {
			try {
				const { error } = await supabase
					.from("scenarios")
					.delete()
					.eq("id", id)
					.eq("user_id", userId);

				if (error) throw error;
				return true;
			} catch (error) {
				console.error(
					"Supabase delete failed, falling back to local storage:",
					error,
				);
			}
		}

		// Fallback to local storage
		const scenarios = await this.getScenarios();
		const filtered = scenarios.filter((s) => s.id !== id);

		if (filtered.length === scenarios.length) {
			return false;
		}

		await storage.set(STORAGE_KEYS.SCENARIOS, filtered);
		return true;
	}

	/**
	 * Get scenario categories with counts
	 */
	async getCategories(): Promise<{ name: string; count: number }[]> {
		const scenarios = await this.getScenarios();
		const categoryMap = new Map<string, number>();

		for (const scenario of scenarios) {
			const count = categoryMap.get(scenario.category) || 0;
			categoryMap.set(scenario.category, count + 1);
		}

		return Array.from(categoryMap.entries()).map(([name, count]) => ({
			name,
			count,
		}));
	}
}

// Export singleton instance
export const scenarioService = new ScenarioService();

// Default persona config helper - uses preconfigured Tavus persona
function defaultPersonaConfig(): PersonaConfig {
	return {
		// Use a preconfigured Tavus persona ID for all scenarios
		// This persona should be created once in Tavus dashboard
		personaId: "pa9c7a69d551",
		personaName: "Roleplay Coach",
		isSyncedRemote: true, // Already exists in Tavus
	};
}
