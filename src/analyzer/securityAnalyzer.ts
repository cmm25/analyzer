import { Issue } from './index';
import { ASTNode } from '../parser/solidity';

interface SecurityRule {
    id: string;
    title: string;
    description: string;
    severity: string;
    check: (ast: ASTNode, source: string) => Promise<Partial<Issue>[]>;
}

const SECURITY_RULES: SecurityRule[] = [
    {
        id: 'SEC001',
        title: 'Reentrancy vulnerability',
        description: 'The contract may be vulnerable to reentrancy attacks when it makes external calls before updating its state.',
        severity: 'high',
        check: checkReentrancy
    },
    {
        id: 'SEC002',
        title: 'Unchecked external call return value',
        description: 'Low-level call return value is not checked which might lead to silent failures.',
        severity: 'medium',
        check: checkUncheckedReturns
    },
    {
        id: 'SEC003',
        title: 'Use of tx.origin for authorization',
        description: 'Using tx.origin for authorization is unsafe and can make the contract vulnerable to phishing attacks.',
        severity: 'high',
        check: checkTxOrigin
    },
    {
        id: 'SEC004',
        title: 'Integer overflow/underflow',
        description: 'Contract may be vulnerable to integer overflow or underflow for Solidity versions < 0.8.0.',
        severity: 'high',
        check: checkIntegerOverflow
    }
];

export async function analyzeSecurity(ast: ASTNode, source: string): Promise<Issue[]> {
    const issues: Issue[] = [];

    for (const rule of SECURITY_RULES) {
        const ruleIssues = await rule.check(ast, source);

        // Metadata to each issue
        ruleIssues.forEach(partialIssue => {
            issues.push({
                ...partialIssue,
                id: rule.id,
                title: rule.title,
                severity: rule.severity as 'high' | 'medium' | 'low' | 'info',
                description: rule.description,
                canAutoFix: !!partialIssue.canAutoFix
            } as Issue);
        });
    }

    return issues;
}
async function checkUncheckedReturns(ast: ASTNode, source: string): Promise<Partial<Issue>[]> {
    const issues: Partial<Issue>[] = [];
    const callRegex = /(\w+\.call\{.*?\}\((.*?)\))/g;
    const matches = [...source.matchAll(callRegex)];

    for (const match of matches) {
        const callExpr = match[1];
        const matchPos = match.index || 0;
        const lineNumber = source.substring(0, matchPos).split('\n').length;

        // Check if return value is being checked
        // This is a simplified check, the real one would use AST
        const surroundingCode = source.substring(Math.max(0, matchPos - 20), matchPos + callExpr.length + 20);

        if (!surroundingCode.includes('require(') && !surroundingCode.includes('if (')) {
            issues.push({
                line: lineNumber,
                column: match.index ? match.index - source.lastIndexOf('\n', match.index) : 0,
                suggestions: [
                    'Check the return value of low-level calls',
                    'Use require() to validate the call success',
                    'Consider using OpenZeppelin\'s Address.sendValue for ETH transfers'
                ],
                canAutoFix: true // This could potentially be auto-fixed
            });
        }
    }
    return issues;
}


async function checkIntegerOverflow(ast: ASTNode, source: string): Promise<Partial<Issue>[]> {
    const issues: Partial<Issue>[] = [];
    // Check Solidity version
    const versionRegex = /pragma solidity (\^|>=|<=)?([0-9]+\.[0-9]+\.[0-9]+)/;
    const versionMatch = source.match(versionRegex);
    if (versionMatch) {
        const version = versionMatch[2];
        const [major, minor] = version.split('.').map(Number);

        // Solidity 0.8.0+ has built-in overflow checking
        if (major === 0 && minor < 8) {
            const arithmeticOps = /\+|\-|\*|\//g;
            const matches = [...source.matchAll(arithmeticOps)];

            // Check if SafeMath is used
            const usesSafeMath = /using SafeMath for/i.test(source);

            if (!usesSafeMath && matches.length > 0) {
                const matchPos = matches[0].index || 0;
                const lineNumber = source.substring(0, matchPos).split('\n').length;

                issues.push({
                    line: lineNumber,
                    column: matches[0].index ? matches[0].index - source.lastIndexOf('\n', matches[0].index) : 0,
                    suggestions: [
                        'Use OpenZeppelin\'s SafeMath library for arithmetic operations',
                        'Upgrade to Solidity 0.8.0 or later for built-in overflow checking',
                        'Add explicit overflow checks around arithmetic operations'
                    ],
                    canAutoFix: true
                });
            }
        }
    }
    return issues;
}

async function checkReentrancy(ast: ASTNode, source: string): Promise<Partial<Issue>[]> {
    const issues: Partial<Issue>[] = [];

    // This is a simplified implementation
    // In a real tool, you would traverse the AST to find patterns like:
    // 1. External calls (.call, .send, .transfer)
    // 2. State changes after these calls

    // For demonstration purposes, we'll look for .call followed by state changes
    const callRegex = /\.call\{.*?\}\((.*?)\)/g;
    const matches = [...source.matchAll(callRegex)];

    // For each match, check if there's a state assignment after it
    for (const match of matches) {
        const matchPos = match.index || 0;
        const lineNumber = source.substring(0, matchPos).split('\n').length;
        // A real implementation would use the AST to check the execution path
        const afterCall = source.substring(matchPos + match[0].length);
        if (/\s*\w+\s*=/.test(afterCall.split(';')[0])) {
            issues.push({
                line: lineNumber,
                column: match.index ? match.index - source.lastIndexOf('\n', match.index) : 0,
                suggestions: [
                    'Use the Checks-Effects-Interactions pattern',
                    'Consider using OpenZeppelin\'s ReentrancyGuard',
                    'Update state variables before making external calls'
                ],
                canAutoFix: false
            });
        }
    }

    return issues;
}