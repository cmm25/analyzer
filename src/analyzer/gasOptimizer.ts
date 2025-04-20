import { ASTNode } from "../parser/solidity";
import { findNodes } from "../utils/astUtils";
import { calculateGasStats } from "../utils/gasStatsCalculator";
import { GasIssue, GasAnalysisResult, GasRule } from "../types";
import { gasRules } from "../rules/gas";
import { AnalysisOptions } from "./ruleEngine";

export class GasOptimizer {
  public analyze(
    ast: ASTNode,
    sourceCode: string,
    filePath: string,
    options: AnalysisOptions = {}
  ): GasAnalysisResult {
    const issues: GasIssue[] = [];
    const nodes = findNodes(ast, ".*");

    for (const rule of gasRules) {
      for (const node of nodes) {
        const ruleIssues = rule.detect(node, sourceCode, filePath);
        if (ruleIssues && ruleIssues.length > 0) {
          issues.push(...ruleIssues);
        }
      }
    }

    return {
      file: filePath,
      issues,
      stats: calculateGasStats(issues),
    };
  }
}

/**
 * Analyzes a Solidity AST for gas optimization opportunities
 * @param ast The AST to analyze
 * @param filePath Path to the source file
 * @param options Analysis options
 */
export function analyzeGas(
  ast: ASTNode,
  filePath: string,
  options: AnalysisOptions = {}
): GasAnalysisResult {
  const optimizer = new GasOptimizer();
  // For backward compatibility, we're assuming sourceCode can be derived or is empty
  const sourceCode = "";
  return optimizer.analyze(ast, sourceCode, filePath, options);
}

// For backward compatibility
export function analyzeGasOptimization(
  ast: ASTNode,
  filePath: string,
  options: AnalysisOptions = {}
): GasAnalysisResult {
  return analyzeGas(ast, filePath, options);
}

export { GasIssue, GasAnalysisResult, GasRule } from "../types";
export { gasRules } from "../rules/gas";
