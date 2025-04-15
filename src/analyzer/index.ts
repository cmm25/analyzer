
import { analyzeSecurity } from './securityAnalyzer';
import { analyzeGas } from './gasOptimizer';
import { analyzeBestPractices } from './bestpractices';
import { parseSolidity, ParsedContract } from '../parser/solidity';

export interface AnalysisOptions {
    security: boolean;
    gasOptimization: boolean;
    bestPractices: boolean;
}

export interface AnalysisResult {
    securityIssues: Issue[];
    gasIssues: Issue[];
    practiceIssues: Issue[];
}

export interface Issue {
    id: string;
    severity: 'high' | 'medium' | 'low' | 'info';
    title: string;
    description: string;
    line: number;
    column: number;
    suggestions?: string[];
    canAutoFix: boolean;
    codeSnippet?: string;
}

export async function analyze(
    source: string,
    options: AnalysisOptions
): Promise<AnalysisResult> {
    // Parse the Solidity code into an AST
    const parsed = parseSolidity(source);

    // Check for parse errors
    if (parsed.errors.length > 0) {
        throw new Error(`Failed to parse Solidity code: ${parsed.errors[0].message}`);
    }

    // Initialize empty results
    const result: AnalysisResult = {
        securityIssues: [],
        gasIssues: [],
        practiceIssues: []
    };

    // Run enabled analyzers
    if (options.security) {
        result.securityIssues = await analyzeSecurity(parsed.ast, source);
    }

    if (options.gasOptimization) {
        result.gasIssues = await analyzeGas(parsed.ast, source);
    }

    if (options.bestPractices) {
        result.practiceIssues = await analyzeBestPractices(parsed.ast, source);
    }

    // Add code snippets to issues
    addCodeSnippets(result, source);

    return result;
}

function addCodeSnippets(result: AnalysisResult, source: string): void {
    const lines = source.split('\n');

    const addSnippet = (issue: Issue) => {
        const startLine = Math.max(0, issue.line - 2);
        const endLine = Math.min(lines.length, issue.line + 2);

        const snippetLines = lines.slice(startLine, endLine);
        issue.codeSnippet = snippetLines.join('\n');
    };

    [...result.securityIssues, ...result.gasIssues, ...result.practiceIssues]
        .forEach(addSnippet);
}