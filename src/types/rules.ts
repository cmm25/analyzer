// src/types/rules.ts
import { ASTNode } from "../parser/solidity";
import { ASTNodeWithLocation } from "../utils/astUtils";
export type Severity = "high" | "medium" | "low" | "info";

// Export the Issue interface
export interface Issue {
    id: string;
    title?: string;
    description: string;
    message?: string;
    line?: number | null;
    column?: number | null;
    severity: 'high' | 'medium' | 'low' | 'info';
    canAutoFix?: boolean;
    suggestions?: string[];
    location?: {
        line: number | null;
        file: string;
    };
    code?: string;
}

export interface SecurityRule {
    id: string;
    name: string;
    description: string;
    severity: Severity;
    category: string;

    /**
     * Check if the given AST node violates this rule
     * @param node The AST node to check
     * @param sourceCode Original source code (for getting text representations)
     * @param filePath Path to the file being analyzed
     * @returns Array of issues found, or empty array if no issues
     */
    detect(node: ASTNode, sourceCode: string, filePath: string): Issue[];
}

/**
 * Security rule specifically for reentrancy detection
 */
export interface ReentrancyRule extends SecurityRule {
    checkReentrancyPattern(
        externalCalls: ASTNodeWithLocation[],
        stateChanges: ASTNodeWithLocation[],
        functionNode: ASTNode,
        sourceCode: string,
        filePath: string
    ): Issue[];
}