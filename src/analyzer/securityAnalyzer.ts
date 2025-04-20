import { ASTNode } from "../parser/solidity";
import { RuleEngine, AnalysisOptions } from "./ruleEngine";
import { Issue } from "../types";

export interface SecurityAnalysisResult {
  file: string;
  issues: Issue[];
  stats: {
    issuesBySeverity: {
      high: number;
      medium: number;
      low: number;
      info: number;
    };
    totalIssues: number;
  };
}

export class SecurityAnalyzer {
  private engine: RuleEngine;
  constructor() {
    this.engine = new RuleEngine();
  }

  public analyze(
    ast: ASTNode,
    sourceCode: string,
    filePath: string,
    options: AnalysisOptions = {}
  ): SecurityAnalysisResult {
    const issues = this.engine.analyze(ast, sourceCode, filePath, options);
    return { file: filePath, issues, stats: this.calculateStats(issues) };
  }

  private calculateStats(issues: Issue[]): SecurityAnalysisResult["stats"] {
    const issuesBySeverity = { high: 0, medium: 0, low: 0, info: 0 };
    issues.forEach((issue) => {
      issuesBySeverity[issue.severity]++;
    });
    return { issuesBySeverity, totalIssues: issues.length };
  }
}

/**
 * Analyzes a Solidity AST for security vulnerabilities
 * @param ast The AST to analyze
 * @param filePath Path to the source file
 * @param options Analysis options
 */
export function analyzeSecurity(
  ast: ASTNode,
  filePath: string,
  options: AnalysisOptions = {}
): SecurityAnalysisResult {
  const analyzer = new SecurityAnalyzer();
  // Get source code from AST or load from file if needed
  const sourceCode = "";
  return analyzer.analyze(ast, sourceCode, filePath, options);
}
