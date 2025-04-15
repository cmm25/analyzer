import { GasIssue } from "../types/gasIssue";
import { GasAnalysisResult } from "../types/gasAnalysisResult";

export function calculateGasStats(
    issues: GasIssue[]
): GasAnalysisResult["stats"] {
    const issuesBySeverity = {
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
    };

    for (const issue of issues) {
        issuesBySeverity[issue.severity]++;
    }

    let estimatedGasSavings = "Unknown";
    if (issues.length > 0) {
        estimatedGasSavings = "Approximately 5000-10000 gas could be saved";
    }

    return {
        issuesBySeverity,
        totalIssues: issues.length,
        estimatedGasSavings,
    };
}
