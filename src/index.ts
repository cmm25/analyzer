import { ASTNode } from "./parser/solidity";
import { VulnerabilityAnalyzer, VulnerabilityReport } from "./analyzers/vulnerabilityAnalyzer";

// Core exports
export { ASTNode } from "./parser/solidity";
export { ASTLocation, ASTNodeWithLocation } from "./utils/astUtils";
export * from "./types";

// Analyzer exports
export {SecurityAnalyzer,analyzeSecurity,SecurityAnalysisResult} from "./analyzer/securityAnalyzer";
export {VulnerabilityAnalyzer,VulnerabilityReport} from "./analyzers/vulnerabilityAnalyzer";
export {GasOptimizer,analyzeGas,analyzeGasOptimization,GasAnalysisResult} from "./analyzer/gasOptimizer";
export {CombinedAnalyzer,analyzeCombined,CombinedAnalysisResult} from "./analyzer/combinedAnalyzer";
export { RuleEngine, AnalysisOptions } from "./analyzer/ruleEngine";

// Rules exports
export {securityRules,reentrancyRule,uncheckedCallsRule,dangerousFunctionsRule} from "./rules/securityRules";
export {gasRules,explicitUint256Rule,packStorageVariablesRule,preIncrementRule} from "./rules/gas";

// Utilities
export * from "./utils/astUtils";
export * from "./utils/vulnerabilityUtils";
export { calculateGasStats } from "./utils/gasStatsCalculator";
export function analyzeSolidity( ast: ASTNode, sourceCode: string, filePath: string ): VulnerabilityReport {
    const analyzer = new VulnerabilityAnalyzer();
    return analyzer.analyze(ast, sourceCode, filePath);
}