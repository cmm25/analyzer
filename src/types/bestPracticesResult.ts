import { PracticeIssue } from './practiceIssue';

export interface BestPracticesResult {
    file: string;
    issues: PracticeIssue[];
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