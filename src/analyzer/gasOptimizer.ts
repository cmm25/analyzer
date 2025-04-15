import { ASTNode } from '../parser/solidity';
import { findNodes } from '../utils/astUtils';
import { calculateGasStats } from '../utils/gasStatsCalculator';
import { GasIssue, GasAnalysisResult, GasRule } from '../types';
import { gasRules } from '../rules/gas';

export class GasOptimizer {
  public analyze(ast: ASTNode, sourceCode: string, filePath: string): GasAnalysisResult {
    const issues: GasIssue[] = [];
    const nodes = findNodes(ast, '*');
    for (const rule of gasRules)
      for (const node of nodes)
        issues.push(...rule.detect(node, sourceCode, filePath));
    return { file: filePath, issues, stats: calculateGasStats(issues) };
  }
}

export function analyzeGas(ast: ASTNode, sourceCode: string, filePath: string): GasAnalysisResult {
  const optimizer = new GasOptimizer();
  return optimizer.analyze(ast, sourceCode, filePath);
}

// For backward compatibility
export function analyzeGasOptimization(ast: ASTNode, sourceCode: string, filePath: string): GasAnalysisResult {
  return analyzeGas(ast, sourceCode, filePath);
}

export { GasIssue, GasAnalysisResult, GasRule } from '../types';
export { gasRules } from '../rules/gas';