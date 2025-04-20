import { SecurityRule } from './rules';
import { Issue } from './common';

export interface GasIssue extends Issue {
    gasSaved?: string;
    estimatedGasSavings?: number;
    type?: string;
    fix?: () => string;
    explanation?: string;
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
