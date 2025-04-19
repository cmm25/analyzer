import { SecurityIssue } from './securityIssue';

export interface SecurityAnalysisResult {
    file: string;
    issues: SecurityIssue[];
    stats: {
        issuesBySeverity: {
            high: number;
            medium: number;
            low: number;
            info: number;
        };
        totalIssues: number;
    };
}