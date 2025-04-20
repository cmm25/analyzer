import chalk from 'chalk';
import { table } from 'table';
import { AnalysisResult } from '../analyzer';
import { Issue } from '../types/rules';

export function generateConsoleReport( results: AnalysisResult,  filePath: string, source: string ): void {
    const { securityIssues, gasIssues, practiceIssues } = results;
    console.log('\n' + chalk.bold(`Analysis results for ${filePath}:`));

    // Print security issues
    if (securityIssues.length > 0) {
        console.log('\n' + chalk.red.bold(`Security Issues (${securityIssues.length}):`));
        printIssueTable(securityIssues, source);
    }

    // Print gas optimization issues
    if (gasIssues.length > 0) {
        console.log('\n' + chalk.yellow.bold(`Gas Optimizations (${gasIssues.length}):`));
        printIssueTable(gasIssues, source);
    }

    // Print best practice issues
    if (practiceIssues.length > 0) {
        console.log('\n' + chalk.blue.bold(`Best Practices (${practiceIssues.length}):`));
        printIssueTable(practiceIssues, source);
    }
}

function printIssueTable(issues: Issue[], source: string): void {
    const sortedIssues = [...issues].sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2, info: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const data = [
        [
            chalk.bold('ID'),
            chalk.bold('Title'),
            chalk.bold('Line'),
            chalk.bold('Severity'),
            chalk.bold('Description')
        ]
    ];
    for (const issue of sortedIssues) {
        const severityColor =
            issue.severity === 'high' ? chalk.red :
            issue.severity === 'medium' ? chalk.yellow :
            issue.severity === 'low' ? chalk.blue :
            chalk.gray;

            data.push([
                issue.id,
                issue.title || issue.id, 
                issue.line ? issue.line.toString() : 'unknown', 
                severityColor(issue.severity),
                issue.description
            ]);
    }
    console.log(table(data));

    //detailed information for each issue
    for (const issue of sortedIssues) {
        console.log(chalk.bold(`\n${issue.id}: ${issue.title} (Line ${issue.line})`));
        console.log(chalk.dim(issue.description));
        if (issue.codeSnippet) {
            console.log(chalk.dim('\nCode:'));
            const lines = issue.codeSnippet.split('\n');
            const lineNumber = issue.line || 0; 
            const startLine = Math.max(0, lineNumber - Math.floor(lines.length / 2));

            lines.forEach((line, index) => {
                const currentLineNumber = startLine + index;
                const isIssueLine = currentLineNumber === lineNumber - 1;
                if (isIssueLine) {
                    console.log(chalk.red(`${currentLineNumber + 1}:   ${line}`));
                } else {
                    console.log(chalk.dim(`${currentLineNumber + 1}:   ${line}`));
                }
            });
        }

        // Print suggestions
        if (issue.suggestions && issue.suggestions.length > 0) {
            console.log(chalk.green('\nSuggestions:'));
            issue.suggestions.forEach(suggestion => {
                console.log(chalk.green(`- ${suggestion}`));
            });
        }
    }
}
