import { ASTNode } from "../parser/solidity";
import { ASTNodeWithLocation } from "../utils/astUtils";
import { Severity, Issue } from "./common";
export { Issue };

export interface Rule {
    id: string;
    name: string;
    description: string;
    severity: Severity;
    category: string;
}

/**
 * Security rule interface
 */
export interface SecurityRule extends Rule {
    /**
     * Check if the given AST node violates this rule
     * @param node The AST node to check
     * @param sourceCode Original source code (for getting text representations)
     * @param filePath Path to the file being analyzed
     * @returns Array of issues found, or empty array if no issues
     */
    detect(node: ASTNode, sourceCode: string, filePath: string): Issue[];
}
export interface ReentrancyRule extends SecurityRule {
    checkReentrancyPattern(
        externalCalls: ASTNodeWithLocation[],
        stateChanges: ASTNodeWithLocation[],
        functionNode: ASTNode,
        sourceCode: string,
        filePath: string
    ): Issue[];
}
