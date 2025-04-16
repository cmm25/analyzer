export interface Issue {
    id: string;
    title: string;
    description: string;
    severity: "high" | "medium" | "low" | "info";
    line?: number;
    column?: number;
    codeSnippet?: string;
    suggestions?: string[];
    canAutoFix?: boolean;
    fix?: () => string;
}
