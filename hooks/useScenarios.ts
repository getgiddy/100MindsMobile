import { scenarioService } from "@/services/scenarioService";
import type {
    CreateScenarioInput,
    ScenarioFilter,
    UpdateScenarioInput,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Query keys for scenario-related queries
 */
export const scenarioKeys = {
    all: ["scenarios"] as const,
    lists: () => [...scenarioKeys.all, "list"] as const,
    list: (filter?: ScenarioFilter) =>
        [...scenarioKeys.lists(), filter] as const,
    details: () => [...scenarioKeys.all, "detail"] as const,
    detail: (id: string) => [...scenarioKeys.details(), id] as const,
    categories: () => [...scenarioKeys.all, "categories"] as const,
};

/**
 * Hook to fetch all scenarios with optional filtering
 */
export function useScenarios(filter?: ScenarioFilter) {
    return useQuery({
        queryKey: scenarioKeys.list(filter),
        queryFn: () => scenarioService.getScenarios(filter),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to fetch a single scenario by ID
 */
export function useScenario(id: string) {
    return useQuery({
        queryKey: scenarioKeys.detail(id),
        queryFn: () => scenarioService.getScenarioById(id),
        enabled: !!id,
    });
}

/**
 * Hook to fetch scenario categories with counts
 */
export function useScenarioCategories() {
    return useQuery({
        queryKey: scenarioKeys.categories(),
        queryFn: () => scenarioService.getCategories(),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Hook to create a new scenario
 */
export function useCreateScenario() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateScenarioInput) =>
            scenarioService.createScenario(input),
        onSuccess: () => {
            // Invalidate all scenario queries to refetch
            queryClient.invalidateQueries({ queryKey: scenarioKeys.all });
        },
    });
}

/**
 * Hook to update an existing scenario
 */
export function useUpdateScenario() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: UpdateScenarioInput) =>
            scenarioService.updateScenario(input),
        onSuccess: (data) => {
            if (data) {
                // Update the cache for this specific scenario
                queryClient.setQueryData(scenarioKeys.detail(data.id), data);
                // Invalidate lists to refetch
                queryClient.invalidateQueries({ queryKey: scenarioKeys.lists() });
            }
        },
    });
}

/**
 * Hook to delete a scenario
 */
export function useDeleteScenario() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => scenarioService.deleteScenario(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: scenarioKeys.all });
        },
    });
}
