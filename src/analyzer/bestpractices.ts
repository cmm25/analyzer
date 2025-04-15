import { Issue } from './index';
import { ASTNode } from '../parser/solidity';

interface PracticeRule {
    id: string;
    title: string;
    description: string;
    severity: string;
    check: (ast: ASTNode, source: string) => Promise<Partial<Issue>[]>;
}

const PRACTICE_RULES: PracticeRule[] = [
    {
        id: 'BP001',
        title: 'Missing function visibility',
        description: 'Function visibility is not explicitly declared',
        severity: 'medium',
        check: checkMissingVisibility
    },
    {
        id: 'BP002',
        title: 'Missing natspec documentation',
        description: 'Function or contract is missing NatSpec documentation',
        severity: 'low',
        check: checkMissingNatspec
    },
    {
        id: 'BP003',
        title: 'Magic numbers',
        description: 'Contract uses magic numbers instead of named constants',
        severity: 'low',
        check: checkMagicNumbers
    },
    {
        id: 'BP004',
        title: 'Inconsistent function naming',
        description: 'Function naming does not follow Solidity style guidelines',
        severity: 'info',
        check: checkFunctionNaming
    }
];

export async function analyzeBestPractices(ast: ASTNode, source: string): Promise<Issue[]> {
    const issues: Issue[] = [];

    for (const rule of PRACTICE_RULES) {
        const ruleIssues = await rule.check(ast, source);
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

async function checkMissingVisibility(ast: ASTNode, source: string): Promise<Partial<Issue>[]> {
    const issues: Partial<Issue>[] = [];
    // Find functions without explicit visibility
    const functionRegex = /function\s+(\w+)\s*\([^)]*\)(?!\s*(public|private|internal|external))/g;
    const matches = [...source.matchAll(functionRegex)];

    for (const match of matches) {
        const funcName = match[1];
        const matchPos = match.index || 0;
        const lineNumber = source.substring(0, matchPos).split('\n').length;

        issues.push({
            line: lineNumber,
            column: match.index ? match.index - source.lastIndexOf('\n', match.index) : 0,
            suggestions: [
                `Add explicit visibility to function '${funcName}'`,
                'Choose from: public, private, internal, or external',
                'Example: function example() public { ... }'
            ],
            canAutoFix: true
        });
    }
    return issues;
}

async function checkMissingNatspec(ast: ASTNode, source: string): Promise<Partial<Issue>[]> {
    const issues: Partial<Issue>[] = [];

    // Find functions without natspec comments
    const functionRegex = /(?<!\*\/\s*)function\s+(\w+)/g;
    const matches = [...source.matchAll(functionRegex)];

    for (const match of matches) {
        const funcName = match[1];
        const matchPos = match.index || 0;
        const lineNumber = source.substring(0, matchPos).split('\n').length;
        const prevCode = source.substring(Math.max(0, matchPos - 100), matchPos);
        if (!prevCode.includes('/**')) {
            issues.push({
                line: lineNumber,
                column: match.index ? match.index - source.lastIndexOf('\n', match.index) : 0,
                suggestions: [
                    `Add NatSpec documentation to function '${funcName}'`,
                    '/**',
                    ' * @notice Description of what this function does',
                    ' * @param paramName Description of parameter',
                    ' * @return Description of return value',
                    ' */'
                ],
                canAutoFix: true
            });
        }
    }
    return issues;
}
async function checkMagicNumbers(ast: ASTNode, source: string): Promise<Partial<Issue>[]> {
    const issues: Partial<Issue>[] = [];
    // Find large numbers in code that aren't in constants
    // This is a simplification - in real code, you'd check if they're in constant definitions
    const magicNumberRegex = /[^\w\d.](\d{4,})[^\w\d.]/g;
    const matches = [...source.matchAll(magicNumberRegex)];

    for (const match of matches) {
        const number = match[1];
        const matchPos = match.index || 0;
        const lineNumber = source.substring(0, matchPos).split('\n').length;

        // Skip if it's in a constant definition
        const line = source.split('\n')[lineNumber - 1];
        if (!line.includes('constant')) {
            issues.push({
                line: lineNumber,
                column: match.index ? match.index - source.lastIndexOf('\n', match.index) : 0,
                suggestions: [
                    `Replace magic number ${number} with a named constant`,
                    `Example: uint256 constant EXAMPLE_VALUE = ${number};`,
                    'Constants improve code readability and maintainability'
                ],
                canAutoFix: true
            });
        }
    }

    return issues;
}