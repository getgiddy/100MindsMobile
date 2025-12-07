import type { Database } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import type {
	FeedbackListItem,
	FeedbackSession,
	UserProgress,
} from "@/types/feedback";
import { storage, STORAGE_KEYS } from "@/utils/storage";
import { scenarioService } from "./scenarioService";

/**
 * Feedback Service
 * Manages feedback sessions and user progress tracking with Supabase backend
 */

type DbFeedbackSession =
	Database["public"]["Tables"]["feedback_sessions"]["Row"];
type DbFeedbackSessionInsert =
	Database["public"]["Tables"]["feedback_sessions"]["Insert"];

// Mock initial feedback data
const INITIAL_FEEDBACK: FeedbackSession[] = [
	{
		id: "1",
		scenarioId: "1",
		score: 85,
		completedAt: new Date("2025-11-11"),
		duration: 780, // 13 minutes in seconds
		analysis: {
			strengths: [
				"Clear communication",
				"Active listening demonstrated",
				"Empathetic approach",
			],
			areasForImprovement: [
				"Could set more specific expectations",
				"Follow-up action items needed",
			],
			keyInsights: [
				"Balanced firmness with empathy effectively",
				"Good use of open-ended questions",
			],
			communicationScore: 88,
			empathyScore: 92,
			problemSolvingScore: 78,
			overallScore: 85,
		},
	},
	{
		id: "2",
		scenarioId: "3",
		score: 62,
		completedAt: new Date("2025-11-10"),
		duration: 540, // 9 minutes
		analysis: {
			strengths: ["Remained neutral", "Listened to both sides"],
			areasForImprovement: [
				"Could be more decisive",
				"Need clearer resolution path",
				"More probing questions needed",
			],
			keyInsights: [
				"Good at gathering information",
				"Hesitant to make final decision",
			],
			communicationScore: 70,
			empathyScore: 65,
			problemSolvingScore: 52,
			overallScore: 62,
		},
	},
];

