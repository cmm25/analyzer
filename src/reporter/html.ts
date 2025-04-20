import { AnalysisResult } from '../analyzer';
import { Issue, Severity } from '../types/common';
import { writeToFile } from '../utils/fileSystem';
export async function generateHtmlReport( results: AnalysisResult,  filePath: string, source: string, outputPath: string): Promise<void> {
    const { securityIssues, gasIssues, practiceIssues } = results;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Solidity Analyzer Report - ${filePath}</title>
        <style>
            body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            }
            h1, h2, h3 {
            color: #2c3e50;
            }
            .summary {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            }
            .summary-box {
            padding: 15px;
            border-radius: 5px;
            flex: 1;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            }
            .security { background-color: #e74c3c; }
            .gas { background-color: #f39c12; }
            .practices { background-color: #3498db; }
            .count {
            font-size: 24px;
            font-weight: bold;
            }
            .issues {
            margin-top: 30px;
            }
            .issue {
            background-color: #f8f9fa;
            border-left: 5px solid #ccc;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 0 5px 5px 0;
            }
            .issue-security { border-left-color: #e74c3c; }
            .issue-gas { border-left-color: #f39c12; }
            .issue-practices { border-left-color: #3498db; }
            .severity {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 12px;
            color: white;
            margin-left: 10px;
            }
            .severity-high { background-color: #e74c3c; }
            .severity-medium { background-color: #f39c12; }
            .severity-low { background-color: #3498db; }
            .severity-info { background-color: #95a5a6; }
            .suggestion {
            background-color: #ebfbee;
            padding: 10px;
            border-left: 3px solid #27ae60;
            margin-top: 10px;
            }
            .code {
            background-color: #f0f0f0;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            white-space: pre-wrap;
            margin: 10px 0;
            overflow-x: auto;
            }
            .highlight {
            background-color: #ffecec;
            display: block;
            }
            table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            }
            th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #ddd;
            }
            th {
            background-color: #f5f5f5;
            }
            .tabs {
            display: flex;
            margin-bottom: 20px;
            }
            .tab {
            padding: 10px 20px;
            background-color: #f5f5f5;
            cursor: pointer;
            margin-right: 5px;
            }
            .tab.active {
            background-color: #2c3e50;
            color: white;
            }
            .tab-content {
            display: none;
            }
            .tab-content.active {
            display: block;
            }
        </style>
        </head>
        <body>
            <h1>Solidity Analyzer Report</h1>
            <p><strong>File:</strong> ${filePath}</p>
            
            <div class="summary">
                <div class="summary-box security">
                    <div class="count">${securityIssues.length}</div>
                        <div>Security Issues</div>
                    </div>
                    <div class="summary-box gas">
                        <div class="count">${gasIssues.length}</div>
                        <div>Gas Optimizations</div>
                    </div>
                    <div class="summary-box practices">
                        <div class="count">${practiceIssues.length}</div>
                        <div>Best Practices</div>
                </div>
            </div>    
            <div class="tabs">
                <div class="tab active" onclick="switchTab('issues')">Issues</div>
                <div class="tab" onclick="switchTab('source')">Source Code</div>
            </div>
            
            <div id="issues" class="tab-content active">
                <!-- Security Issues -->
                <div class="issues">
                    <h2>Security Issues</h2>
                    ${renderIssueTable(securityIssues, "security")}
                    ${securityIssues.map((issue: Issue) => renderIssue(issue, "security")).join("")}
                </div>
                <div class="issues">
                    <h2>Gas Optimizations</h2>
                    ${renderIssueTable(gasIssues, "gas")}
                    ${gasIssues.map((issue: Issue) => renderIssue(issue, "gas")).join("")}
                </div>
                
                <!-- Best Practices -->
                <div class="issues">
                    <h2>Best Practices</h2>
                    ${renderIssueTable(practiceIssues, "practices")}
                    ${practiceIssues.map((issue: Issue) => renderIssue(issue, "practices")).join("")}
                </div>
            </div>
            
            <div id="source" class="tab-content">
                <h2>Source Code</h2>
                <div class="code">
                    ${highlightIssuesInSource(source, [ ...securityIssues, ...gasIssues,...practiceIssues,])}
                </div>
            </div>    
            <script>
                function switchTab(tabName) {
                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelectorAll('.tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.getElementById(tabName).classList.add('active');
                
                // Activate selected tab button
                document.querySelectorAll('.tab').forEach(tab => {
                    if (tab.textContent.toLowerCase().includes(tabName)) {
                    tab.classList.add('active');
                    }
                });
                }
            </script>
        </body>
    </html>`;

    await writeToFile(outputPath, htmlContent);
}

function renderIssueTable(issues: Issue[], type: string): string {
    if (issues.length === 0) {
        return '<p>No issues found.</p>';
    }

    return `<table>
                <thead>
                    <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Line</th>
                    <th>Severity</th>
                    </tr>
                </thead>
                <tbody>
                    ${issues.map(issue => `
                    <tr>
                        <td>${issue.id}</td>
                        <td>${issue.title}</td>
                        <td>${issue.line}</td>
                        <td><span class="severity severity-${issue.severity}">${issue.severity}</span></td>
                    </tr>
                    `).join('')}
                </tbody>
                </table>
            `;
}

function renderIssue(issue: Issue, type: string): string {
    return `
        <div class="issue issue-${type}">
            <h3>
                ${issue.id}: ${issue.title}
                <span class="severity severity-${issue.severity}">${issue.severity}</span>
            </h3>
            <p>${issue.description}</p>      
            <p><strong>Location:</strong> Line ${issue.line}</p>   
            ${issue.codeSnippet ? `<div class="code">${renderCodeWithHighlight(issue.codeSnippet, issue.line || 0)}</div>`: ''}      
            ${issue.suggestions && issue.suggestions.length > 0 ? `
                <div class="suggestion">
                    <strong>Suggestions:</strong>
                    <ul>
                        ${issue.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
}

function renderCodeWithHighlight(snippet: string, lineNumber: number): string {
    const lines = snippet.split('\n');
    const startLine = Math.max(0, lineNumber - Math.floor(lines.length / 2));

    return lines.map((line, index) => {
        const currentLineNumber = startLine + index;
        const isIssueLine = currentLineNumber === lineNumber - 1;
        const highlightClass = isIssueLine ? 'class="highlight"' : '';

        return `<span ${highlightClass}>${currentLineNumber + 1}: ${line}</span>`;
    }).join('\n');
}

function highlightIssuesInSource(source: string, issues: Issue[]): string {
    const lines = source.split('\n');
    const lineToIssues = new Map<number, Issue[]>();

    issues.forEach(issue => {
        const lineIssues = lineToIssues.get(issue.line || 0) || [];
        lineToIssues.set(issue.line || 0, lineIssues);
    });

    return lines.map((line, index) => {
        const lineNumber = index + 1;
        const lineIssues = lineToIssues.get(lineNumber) || [];

        if (lineIssues.length > 0) {
            const issueTypes = new Set(lineIssues.map(issue => {
                if (issue.id.startsWith('SEC')) return 'security';
                if (issue.id.startsWith('GAS')) return 'gas';
                return 'practices';
            }));
            const typeClass = [...issueTypes][0];
            return `<span class="highlight">${lineNumber}: ${line} <!-- ${lineIssues.map(i => i.id).join(', ')} --></span>`;
        }

        return `${lineNumber}: ${line}`;
    }).join('\n');
}
