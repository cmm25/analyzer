import { ASTNode } from "../parser/solidity";
import { ASTNodeWithLocation } from "../utils/astUtils";
import { SecurityAnalyzer } from "./securityAnalyzer";
import { GasOptimizer } from "./gasOptimizer";
import { analyzeBestPracticesDetailed } from "./bestpractices";

// Import types correctly
import { 
    Issue, 
    Severity,
    AnalysisOptions 
} from "../types";

// Import result types as type imports to avoid "Cannot find name" errors
import type { 
    GasAnalysisResult, 
    SecurityAnalysisResult, 
    BestPracticesResult 
} from "../types";

// Import all rules for proper registration
import "../rules/securityRules";
import "../rules/gas";
// Import best practices rules directly from the analyzer
import { bestPracticesRules } from "./bestpractices";

export interface AnalysisResult {
    file: string;
    security?: SecurityAnalysisResult;
    gas?: GasAnalysisResult;
    practice?: BestPracticesResult;
    securityIssues: Issue[];
    gasIssues: Issue[];
    practiceIssues: Issue[];
    issues?: Issue[];
    stats: { 
        issuesBySeverity: {
            critical: number;
            high: number;
            medium: number;
            low: number;
            info: number;
        };
        /** Total number of issues found */
        totalIssues: number;
    };
}

export interface SecurityRule {
    id: string;
    name: string;
    description: string;
    severity: Severity;
    category: string;

    /**
     * Check if the given AST node violates this rule
     * @param node The AST node to check
     * @param sourceCode Original source code (for getting text representations)
     * @param filePath Path to the file being analyzed
     * @returns Array of issues found, or empty array if no issues
     */
    detect(node: ASTNode, sourceCode: string, filePath: string): Issue[];
}

export interface ReentrancyRule extends SecurityRule {
    checkReentrancyPattern(
        externalCalls: ASTNodeWithLocation[],
        stateChanges: ASTNodeWithLocation[],
        functionNode: ASTNode,
        sourceCode: string,
        filePath: string
    ): Issue[];
}

/**
 * Main analysis function that analyzes a Solidity AST for various issues
 * @param ast The AST to analyze
 * @param options Analysis options
 * @param filePath Path to the file being analyzed
 * @param sourceCode Source code content of the file
 * @returns Analysis results containing security, gas, and best practice issues
 */
export async function analyze(
    ast: ASTNode,
    options: AnalysisOptions = {},
    filePath: string,
    sourceCode: string
): Promise<AnalysisResult> {
    if (options.verbose) {
        console.log(`Starting analysis for ${filePath}`);
        console.log(`Analysis options: ${JSON.stringify(options)}`);
    }

    // Default: run all analyses if none specified
    const runAll = !options.security && !options.gas && !options.practices;
    const runSecurity = options.security || runAll;
    const runGas = options.gas || runAll;
    const runPractices = options.practices || runAll;

    // Create result object
    const result: AnalysisResult = {
        file: filePath,
        securityIssues: [],
        gasIssues: [],
        practiceIssues: [],
        stats: {
            issuesBySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
            totalIssues: 0
        }
    };

    // Security analysis
    if (runSecurity) {
        if (options.verbose) {
            console.log(`Running security analysis on ${filePath}...`);
        }
        // Pass options through the constructor, not the analyze method
        const securityAnalyzer = new SecurityAnalyzer(ast, sourceCode, filePath, options);
        const securityResults = securityAnalyzer.analyze();
        result.security = securityResults;
        result.securityIssues = securityResults.issues;
        if (options.verbose) {
            console.log(`Found ${securityResults.issues.length} security issues.`);
        }
    }

    // Gas optimization analysis
    if (runGas) {
        if (options.verbose) {
            console.log(`Running gas optimization analysis on ${filePath}...`);
        }
        const gasOptimizer = new GasOptimizer();
        const gasResults = gasOptimizer.analyze(ast, sourceCode, filePath, options as any);
        result.gas = gasResults;
        // Cast issues to ensure type compatibility
        result.gasIssues = gasResults.issues as Issue[];
        if (options.verbose) {
            console.log(`Found ${gasResults.issues.length} gas optimization opportunities.`);
        }
    }

    if (runPractices) {
        if (options.verbose) {
            console.log(`Running best practices analysis on ${filePath}...`);
        }
        const practiceResults = await analyzeBestPracticesDetailed(ast, sourceCode, filePath, options as any);
        result.practice = practiceResults as any;
        result.practiceIssues = practiceResults.issues;
        if (options.verbose) {
            console.log(`Found ${practiceResults.issues.length} best practice issues.`);
        }
    }
    result.issues = [...result.securityIssues, ...result.gasIssues, ...result.practiceIssues];

    result.stats = calculateStats(result.issues);

    if (options.verbose) {
        console.log(`Analysis complete. Total issues: ${result.stats.totalIssues}`);
        console.log(`Issues by severity: Critical: ${result.stats.issuesBySeverity.critical}, High: ${result.stats.issuesBySeverity.high}, Medium: ${result.stats.issuesBySeverity.medium}, Low: ${result.stats.issuesBySeverity.low}, Info: ${result.stats.issuesBySeverity.info}`);
    }

    return result;
}

function calculateStats(issues: Issue[]): AnalysisResult["stats"] {
    const issuesBySeverity = { 
        critical: 0, 
        high: 0, 
        medium: 0, 
        low: 0, 
        info: 0 
    };
    
    for (const issue of issues) {
        const severityKey = issue.severity as keyof typeof issuesBySeverity;
        if (severityKey in issuesBySeverity) {
            issuesBySeverity[severityKey]++;
        }
    }
    
    return {
        issuesBySeverity,
        totalIssues: issues.length
    };
}
export { AnalysisOptions } from "../types";
