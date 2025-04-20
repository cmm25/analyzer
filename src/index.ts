import { ASTNode } from "./parser/solidity";
import { VulnerabilityAnalyzer, VulnerabilityReport } from "./analyzers/vulnerabilityAnalyzer";
import fs from "fs";

// Core exports
export { ASTNode } from "./parser/solidity";
export { ASTLocation, ASTNodeWithLocation } from "./utils/astUtils";
export * from "./types";

// Main analysis function export
export { analyze, AnalysisOptions, AnalysisResult } from "./analyzer";

// Analyzer exports
export {SecurityAnalyzer,analyzeSecurity,SecurityAnalysisResult} from "./analyzer/securityAnalyzer";
export {VulnerabilityAnalyzer,VulnerabilityReport} from "./analyzers/vulnerabilityAnalyzer";
export {GasOptimizer,analyzeGas,analyzeGasOptimization,GasAnalysisResult} from "./analyzer/gasOptimizer";
export {CombinedAnalyzer,analyzeCombined,CombinedAnalysisResult} from "./analyzer/combinedAnalyzer";
export { RuleEngine} from "./analyzer/ruleEngine";

// Rules exports
export {securityRules,reentrancyRule,uncheckedCallsRule,dangerousFunctionsRule} from "./rules/securityRules";
export {gasRules,explicitUint256Rule,packStorageVariablesRule,preIncrementRule} from "./rules/gas";

// Reporter exports
export { generateConsoleReport } from "./reporter/console";
export { generateHtmlReport } from "./reporter/html";

// Utilities
export * from "./utils/astUtils";
export * from "./utils/vulnerabilityUtils";
export { calculateGasStats } from "./utils/gasStatsCalculator";
export { readSolidityFile, writeToFile } from "./utils/fileSystem";
export { parseSolidity } from "./parser/solidity";

// Export the CLI setup
export { default as setupCLI } from "./cli";

export function analyzeSolidity( ast: ASTNode, sourceCode: string, filePath: string ): VulnerabilityReport {
    const analyzer = new VulnerabilityAnalyzer();
    return analyzer.analyze(ast, sourceCode, filePath);
}

if (require.main === module) {
    const { default: setupCLI } = require('./cli');
    setupCLI();
}