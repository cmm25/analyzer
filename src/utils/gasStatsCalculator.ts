import { GasIssue } from "../types/gasIssue";
import { GasAnalysisResult } from "../types/gasAnalysisResult";

/**
 * Calculates statistics for gas optimization issues
 * @param issues Gas issues found during analysis
 * @returns Structured statistics about the gas issues
 */
export function calculateGasStats( issues: GasIssue[]): GasAnalysisResult["stats"] {
    const issuesBySeverity = {
        critical: countBySeverity(issues, "critical"),
        high: countBySeverity(issues, "high"),
        medium: countBySeverity(issues, "medium"),
        low: countBySeverity(issues, "low"),
        info: countBySeverity(issues, "info")
    };
    
    const totalGasSavings = issues.reduce((total, issue) => {
        const gasSavings = issue.estimatedGasSavings || 0;
        return total + gasSavings;
    }, 0);
    
    const issuesWithEstimates = issues.filter(issue => 
        issue.estimatedGasSavings !== undefined && 
        issue.estimatedGasSavings > 0
    ).length;
    
    let estimatedGasSavings = "Unknown";
    if (totalGasSavings > 0) {
        estimatedGasSavings = `${totalGasSavings.toLocaleString()} gas units`;
    } else if (issues.length > 0) {
        estimatedGasSavings = "Potential savings cannot be accurately estimated";
    }
    
    const issuesByType = issues.reduce((acc, issue) => {
        const type = issue.type || "unknown";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        issuesBySeverity,
        issuesByType,
        totalIssues: issues.length,
        issuesWithEstimates,
        estimatedGasSavings,
    };
}

/**
 * Helper function to count issues by severity
 * @param issues List of gas issues
 * @param severity Severity level to count
 * @returns Number of issues with the specified severity
 */
function countBySeverity( issues: GasIssue[],  severity: "critical" | "high" | "medium" | "low" | "info"): number {
    return issues.filter(issue => issue.severity === severity).length;
}
