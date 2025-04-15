import { ASTNode } from "../parser/solidity";
import { analyzeSecurity, SecurityAnalysisResult } from "./securityAnalyzer";
import { analyzeGas, GasAnalysisResult } from "./gasOptimizer";
import { RuleEngine, AnalysisOptions } from "./ruleEngine";

export interface AnalysisResult {
  file: string;
  securityIssues: import("../types").Issue[];
  gasIssues: import("../types").Issue[];
  stats: {
    securityIssueCount: number;
    gasIssueCount: number;
    totalIssueCount: number;
    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;
    infoCount: number;
  };
}

export function analyzeSolidity(
  ast: ASTNode,
  sourceCode: string,
  filePath: string
): AnalysisResult {
  const securityResult: SecurityAnalysisResult = analyzeSecurity(
    ast,
    sourceCode,
    filePath
  );
  const gasResult: GasAnalysisResult = analyzeGas(ast, sourceCode, filePath);
  const securityIssues = securityResult.issues;
  const gasIssues = gasResult.issues;
  const stats = {
    securityIssueCount: securityIssues.length,
    gasIssueCount: gasIssues.length,
    totalIssueCount: securityIssues.length + gasIssues.length,
    highSeverityCount:
      countBySeverity(securityIssues, "high") +
      countBySeverity(gasIssues, "high"),
    mediumSeverityCount:
      countBySeverity(securityIssues, "medium") +
      countBySeverity(gasIssues, "medium"),
    lowSeverityCount:
      countBySeverity(securityIssues, "low") +
      countBySeverity(gasIssues, "low"),
    infoCount:
      countBySeverity(securityIssues, "info") +
      countBySeverity(gasIssues, "info"),
  };
  return { file: filePath, securityIssues, gasIssues, stats };
}

function countBySeverity(
  issues: import("../types").Issue[],
  severity: "high" | "medium" | "low" | "info"
): number {
  return issues.filter((issue) => issue.severity === severity).length;
}

export { analyzeSolidity as analyze };
export { AnalysisOptions };
export { AnalysisResult };

export { analyzeSecurity, SecurityAnalysisResult } from "./securityAnalyzer";
export { analyzeGas, GasAnalysisResult } from "./gasOptimizer";
export { RuleEngine } from "./ruleEngine";
