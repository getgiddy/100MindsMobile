import { feedbackService } from "@/services/feedbackService";
import type { FeedbackSession } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Query keys for feedback-related queries
 */
export const feedbackKeys = {
    all: ["feedback"] as const,
    sessions: () => [...feedbackKeys.all, "sessions"] as const,
    session: (id: string) => [...feedbackKeys.all, "session", id] as const,
    list: () => [...feedbackKeys.all, "list"] as const,
    progress: () => [...feedbackKeys.all, "progress"] as const,
};

/**
 * Hook to fetch all feedback sessions
 */
export function useFeedbackSessions() {
    return useQuery({
        queryKey: feedbackKeys.sessions(),
        queryFn: () => feedbackService.getFeedbackSessions(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook to fetch a single feedback session by ID
 */
export function useFeedbackSession(id: string) {
    return useQuery({
        queryKey: feedbackKeys.session(id),
        queryFn: () => feedbackService.getFeedbackById(id),
        enabled: !!id,
    });
}

/**
 * Hook to fetch feedback list items (for display in lists)
 */
export function useFeedbackList() {
    return useQuery({
        queryKey: feedbackKeys.list(),
        queryFn: () => feedbackService.getFeedbackListItems(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook to fetch user progress/statistics
 */
export function useUserProgress() {
    return useQuery({
        queryKey: feedbackKeys.progress(),
        queryFn: () => feedbackService.getUserProgress(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to save a new feedback session
 */
export function useSaveFeedback() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (session: Omit<FeedbackSession, "id">) =>
            feedbackService.saveFeedbackSession(session),
        onSuccess: () => {
            // Invalidate all feedback queries to refetch
            queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
        },
    });
}
