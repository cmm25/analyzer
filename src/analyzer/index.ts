import { ASTNode } from "../parser/solidity";
import { analyzeSecurity, SecurityAnalysisResult } from "./securityAnalyzer";
import { analyzeGas, GasAnalysisResult } from "./gasOptimizer";
import { analyzeBestPractices, BestPracticesResult } from "./bestpractices";
import { AnalysisOptions } from "./ruleEngine";
import { Issue } from "../types/issue";

export interface AnalysisResult {
  file: string;
  securityIssues: Issue[];
  practiceIssues: Issue[];
  gasIssues: Issue[];
  stats: {
    securityIssueCount: number;
    gasIssueCount: number;
    practiceIssueCount: number; 
    totalIssueCount: number;
    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;
    infoCount: number;
  };
}

/**
 * Analyzes a Solidity AST with various analyzers based on provided options
 * @param ast The Solidity AST to analyze
 * @param options Analysis options to determine which analyzers to run
 * @param filePath Path to the source file being analyzed
 * @returns A comprehensive analysis result
 */
export async function analyzeSolidity( ast: ASTNode, options: AnalysisOptions, filePath: string ): Promise<AnalysisResult> {
  // Initialize empty results with all required properties
  let securityResult: SecurityAnalysisResult = { 
    file: filePath, 
    issues: [],
    stats: {
      issuesBySeverity: { high: 0, medium: 0, low: 0, info: 0 },
      totalIssues: 0
    }
  };
  
  let gasResult: GasAnalysisResult = { 
    file: filePath, 
    issues: [],
    stats: {
      issuesBySeverity: { high: 0, medium: 0, low: 0, info: 0 },
      totalIssues: 0
    }
  };
  
  let practicesResult: BestPracticesResult = { 
    file: filePath,
    issues: [] 
  };
  
  
  const sourceCode = ""; // This should ideally be loaded or passed in

  if (options.security !== false) {
    securityResult = analyzeSecurity(ast, filePath, options);
  }
  
  if (options.gas !== false) {
    gasResult = analyzeGas(ast, filePath, options);
  }
  
  if (options.practices !== false) {
    practicesResult = analyzeBestPractices(ast, filePath, options);
  }
  
  const securityIssues = securityResult.issues;
  const gasIssues = gasResult.issues;
  const practiceIssues = practicesResult.issues;
  
  const stats = {
    securityIssueCount: securityIssues.length,
    gasIssueCount: gasIssues.length,
    practiceIssueCount: practiceIssues.length,
    totalIssueCount: securityIssues.length + gasIssues.length + practiceIssues.length,
    highSeverityCount:
      countBySeverity(securityIssues, "high") +
      countBySeverity(gasIssues, "high") +
      countBySeverity(practiceIssues, "high"),
    mediumSeverityCount:
      countBySeverity(securityIssues, "medium") +
      countBySeverity(gasIssues, "medium") +
      countBySeverity(practiceIssues, "medium"),
    lowSeverityCount:
      countBySeverity(securityIssues, "low") +
      countBySeverity(gasIssues, "low") +
      countBySeverity(practiceIssues, "low"),
    infoCount:
      countBySeverity(securityIssues, "info") +
      countBySeverity(gasIssues, "info") +
      countBySeverity(practiceIssues, "info"),
  };
  
  return { 
    file: filePath, 
    securityIssues, 
    gasIssues, 
    practiceIssues, 
    stats 
  };
}

function countBySeverity(
  issues: Issue[],
  severity: "high" | "medium" | "low" | "info"
): number {
  return issues.filter((issue) => issue.severity === severity).length;
}

// Export the analyzeSolidity function as analyze
export { analyzeSolidity as analyze };
export function analyzeSync(  ast: ASTNode, options: AnalysisOptions, filePath: string ): AnalysisResult {
  const result = analyzeSolidity(ast, options, filePath) as unknown as AnalysisResult;
  return result;
}

export { AnalysisOptions };
export { analyzeSecurity, SecurityAnalysisResult } from "./securityAnalyzer";
export { analyzeGas, GasAnalysisResult } from "./gasOptimizer";
export { analyzeBestPractices, BestPracticesResult } from "./bestpractices";
export { RuleEngine } from "./ruleEngine";
