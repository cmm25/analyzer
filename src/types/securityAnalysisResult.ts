import { SecurityIssue } from './securityIssue';
import { AnalysisStats } from './common';

export interface SecurityAnalysisResult {
    file: string;
    issues: SecurityIssue[];
    stats: AnalysisStats;
}
