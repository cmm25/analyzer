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
        issuesByType?: Record<string, number>; 
        totalIssues: number;
        issuesWithEstimates?: number; 
        estimatedGasSavings?: string;
    };
}