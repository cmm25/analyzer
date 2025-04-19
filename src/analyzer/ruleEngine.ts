import { ASTNode } from "../parser/solidity";
import { findNodes } from "../utils/astUtils";
import { SecurityRule, Issue } from "../types/rules";
import { securityRules } from "../rules/securityRules";

export interface AnalysisOptions {
    includeRules?: string[];
    excludeRules?: string[];
    minSeverity?: "high" | "medium" | "low" | "info";
    security?: boolean;
    gas?: boolean;
    practices?: boolean;
}

/**
 * Engine that applies security rules to Solidity AST
 */
export class RuleEngine {
    private rules: SecurityRule[];

    constructor(customRules?: SecurityRule[]) {
        this.rules = customRules || securityRules;
    }
    public addRule(rule: SecurityRule): void {
        this.rules.push(rule);
    }
    public analyze(
        ast: ASTNode,
        sourceCode: string,
        filePath: string,
        options: AnalysisOptions = {}
    ): Issue[] {
        const issues: Issue[] = [];
        const filteredRules = this.filterRulesByOptions(this.rules, options);

        // Apply each rule to the entire AST
        for (const rule of filteredRules) {
            const astIssues = this.applyRuleToAST(rule, ast, sourceCode, filePath);
            issues.push(...astIssues);
            const nodes = findNodes(ast, "*");
            for (const node of nodes) {
                const nodeIssues = rule.detect(node, sourceCode, filePath);
                issues.push(...nodeIssues);
            }
        }
        return this.filterIssuesBySeverity(issues, options.minSeverity);
    }
    // Apply a rule to the entire AST
    private applyRuleToAST(rule: SecurityRule,ast: ASTNode,sourceCode: string,filePath: string): Issue[] {
        if (rule.id === "SEC-001") {
            return []; 
        }
        return [];
    }
    private filterRulesByOptions(
        rules: SecurityRule[],
        options: AnalysisOptions
    ): SecurityRule[] {
        let result = [...rules];

        if (options.includeRules && options.includeRules.length > 0) {
            result = result.filter((rule) => options.includeRules!.includes(rule.id));
        }

        if (options.excludeRules && options.excludeRules.length > 0) {
            result = result.filter(
                (rule) => !options.excludeRules!.includes(rule.id)
            );
        }

        return result;
    }
    private filterIssuesBySeverity( issues: Issue[], minSeverity?: "high" | "medium" | "low" | "info" ): Issue[] {
        if (!minSeverity) {
            return issues;
        }

        const severityLevels = {
            high: 3,
            medium: 2,
            low: 1,
            info: 0,
        };

        const minLevel = severityLevels[minSeverity];
        return issues.filter((issue) => {
            const issueLevel = severityLevels[issue.severity];
            return issueLevel >= minLevel;
        });
    }
}
