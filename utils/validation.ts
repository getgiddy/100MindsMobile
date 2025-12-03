import type { CreateScenarioInput, PersonaInput } from "@/types";

/**
 * Validation utilities for scenario and persona creation
 */

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

/**
 * Validate scenario creation input
 */
export function validateScenarioInput(
    input: Partial<CreateScenarioInput>,
): ValidationResult {
    const errors: ValidationError[] = [];

    // Title validation
    if (!input.title?.trim()) {
        errors.push({ field: "title", message: "Title is required" });
    } else if (input.title.length > 100) {
        errors.push({ field: "title", message: "Title must be 100 characters or less" });
    }

    // Description validation
    if (!input.description?.trim()) {
        errors.push({ field: "description", message: "Description is required" });
    } else if (input.description.length > 500) {
        errors.push({
            field: "description",
            message: "Description must be 500 characters or less",
        });
    }

    // Category validation
    if (!input.category) {
        errors.push({ field: "category", message: "Category is required" });
    }

    // Duration validation
    if (!input.duration || input.duration <= 0) {
        errors.push({ field: "duration", message: "Duration must be greater than 0" });
    } else if (input.duration > 120) {
        errors.push({
            field: "duration",
            message: "Duration must be 120 minutes or less",
        });
    }

    // Tags validation
    if (input.tags && input.tags.length > 10) {
        errors.push({ field: "tags", message: "Maximum 10 tags allowed" });
    }

    // Persona validation (if provided)
    if (input.persona) {
        const personaErrors = validatePersonaInput(input.persona);
        errors.push(...personaErrors.errors);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validate persona creation input
 */
export function validatePersonaInput(input: PersonaInput): ValidationResult {
    const errors: ValidationError[] = [];

    // Pipeline mode validation
    if (input.pipelineMode === "full" && !input.systemPrompt?.trim()) {
        errors.push({
            field: "systemPrompt",
            message: 'System prompt is required for pipeline mode "full"',
        });
    }

    // System prompt length validation
    if (input.systemPrompt && input.systemPrompt.length > 5000) {
        errors.push({
            field: "systemPrompt",
            message: "System prompt must be 5000 characters or less",
        });
    }

    // Context length validation
    if (input.context && input.context.length > 10000) {
        errors.push({
            field: "context",
            message: "Context must be 10000 characters or less",
        });
    }

    // Document limits
    if (input.layers?.document_ids && input.layers.document_ids.length > 50) {
        errors.push({
            field: "document_ids",
            message: "Maximum 50 documents allowed",
        });
    }

    if (input.layers?.document_tags && input.layers.document_tags.length > 20) {
        errors.push({
            field: "document_tags",
            message: "Maximum 20 document tags allowed",
        });
    }

    // LLM tools validation
    if (input.layers?.llm?.tools && input.layers.llm.tools.length > 20) {
        errors.push({
            field: "llm.tools",
            message: "Maximum 20 LLM tools allowed",
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Get first error message for a specific field
 */
export function getFieldError(
    errors: ValidationError[],
    field: string,
): string | null {
    const error = errors.find((e) => e.field === field);
    return error ? error.message : null;
}
