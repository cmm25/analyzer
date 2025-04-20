import { GasIssue } from "./gasIssue";
import { AnalysisStats } from "./common";

export interface GasAnalysisResult {
    file: string;
    issues: GasIssue[];
    stats: AnalysisStats & {
        issuesByType?: Record<string, number>;
        issuesWithEstimates?: number;
        estimatedGasSavings?: string;
    };
}
