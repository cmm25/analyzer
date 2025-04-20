export type Severity = "critical" | "high" | "medium" | "low" | "info";


export interface ASTNode {
    type: string;
    range?: [number, number];
    loc?: {
        start: { line: number; column: number };
        end: { line: number; column: number };
    };
    [key: string]: any;
}

export interface BaseIssue {
    id: string;
    title?: string;
    description: string;
    message?: string;
    line?: number | null;
    column?: number | null;
    severity: Severity;
    canAutoFix?: boolean;
    suggestions?: string[];
    location?:
    | {
        line: number | null;
        file: string;
    }
    | {
        start: { line: number; column: number };
        end: { line: number; column: number };
        line?: number | null;
        file?: string;
    };
    code?: string;
    codeSnippet?: string;
    filePath?: string;
}

export type Issue = BaseIssue;

export interface AnalysisOptions {
    security?: boolean;
    gas?: boolean;
    practices?: boolean;
    includeRules?: string[];
    excludeRules?: string[];
    minSeverity?: Severity;
    verbose?: boolean;
}

export interface AnalysisStats {
    issuesBySeverity: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
    };
    totalIssues: number;
}
