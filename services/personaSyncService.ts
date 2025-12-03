import { scenarioService } from "@/services/scenarioService";
import { tavusService } from "@/services/tavusService";
import type { PersonaConfig, PersonaInput } from "@/types";
import { storage, STORAGE_KEYS } from "@/utils/storage";
import { AppState } from "react-native";

interface PendingPersonaItem {
    scenarioId: string;
    personaInput: PersonaInput;
    enqueuedAt: string; // ISO
    attempts: number;
}

/**
 * Persona Sync Service (Phase 4)
 * - Processes queued persona creations securely via backend proxy
 * - Updates local scenarios with personaId and status
 * - Polls status until ready/error with exponential backoff
 * - Runs on AppState focus and periodic interval
 */
class PersonaSyncService {
    private processing = false;
    private intervalId: any = null;

    start() {
        // App comes to foreground -> try processing
        AppState.addEventListener("change", (state) => {
            if (state === "active") {
                this.processQueue();
            }
        });

        // Periodic processing every 60s
        if (!this.intervalId) {
            this.intervalId = setInterval(() => this.processQueue(), 60000);
        }

        // Kick off immediately
        this.processQueue();
    }

    async enqueue(item: PendingPersonaItem): Promise<void> {
        const queue = (await storage.get<PendingPersonaItem[]>(
            STORAGE_KEYS.PENDING_PERSONAS,
        )) || [];
        // Avoid duplicate entries for same scenarioId
        const exists = queue.some((q) => q.scenarioId === item.scenarioId);
        const updated = exists
            ? queue.map((q) => (q.scenarioId === item.scenarioId ? item : q))
            : [...queue, item];
        await storage.set(STORAGE_KEYS.PENDING_PERSONAS, updated);
    }

    async processQueue(): Promise<void> {
        if (this.processing) return;
        this.processing = true;
        try {
            const queue = (await storage.get<PendingPersonaItem[]>(
                STORAGE_KEYS.PENDING_PERSONAS,
            )) || [];
            if (queue.length === 0) return;

            for (const item of queue) {
                await this.processItem(item);
            }
        } finally {
            this.processing = false;
        }
    }

    private async processItem(item: PendingPersonaItem): Promise<void> {
        try {
            const scenario = await scenarioService.getScenarioById(item.scenarioId);
            if (!scenario) {
                await this.removeFromQueue(item.scenarioId);
                return;
            }

            // If persona already has an ID or is ready/error, skip
            const currentStatus = scenario.persona?.status;
            if (scenario.persona?.personaId || currentStatus === "ready" || currentStatus === "error") {
                await this.removeFromQueue(item.scenarioId);
                return;
            }

            // Create persona via backend proxy
            const response = await tavusService.createPersona(item.personaInput);

            // Update scenario with personaId and initial status
            const updatedPersona: PersonaConfig = {
                ...scenario.persona,
                personaId: response.persona_id,
                personaName: response.persona_name,
                status: response.status || "processing",
                lastStatusAt: new Date(),
                isSyncedRemote: true,
                syncError: null,
            };

            await scenarioService.updateScenario({
                id: scenario.id,
                persona: updatedPersona,
            });

            // Poll until ready or error
            const finalStatus = await tavusService.pollPersonaStatus(response.persona_id);

            await scenarioService.updateScenario({
                id: scenario.id,
                persona: {
                    ...updatedPersona,
                    status: finalStatus.status,
                    lastStatusAt: finalStatus.lastStatusAt,
                    syncError: finalStatus.syncError || null,
                    isSyncedRemote: true,
                },
            });

            // Remove from queue once done
            await this.removeFromQueue(item.scenarioId);
        } catch (error) {
            console.error("PersonaSyncService.processItem error:", error);
            // Increment attempts and retain in queue for retry
            const queue = (await storage.get<PendingPersonaItem[]>(
                STORAGE_KEYS.PENDING_PERSONAS,
            )) || [];
            const updatedQueue = queue.map((q) =>
                q.scenarioId === item.scenarioId
                    ? { ...q, attempts: (q.attempts || 0) + 1 }
                    : q,
            );
            await storage.set(STORAGE_KEYS.PENDING_PERSONAS, updatedQueue);

            // If too many attempts, mark scenario as error and remove from queue
            if ((item.attempts || 0) + 1 >= 5) {
                const scenario = await scenarioService.getScenarioById(item.scenarioId);
                if (scenario) {
                    await scenarioService.updateScenario({
                        id: scenario.id,
                        persona: {
                            ...scenario.persona,
                            status: "error",
                            lastStatusAt: new Date(),
                            syncError: (error as Error).message,
                            isSyncedRemote: false,
                        },
                    });
                }
                await this.removeFromQueue(item.scenarioId);
            }
        }
    }

    private async removeFromQueue(scenarioId: string): Promise<void> {
        const queue = (await storage.get<PendingPersonaItem[]>(
            STORAGE_KEYS.PENDING_PERSONAS,
        )) || [];
        const updated = queue.filter((q) => q.scenarioId !== scenarioId);
        await storage.set(STORAGE_KEYS.PENDING_PERSONAS, updated);
    }
}

export const personaSyncService = new PersonaSyncService();