class FeedbackService {
	/**
	 * Map database row to app FeedbackSession type
	 */
	private mapDbToFeedbackSession(
		dbSession: DbFeedbackSession,
	): FeedbackSession {
		return {
			id: dbSession.id,
			scenarioId: dbSession.scenario_id,
			userId: dbSession.user_id,
			score: dbSession.score,
			completedAt: new Date(dbSession.completed_at),
			duration: dbSession.duration,
			transcript: dbSession.transcript as any,
			analysis: dbSession.analysis as any,
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
	 * Initialize storage with sample feedback (offline fallback)
	 */
	async initialize(): Promise<void> {
		const existing = await storage.get<FeedbackSession[]>(
			STORAGE_KEYS.FEEDBACK_SESSIONS,
		);
		if (!existing || existing.length === 0) {
			await storage.set(STORAGE_KEYS.FEEDBACK_SESSIONS, INITIAL_FEEDBACK);
		}
	}

	/**
	 * Get all feedback sessions
	 */
	async getFeedbackSessions(): Promise<FeedbackSession[]> {
		const userId = await this.getCurrentUserId();

		// Try Supabase first if user is logged in
		if (userId) {
			try {
				const { data, error } = await supabase
					.from("feedback_sessions")
					.select("*")
					.eq("user_id", userId)
					.order("completed_at", { ascending: false });

				if (error) throw error;
				return (data || []).map(this.mapDbToFeedbackSession);
			} catch (error) {
				console.warn(
					"Supabase query failed, falling back to local storage:",
					error,
				);
			}
		}

		// Fallback to local storage
		await this.initialize();
		const sessions = await storage.get<FeedbackSession[]>(
			STORAGE_KEYS.FEEDBACK_SESSIONS,
		);
		return sessions || [];
	}

	/**
	 * Get feedback session by ID
	 */
	async getFeedbackById(id: string): Promise<FeedbackSession | null> {
		const userId = await this.getCurrentUserId();

		// Try Supabase first if user is logged in
		if (userId) {
			try {
				const { data, error } = await supabase
					.from("feedback_sessions")
					.select("*")
					.eq("id", id)
					.eq("user_id", userId)
					.single();

				if (error) throw error;
				if (data) return this.mapDbToFeedbackSession(data);
			} catch (error) {
				console.warn(
					"Supabase query failed, falling back to local storage:",
					error,
				);
			}
		}

		// Fallback to local storage
		const sessions = await this.getFeedbackSessions();
		return sessions.find((s) => s.id === id) || null;
	}

	/**
	 * Get feedback session by conversation ID
	 */
	async getFeedbackByConversationId(
		conversationId: string,
	): Promise<FeedbackSession | null> {
		const userId = await this.getCurrentUserId();

		// Try Supabase first if user is logged in
		if (userId) {
			try {
				// Join with conversations table to find by conversation_id
				const { data: conversation, error: convError } = await supabase
					.from("conversations")
					.select("id")
					.eq("conversation_id", conversationId)
					.eq("user_id", userId)
					.single();

				if (convError) throw convError;

				if (conversation) {
					const { data, error } = await supabase
						.from("feedback_sessions")
						.select("*")
						.eq("conversation_id", conversation.id)
						.eq("user_id", userId)
						.single();

					if (error) throw error;
					if (data) return this.mapDbToFeedbackSession(data);
				}
			} catch (error) {
				console.warn(
					"Supabase query failed for conversation feedback:",
					error,
				);
			}
		}

		return null;
	}

	/**
	 * Get feedback list items (simplified view for list display)
	 */
	async getFeedbackListItems(): Promise<FeedbackListItem[]> {
		const sessions = await this.getFeedbackSessions();
		const scenarios = await scenarioService.getScenarios();

		return sessions.map((session) => {
			const scenario = scenarios.find((s) => s.id === session.scenarioId);
			const date = new Date(session.completedAt);

			return {
				id: session.id,
				scenarioTitle: scenario?.title || "Unknown Scenario",
				category: scenario?.category || "Unknown",
				score: session.score,
				dateLabel: this.formatDate(date),
				completedAt: date,
			};
		});
	}

	/**
	 * Save new feedback session
	 */
	async saveFeedbackSession(
		session: Omit<FeedbackSession, "id">,
	): Promise<FeedbackSession> {
		const userId = await this.getCurrentUserId();

		// Try Supabase first if user is logged in
		if (userId) {
			try {
				const dbSession: DbFeedbackSessionInsert = {
					user_id: userId,
					scenario_id: session.scenarioId,
					score: session.score,
					completed_at: session.completedAt.toISOString(),
					duration: session.duration,
					transcript: session.transcript
						? JSON.parse(JSON.stringify(session.transcript))
						: null,
					analysis: session.analysis
						? JSON.parse(JSON.stringify(session.analysis))
						: null,
				};

				const { data, error } = await supabase
					.from("feedback_sessions")
					.insert(dbSession)
					.select()
					.single();

				if (error) throw error;
				if (data) return this.mapDbToFeedbackSession(data);
			} catch (error) {
				console.error(
					"Supabase insert failed, falling back to local storage:",
					error,
				);
			}
		}

		// Fallback to local storage
		const sessions = await this.getFeedbackSessions();

		const newSession: FeedbackSession = {
			id: Date.now().toString(),
			...session,
		};

		const updated = [...sessions, newSession];
		await storage.set(STORAGE_KEYS.FEEDBACK_SESSIONS, updated);

		return newSession;
	}

	/**
	 * Get user progress/statistics
	 */
	async getUserProgress(): Promise<UserProgress> {
		const sessions = await this.getFeedbackSessions();
		const scenarios = await scenarioService.getScenarios();

		if (sessions.length === 0) {
			return {
				totalSessionsCompleted: 0,
				averageScore: 0,
				categoryBreakdown: [],
				improvementTrend: 0,
			};
		}

		// Calculate average score
		const averageScore = sessions.reduce((sum, s) => sum + s.score, 0) /
			sessions.length;

		// Calculate category breakdown
		const categoryMap = new Map<
			string,
			{ scores: number[]; count: number }
		>();

		for (const session of sessions) {
			const scenario = scenarios.find((s) => s.id === session.scenarioId);
			if (scenario) {
				const category = scenario.category;
				const existing = categoryMap.get(category) ||
					{ scores: [], count: 0 };
				existing.scores.push(session.score);
				existing.count++;
				categoryMap.set(category, existing);
			}
		}

		const categoryBreakdown = Array.from(categoryMap.entries()).map(
			([category, data]) => ({
				category,
				sessionsCompleted: data.count,
				averageScore: data.scores.reduce((a, b) => a + b, 0) /
					data.count,
			}),
		);

		// Calculate improvement trend (compare last 3 vs previous 3 sessions)
		let improvementTrend = 0;
		if (sessions.length >= 6) {
			const sortedSessions = [...sessions].sort(
				(a, b) =>
					new Date(b.completedAt).getTime() -
					new Date(a.completedAt).getTime(),
			);
			const recent = sortedSessions.slice(0, 3);
			const previous = sortedSessions.slice(3, 6);
			const recentAvg = recent.reduce((sum, s) => sum + s.score, 0) / 3;
			const previousAvg = previous.reduce((sum, s) => sum + s.score, 0) /
				3;
			improvementTrend = ((recentAvg - previousAvg) / previousAvg) * 100;
		}

		const lastSessionDate = sessions.length > 0
			? new Date(
				Math.max(
					...sessions.map((s) => new Date(s.completedAt).getTime()),
				),
			)
			: undefined;

		return {
			totalSessionsCompleted: sessions.length,
			averageScore: Math.round(averageScore),
			categoryBreakdown,
			improvementTrend: Math.round(improvementTrend),
			lastSessionDate,
		};
	}

	/**
	 * Format date for display
	 */
	private formatDate(date: Date): string {
		const month = date.toLocaleString("en-US", { month: "short" });
		const day = date.getDate();
		const suffix = this.getDaySuffix(day);
		const year = date.getFullYear();
		return `${month}. ${day}${suffix}, ${year}`;
	}

	private getDaySuffix(day: number): string {
		if (day > 3 && day < 21) return "th";
		switch (day % 10) {
			case 1:
				return "st";
			case 2:
				return "nd";
			case 3:
				return "rd";
			default:
				return "th";
		}
	}
}

// Export singleton instance
export const feedbackService = new FeedbackService();
