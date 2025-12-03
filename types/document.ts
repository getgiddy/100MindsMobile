/**
 * Document types for Tavus knowledge integration
 * Represents pre-indexed documents that can be attached to personas
 */

export interface Document {
    id: string;
    name: string;
    description?: string;
    tags: string[];
    type: DocumentType;
    size?: number; // in bytes
    createdAt: Date;
    updatedAt: Date;
    url?: string; // Optional URL for preview/download
}

export type DocumentType =
    | "pdf"
    | "text"
    | "markdown"
    | "docx"
    | "spreadsheet"
    | "other";

export interface DocumentFilter {
    tags?: string[];
    type?: DocumentType;
    searchQuery?: string;
}

export interface DocumentTag {
    name: string;
    count: number;
    color?: string;
}
