import type {
    CreateScenarioInput,
    Scenario,
    ScenarioFilter,
    UpdateScenarioInput,
} from "@/types";
import { storage, STORAGE_KEYS } from "@/utils/storage";

/**
 * Scenario Service
 * Manages scenario data - currently uses local storage
 * Can be extended to use REST API calls
 */

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
    },
];

class ScenarioService {
    /**
     * Initialize storage with default scenarios if empty
     */
    async initialize(): Promise<void> {
        const existing = await storage.get<Scenario[]>(STORAGE_KEYS.SCENARIOS);
        if (!existing || existing.length === 0) {
            await storage.set(STORAGE_KEYS.SCENARIOS, INITIAL_SCENARIOS);
        }
    }

    /**
     * Get all scenarios with optional filtering
     */
    async getScenarios(filter?: ScenarioFilter): Promise<Scenario[]> {
        await this.initialize();
        let scenarios = await storage.get<Scenario[]>(STORAGE_KEYS.SCENARIOS);

        if (!scenarios) {
            return [];
        }

        // Apply filters
        if (filter) {
            if (filter.category && filter.category !== "All") {
                scenarios = scenarios.filter((s) => s.category === filter.category);
            }
            if (filter.difficulty) {
                scenarios = scenarios.filter((s) => s.difficulty === filter.difficulty);
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
        const scenarios = await this.getScenarios();
        return scenarios.find((s) => s.id === id) || null;
    }

    /**
     * Create new scenario
     */
    async createScenario(input: CreateScenarioInput): Promise<Scenario> {
        const scenarios = await this.getScenarios();

        const newScenario: Scenario = {
            id: Date.now().toString(), // Simple ID generation
            ...input,
            createdAt: new Date(),
            updatedAt: new Date(),
            isCustom: true,
        };

        const updated = [...scenarios, newScenario];
        await storage.set(STORAGE_KEYS.SCENARIOS, updated);

        return newScenario;
    }

    /**
     * Update existing scenario
     */
    async updateScenario(input: UpdateScenarioInput): Promise<Scenario | null> {
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
        const scenarios = await this.getScenarios();
        const filtered = scenarios.filter((s) => s.id !== id);

        if (filtered.length === scenarios.length) {
            return false; // Not found
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
