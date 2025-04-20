import { ASTNode } from "../parser/solidity";
import { ASTNodeWithLocation } from "../utils/astUtils";
import { SecurityAnalyzer, SecurityAnalysisResult } from "./securityAnalyzer";
import { GasOptimizer, GasAnalysisResult } from "./gasOptimizer";
import { analyzeBestPracticesDetailed, BestPracticesResult } from "./bestpractices";

export type Severity = "high" | "medium" | "low" | "info";

export interface Issue {
    id: string;
    title?: string;
    description: string;
    message?: string;
    line?: number | null;
    column?: number | null;
    severity: 'high' | 'medium' | 'low' | 'info';
    canAutoFix?: boolean;
    suggestions?: string[];
    location?: {
        line: number | null;
        file: string;
    } | {
        start: { line: number; column: number; };
        end: { line: number; column: number; };
        line?: number | null;
        file?: string;
    };
    code?: string;
    codeSnippet?: string;
    filePath?: string;
}


export interface AnalysisOptions {
    security?: boolean;
    gas?: boolean;
    practices?: boolean;
    includeRules?: string[];
    excludeRules?: string[];
    minSeverity?: "high" | "medium" | "low" | "info";
    /** Enable verbose output */
    verbose?: boolean;
}

export interface AnalysisResult {
    file: string;
    security?: any;
    gas?: any;
    practice?: any;
    securityIssues: Issue[];
    gasIssues: Issue[];
    practiceIssues: Issue[];
    issues?: Issue[];
    stats: { 
        issuesBySeverity: {
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
        stats: {  // Initialize stats object directly
            issuesBySeverity: { high: 0, medium: 0, low: 0, info: 0 },
            totalIssues: 0
        }
    };

    // Security analysis
    if (runSecurity) {
        if (options.verbose) {
            console.log(`Running security analysis on ${filePath}...`);
        }
        const securityAnalyzer = new SecurityAnalyzer();
        const securityResults = securityAnalyzer.analyze(ast, sourceCode, filePath, options);
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
        const gasResults = gasOptimizer.analyze(ast, sourceCode, filePath, options);
        result.gas = gasResults;
        result.gasIssues = gasResults.issues;
        if (options.verbose) {
            console.log(`Found ${gasResults.issues.length} gas optimization opportunities.`);
        }
    }

    // Best practices analysis
    if (runPractices) {
        if (options.verbose) {
            console.log(`Running best practices analysis on ${filePath}...`);
        }
        const practiceResults = await analyzeBestPracticesDetailed(ast, sourceCode, filePath, options);
        result.practice = practiceResults;
        result.practiceIssues = practiceResults.issues;
        if (options.verbose) {
            console.log(`Found ${practiceResults.issues.length} best practice issues.`);
        }
    }

    // Combine all issues
    result.issues = [...result.securityIssues, ...result.gasIssues, ...result.practiceIssues];
    
    // Update stats
    result.stats = calculateStats(result.issues);

    if (options.verbose) {
        console.log(`Analysis complete. Total issues: ${result.stats.totalIssues}`);
    }

    return result;
}

function calculateStats(issues: Issue[]): AnalysisResult["stats"] {
    const issuesBySeverity = { high: 0, medium: 0, low: 0, info: 0 };
    
    for (const issue of issues) {
        issuesBySeverity[issue.severity]++;
    }
    
    return {
        issuesBySeverity,
        totalIssues: issues.length
    };
}