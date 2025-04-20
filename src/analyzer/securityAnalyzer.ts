import { ASTNode } from "../parser/solidity";
import { Issue, AnalysisOptions, AnalysisStats } from "../types/common";
import { securityRules } from "../rules/securityRules";

// Define SecurityAnalysisResult interface explicitly in this file and export it
export interface SecurityAnalysisResult {
  file: string;
  issues: Issue[];
  stats: AnalysisStats;
}

export class SecurityAnalyzer {
  private ast: ASTNode;
  private sourceCode: string;
  private filePath: string;
  private options?: AnalysisOptions;

  constructor(
    ast: ASTNode,
    sourceCode: string,
    filePath: string,
    options?: AnalysisOptions
  ) {
    this.ast = ast;
    this.sourceCode = sourceCode;
    this.filePath = filePath;
    this.options = options;
  }

  public analyze(): SecurityAnalysisResult {
    console.log("Running security analysis...");

    let issues: Issue[] = [];

    // Apply all security rules
    for (const rule of securityRules) {
      try {
        if (this.options?.verbose) {
          console.log(`Applying security rule: ${rule.id} - ${rule.name}`);
        }
        const ruleIssues = rule.detect(
          this.ast,
          this.sourceCode,
          this.filePath
        );
        if (ruleIssues.length > 0 && this.options?.verbose) {
          console.log(`Rule ${rule.id} found ${ruleIssues.length} issues`);
        }
        issues = [...issues, ...ruleIssues];
      } catch (error) {
        console.error(`Error applying security rule ${rule.id}: ${error}`);
        if (this.options?.verbose) {
          console.error((error as Error).stack);
        }
      }
    }

    if (this.options?.verbose) {
      console.log(`Security analysis complete. Found ${issues.length} issues.`);
    }

    return {
      file: this.filePath,
      issues,
      stats: this.calculateStats(issues),
    };
  }

  private calculateStats(issues: Issue[]): AnalysisStats {
    const issuesBySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    issues.forEach((issue) => {
      const severityKey = issue.severity as keyof typeof issuesBySeverity;
      if (severityKey in issuesBySeverity) {
        issuesBySeverity[severityKey]++;
      }
    });

    return {
      issuesBySeverity,
      totalIssues: issues.length,
    };
  }
}

/**
 * Analyzes a Solidity AST for security vulnerabilities
 */
export function analyzeSecurity(
  ast: ASTNode,
  sourceCode: string,
  filePath: string,
  options?: AnalysisOptions
): SecurityAnalysisResult {
  const analyzer = new SecurityAnalyzer(ast, sourceCode, filePath, options);
  return analyzer.analyze();
}
