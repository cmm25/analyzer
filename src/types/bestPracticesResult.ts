import { Issue } from './rules';

export interface BestPracticesResult {
    file: string;
    issues: Issue[];
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
