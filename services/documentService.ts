import type { Document, DocumentFilter } from "@/types";
import { storage, STORAGE_KEYS } from "@/utils/storage";

/**
 * Document Service
 * Manages pre-indexed documents for Tavus persona knowledge
 * These are documents that can be attached to personas during creation
 */

// Mock pre-indexed documents (in production, these would come from backend)
const INITIAL_DOCUMENTS: Document[] = [
    {
        id: "doc-1",
        name: "Leadership Best Practices",
        description: "Comprehensive guide to effective leadership strategies",
        tags: ["leadership", "management", "best-practices"],
        type: "pdf",
        size: 2457600, // 2.4 MB
        createdAt: new Date("2025-10-15"),
        updatedAt: new Date("2025-11-20"),
        url: "https://example.com/docs/leadership-guide.pdf",
    },
    {
        id: "doc-2",
        name: "Conflict Resolution Handbook",
        description: "Strategies for resolving workplace conflicts",
        tags: ["conflict-resolution", "communication", "team-management"],
        type: "pdf",
        size: 1843200, // 1.8 MB
        createdAt: new Date("2025-09-10"),
        updatedAt: new Date("2025-10-05"),
        url: "https://example.com/docs/conflict-resolution.pdf",
    },
    {
        id: "doc-3",
        name: "Performance Review Guidelines",
        description: "Framework for conducting effective performance reviews",
        tags: ["performance", "feedback", "hr"],
        type: "docx",
        size: 524288, // 512 KB
        createdAt: new Date("2025-08-20"),
        updatedAt: new Date("2025-11-15"),
    },
    {
        id: "doc-4",
        name: "Communication Skills Training",
        description: "Essential communication techniques for leaders",
        tags: ["communication", "leadership", "training"],
        type: "markdown",
        size: 153600, // 150 KB
        createdAt: new Date("2025-11-01"),
        updatedAt: new Date("2025-11-25"),
    },
    {
        id: "doc-5",
        name: "Team Building Activities",
        description: "Collection of team building exercises and activities",
        tags: ["team-management", "engagement", "culture"],
        type: "text",
        size: 102400, // 100 KB
        createdAt: new Date("2025-10-01"),
        updatedAt: new Date("2025-11-10"),
    },
    {
        id: "doc-6",
        name: "Recruitment Best Practices",
        description: "Guide to effective hiring and onboarding",
        tags: ["recruitment", "hr", "onboarding"],
        type: "pdf",
        size: 3145728, // 3 MB
        createdAt: new Date("2025-09-15"),
        updatedAt: new Date("2025-10-30"),
    },
    {
        id: "doc-7",
        name: "Decision Making Framework",
        description: "Systematic approach to making business decisions",
        tags: ["decision-making", "strategy", "leadership"],
        type: "pdf",
        size: 1048576, // 1 MB
        createdAt: new Date("2025-10-20"),
        updatedAt: new Date("2025-11-12"),
    },
    {
        id: "doc-8",
        name: "Company Policies Manual",
        description: "Complete organizational policies and procedures",
        tags: ["policies", "compliance", "hr"],
        type: "pdf",
        size: 5242880, // 5 MB
        createdAt: new Date("2025-07-01"),
        updatedAt: new Date("2025-11-01"),
    },
    {
        id: "doc-9",
        name: "Emotional Intelligence Guide",
        description: "Understanding and developing emotional intelligence",
        tags: ["leadership", "self-development", "communication"],
        type: "markdown",
        size: 204800, // 200 KB
        createdAt: new Date("2025-10-10"),
        updatedAt: new Date("2025-11-18"),
    },
    {
        id: "doc-10",
        name: "Project Management Essentials",
        description: "Core principles of effective project management",
        tags: ["project-management", "leadership", "planning"],
        type: "pdf",
        size: 2097152, // 2 MB
        createdAt: new Date("2025-09-25"),
        updatedAt: new Date("2025-11-05"),
    },
];

class DocumentService {
    /**
     * Initialize storage with default documents if empty
     */
    async initialize(): Promise<void> {
        const existing = await storage.get<Document[]>(STORAGE_KEYS.DOCUMENTS);
        if (!existing || existing.length === 0) {
            await storage.set(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
        }
    }

    /**
     * Get all documents with optional filtering
     */
    async getDocuments(filter?: DocumentFilter): Promise<Document[]> {
        await this.initialize();
        let documents = await storage.get<Document[]>(STORAGE_KEYS.DOCUMENTS);

        if (!documents) {
            return [];
        }

        // Apply filters
        if (filter) {
            if (filter.tags && filter.tags.length > 0) {
                documents = documents.filter((doc) =>
                    filter.tags!.some((tag) => doc.tags.includes(tag)),
                );
            }
            if (filter.type) {
                documents = documents.filter((doc) => doc.type === filter.type);
            }
            if (filter.searchQuery) {
                const query = filter.searchQuery.toLowerCase();
                documents = documents.filter(
                    (doc) =>
                        doc.name.toLowerCase().includes(query) ||
                        doc.description?.toLowerCase().includes(query) ||
                        doc.tags.some((tag) => tag.toLowerCase().includes(query)),
                );
            }
        }

        return documents;
    }

    /**
     * Get document by ID
     */
    async getDocumentById(id: string): Promise<Document | null> {
        const documents = await this.getDocuments();
        return documents.find((d) => d.id === id) || null;
    }

    /**
     * Get documents by IDs
     */
    async getDocumentsByIds(ids: string[]): Promise<Document[]> {
        const documents = await this.getDocuments();
        return documents.filter((d) => ids.includes(d.id));
    }

    /**
     * Get all unique tags with counts
     */
    async getTags(): Promise<{ name: string; count: number }[]> {
        const documents = await this.getDocuments();
        const tagMap = new Map<string, number>();

        for (const doc of documents) {
            for (const tag of doc.tags) {
                tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
            }
        }

        return Array.from(tagMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count); // Sort by count descending
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes?: number): string {
        if (!bytes) return "Unknown size";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
}

// Export singleton instance
export const documentService = new DocumentService();
