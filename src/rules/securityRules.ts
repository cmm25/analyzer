import { ASTNode } from "../parser/solidity";
import { ASTNodeWithLocation, getNodeLineNumber, getNodeText } from "../utils/astUtils";
import { findExternalCalls, findStateChanges } from "../utils/vulnerabilityUtils";
import { Issue, SecurityRule, ReentrancyRule, Severity } from "../types/rules";

/**
 * Rule that detects potential reentrancy vulnerabilities
 */
export const reentrancyRule: ReentrancyRule = {
    id: "SEC-001",
    name: "Reentrancy Vulnerability",
    description:
        "Detects functions that modify state after making external calls, which could lead to reentrancy attacks",
    severity: "high",
    category: "security",

    detect(node: ASTNode, sourceCode: string, filePath: string): Issue[] {
        // Only check function definitions
        if (node.type !== "FunctionDefinition") { return [] }
        const externalCalls = findExternalCalls(node);
        const stateChanges = findStateChanges(node);

        if (externalCalls.length === 0 || stateChanges.length === 0) {
            return [];
        }

        return this.checkReentrancyPattern(
            externalCalls,
            stateChanges,
            node,
            sourceCode,
            filePath
        );
    },

    checkReentrancyPattern(
        externalCalls: ASTNodeWithLocation[],
        stateChanges: ASTNodeWithLocation[],
        functionNode: ASTNode,
        sourceCode: string,
        filePath: string
    ): Issue[] {
        const nodesByPosition: ASTNodeWithLocation[] = [
            ...externalCalls,
            ...stateChanges,
        ]
            .filter((node) => node.loc && node.loc.start)
            .sort((a, b) => {
                const aLine = a.loc?.start.line || 0;
                const bLine = b.loc?.start.line || 0;

                if (aLine === bLine) {
                    return (a.loc?.start.column || 0) - (b.loc?.start.column || 0);
                }

                return aLine - bLine;
            });

        // Check if there are any state changes after external calls
        for (let i = 0; i < nodesByPosition.length - 1; i++) {
            const currentNode = nodesByPosition[i];
            if (externalCalls.includes(currentNode)) {
                for (let j = i + 1; j < nodesByPosition.length; j++) {
                    if (stateChanges.includes(nodesByPosition[j])) {
                        // Just use type assertions where needed:
                        return [
                            {
                                id: this.id,
                                description: "State variables are modified after an external call...",
                                severity: this.severity,
                                location: {
                                    line: getNodeLineNumber(functionNode as ASTNodeWithLocation) || 0, 
                                    file: filePath,
                                },
                                code: getNodeText(functionNode as ASTNodeWithLocation, sourceCode),
                                suggestions: [`Check the return value with 'require(succeeded, "Message")' or store it in a variable and verify it`],
                            },
                        ];
                    }
                }
            }
        }

        return [];
    },
};

export const uncheckedCallsRule: SecurityRule = {
    id: "SEC-002",
    name: "Unchecked External Call",
    description:
        "Detects external calls whose return values are not checked, which could lead to silent failures",
    severity: "medium",
    category: "security",

    detect(node: ASTNode, sourceCode: string, filePath: string): Issue[] {
        if (node.type !== "FunctionCall") {
            return [];
        }
        if (!node.expression || node.expression.type !== "MemberAccess") {
            return [];
        }

        const memberAccess = node.expression;
        if (!["call", "send"].includes(memberAccess.memberName)) {
            return [];
        }
        const parent = node.parent;
        if (
            parent &&
            ["IfStatement", "Assignment", "VariableDeclaration"].includes(parent.type)
        ) {
            return [];
        }

        return [
            {
                id: this.id,
                description: `Return value of '${memberAccess.memberName}' is not checked`,
                severity: this.severity,
                location: {
                    line: getNodeLineNumber(node as ASTNodeWithLocation),
                    file: filePath,
                },
                code: getNodeText(node as ASTNodeWithLocation, sourceCode),
                suggestions: [`Check the return value with 'require(succeeded, "Message")' or store it in a variable and verify it`],
            },
        ];
    },
};

/**
 * Rule that detects use of dangerous Solidity functions
 */
export const dangerousFunctionsRule: SecurityRule = {
    id: "SEC-003",
    name: "Dangerous Function Use",
    description:
        "Detects use of potentially dangerous functions like selfdestruct, delegatecall, or assembly",
    severity: "high",
    category: "security",

    detect(node: ASTNode, sourceCode: string, filePath: string): Issue[] {
        const issues: Issue[] = [];

        // Check for selfdestruct
        if (
            node.type === "FunctionCall" &&
            node.expression &&
            node.expression.type === "Identifier" &&
            node.expression.name === "selfdestruct"
        ) {
            issues.push({
                id: `${this.id}-SELFDESTRUCT`,
                description: "Use of selfdestruct can permanently destroy contracts",
                severity: this.severity,
                location: {
                    line: getNodeLineNumber(node as ASTNodeWithLocation),
                    file: filePath,
                },
                code: getNodeText(node as ASTNodeWithLocation, sourceCode),
                suggestions: ["Consider using a more controlled deactivation mechanism instead of selfdestruct"],
        });
        }

        // Check for delegatecall
        if (
            node.type === "FunctionCall" &&
            node.expression &&
            node.expression.type === "MemberAccess" &&
            node.expression.memberName === "delegatecall"
        ) {
            issues.push({
                id: `${this.id}-DELEGATECALL`,
                description:
                    "Use of delegatecall can lead to context manipulation vulnerabilities",
                severity: this.severity,
                location: {
                    line: getNodeLineNumber(node as ASTNodeWithLocation),
                    file: filePath,
                },
                code: getNodeText(node as ASTNodeWithLocation, sourceCode),
                suggestions: ["Ensure the target of delegatecall is trusted and can't be manipulated by attackers"],
            });
        }

        // Check for assembly
        if (node.type === "InlineAssemblyStatement") {
            issues.push({
                id: `${this.id}-ASSEMBLY`,
                description: "Use of inline assembly bypasses Solidity safety checks",
                severity: "medium",
                location: {
                    line: getNodeLineNumber(node as ASTNodeWithLocation),
                    file: filePath,
                },
                code: getNodeText(node as ASTNodeWithLocation, sourceCode),
                suggestions: ["Try to use high-level Solidity constructs instead of assembly when possible"],
            });
        }

        return issues;
    },
};

export const securityRules: SecurityRule[] = [
    reentrancyRule,
    uncheckedCallsRule,
    dangerousFunctionsRule,
];
