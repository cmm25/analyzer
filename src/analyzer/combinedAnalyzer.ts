import { ASTNode } from "../parser/solidity";
import { analyzeSecurity, SecurityAnalysisResult } from "./securityAnalyzer";
import { analyzeGas, GasAnalysisResult } from "./gasOptimizer";
import { Issue, AnalysisOptions } from "../types/common";

export interface CombinedAnalysisResult {
    file: string;
    securityResult: SecurityAnalysisResult;
    gasResult: GasAnalysisResult;
    allIssues: Issue[];
    stats: {
        securityIssueCount: number;
        gasIssueCount: number;
        totalIssueCount: number;
        bySeverity: {
            critical: number;
            high: number;
            medium: number;
            low: number;
            info: number;
        };
    };
}

export class CombinedAnalyzer { 
    public analyze(ast: ASTNode, sourceCode: string, filePath: string, options?: AnalysisOptions): CombinedAnalysisResult {
        // Ensure options is always an object, not undefined
        const analysisOptions: AnalysisOptions = options || {};
        
        // Pass parameters in the correct order
        const securityResult = analyzeSecurity(ast, sourceCode, filePath, analysisOptions);
        
        // Fix: analyzeGas expects fewer arguments
        const gasResult = analyzeGas(ast, filePath, analysisOptions);
        const allIssues = [...securityResult.issues, ...gasResult.issues] as Issue[];
        
        const bySeverity = {
            critical: securityResult.stats.issuesBySeverity.critical + gasResult.stats.issuesBySeverity.critical,
            high: securityResult.stats.issuesBySeverity.high + gasResult.stats.issuesBySeverity.high,
            medium: securityResult.stats.issuesBySeverity.medium + gasResult.stats.issuesBySeverity.medium,
            low: securityResult.stats.issuesBySeverity.low + gasResult.stats.issuesBySeverity.low,
            info: securityResult.stats.issuesBySeverity.info + gasResult.stats.issuesBySeverity.info,
        };

        return {
            file: filePath,
            securityResult,
            gasResult,
            allIssues,
            stats: {
                securityIssueCount: securityResult.stats.totalIssues,
                gasIssueCount: gasResult.stats.totalIssues,
                totalIssueCount: securityResult.stats.totalIssues + gasResult.stats.totalIssues,
                bySeverity,
            },
        };
    }
}

export function analyzeCombined(ast: ASTNode, sourceCode: string, filePath: string, options?: AnalysisOptions): CombinedAnalysisResult {
    const analyzer = new CombinedAnalyzer();
    return analyzer.analyze(ast, sourceCode, filePath, options);
}
