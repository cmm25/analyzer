import { Issue, AnalysisStats } from './common';

export interface BestPracticesResult {
    file: string;
    issues: Issue[]; 
    stats: AnalysisStats;
}
