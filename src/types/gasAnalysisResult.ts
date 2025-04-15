import { GasIssue } from "./gasIssue";

export interface GasAnalysisResult {
    file: string;
    issues: GasIssue[];
    stats: {
        issuesBySeverity: {
            high: number;
            medium: number;
            low: number;
            info: number;
        };
        totalIssues: number;
        estimatedGasSavings?: string;
    };
}
