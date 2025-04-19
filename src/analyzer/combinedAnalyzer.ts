import { ASTNode } from "../parser/solidity";
import { analyzeSecurity, SecurityAnalysisResult } from "./securityAnalyzer";
import { analyzeGas, GasAnalysisResult } from "./gasOptimizer";
import { Issue } from "../types";
import { AnalysisOptions } from "./ruleEngine";

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
            high: number;
            medium: number;
            low: number;
            info: number;
        };
    };
}

export class CombinedAnalyzer { 
    public analyze(ast: ASTNode, sourceCode: string, filePath: string): CombinedAnalysisResult {
        const options: AnalysisOptions = {};
        const securityResult = analyzeSecurity(ast, filePath, options);
        const gasResult = analyzeGas(ast, filePath, options);
        const allIssues = [...securityResult.issues, ...gasResult.issues] as Issue[];
        
        const bySeverity = {
            high: securityResult.stats.issuesBySeverity.high +  gasResult.stats.issuesBySeverity.high,
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

export function analyzeCombined( ast: ASTNode, sourceCode: string, filePath: string ): CombinedAnalysisResult {
    const analyzer = new CombinedAnalyzer();
    return analyzer.analyze(ast, sourceCode, filePath);
}