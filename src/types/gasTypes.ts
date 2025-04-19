import { Issue, SecurityRule } from './rules';

export interface GasIssue extends Issue {
    gasSaved?: string;
}

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

export interface GasRule extends SecurityRule {
    estimatedGasSaved?: string;
}