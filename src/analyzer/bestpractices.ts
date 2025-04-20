import { Issue } from "../types";
import { ASTNode } from '../parser/solidity';

export interface BestPracticesResult {
    issues: Issue[];
}

export interface AnalysisOptions {
    excludeRules?: string[];
    includeRules?: string[];
    minSeverity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

export interface PracticeRule {
    id: string;
    title: string;
    description: string;
    severity: string;
    check: (ast: ASTNode, source: string, filePath: string) => Promise<Partial<Issue>[]>;
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
    },
    {
        id: 'BP005',
        title: 'State changes without event emission',
        description: 'Functions that change state should emit events for better observability',
        severity: 'medium',
        check: checkEventEmission
    }
];


/**
 * Analyzes a Solidity AST for best practice violations
 * @param ast The AST to analyze
 * @param filePath Path to the source file
 * @param options Analysis options
 * @returns Best practices analysis result
 */
export function analyzeBestPractices(
    ast: ASTNode,
    filePath: string,
    options: AnalysisOptions = {}
): BestPracticesResult {
    const issues: Issue[] = [];
    return { issues };
}

/**
 * Analyzes a Solidity AST for best practice violations with detailed rule checking
 * @param ast The AST to analyze
 * @param source The source code content
 * @param filePath Path to the source file
 * @param options Analysis options
 */
export async function analyzeBestPracticesDetailed(
    ast: ASTNode,
    source: string,
    filePath: string,
    options: AnalysisOptions = {}
): Promise<BestPracticesResult> {
    const issues: Issue[] = [];
    let rulesToApply = [...PRACTICE_RULES];

    if (options.includeRules && options.includeRules.length > 0) {
        rulesToApply = rulesToApply.filter(rule =>
            options.includeRules?.includes(rule.id));
    }

    if (options.excludeRules && options.excludeRules.length > 0) {
        rulesToApply = rulesToApply.filter(rule =>
            !options.excludeRules?.includes(rule.id));
    }
    if (options.minSeverity) {
        const severityLevels = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1,
            info: 0
        };
        const minLevel = severityLevels[options.minSeverity];
        rulesToApply = rulesToApply.filter(rule => {
            const ruleLevel = severityLevels[rule.severity as 'high' | 'medium' | 'low' | 'info'] || 0;
            return ruleLevel >= minLevel;
        });
    }
    for (const rule of rulesToApply) {
        const ruleIssues = await rule.check(ast, source, filePath);
        ruleIssues.forEach(partialIssue => {
            issues.push({
                ...partialIssue,
                id: rule.id,
                title: rule.title,
                severity: rule.severity as 'high' | 'medium' | 'low' | 'info',
                description: rule.description,
                canAutoFix: !!partialIssue.canAutoFix,
                filePath: filePath
            } as Issue);
        });
    }
    return { issues };
}

async function checkMissingVisibility(ast: ASTNode, source: string, filePath: string): Promise<Partial<Issue>[]> {
    const issues: Partial<Issue>[] = [];
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
async function checkMissingNatspec(ast: ASTNode, source: string, filePath: string): Promise<Partial<Issue>[]> {
    const issues: Partial<Issue>[] = [];
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

async function checkFunctionNaming(ast: ASTNode, source: string, filePath: string): Promise<Partial<Issue>[]> {
    const issues: Partial<Issue>[] = [];
    const functionRegex = /function\s+(\w+)/g;
    const matches = [...source.matchAll(functionRegex)];

    for (const match of matches) {
        const funcName = match[1];
        const matchPos = match.index || 0;
        if (funcName === 'constructor' || funcName === 'fallback' || funcName === 'receive') {
            continue;
        }

        if (!/^[a-z][a-zA-Z0-9]*$/.test(funcName) || funcName.includes('_')) {
            const lineNumber = source.substring(0, matchPos).split('\n').length;

            issues.push({
                line: lineNumber,
                column: match.index ? match.index - source.lastIndexOf('\n', match.index) : 0,
                suggestions: [
                    `Rename function '${funcName}' to follow camelCase convention`,
                    'Function names should start with a lowercase letter',
                    'Avoid underscores in function names',
                    `Example: '${convertToCamelCase(funcName)}'`
                ],
                canAutoFix: true
            });
        }
    }
    return issues;
}

// Helper to convert function names to camelCase
function convertToCamelCase(name: string): string {
    name = name.replace(/^_+/, '');
    name = name.replace(/_([a-zA-Z])/g, (_, letter) => letter.toUpperCase());
    return name.charAt(0).toLowerCase() + name.slice(1);
}

async function checkMagicNumbers(ast: ASTNode, source: string, filePath: string): Promise<Partial<Issue>[]> {
    const issues: Partial<Issue>[] = [];
    const acceptableNumbers = new Set([0, 1, 2, 10, 100]);
    // Find large numbers in code that aren't in constants
    const magicNumberRegex = /[^\w\d.](\d+)[^\w\d.]/g;
    const matches = [...source.matchAll(magicNumberRegex)];

    for (const match of matches) {
        const number = parseInt(match[1]);
        // Skip acceptable small numbers
        if (isNaN(number) || acceptableNumbers.has(number) || number < 10) {
            continue;
        }

        const matchPos = match.index || 0;
        const lineNumber = source.substring(0, matchPos).split('\n').length;
        const line = source.split('\n')[lineNumber - 1];
        if (line.includes('constant') || line.includes('event ')) {
            continue;
        }
        const contextRange = 20;
        const context = source.substring(
            Math.max(0, matchPos - contextRange),
            Math.min(source.length, matchPos + match[0].length + contextRange)
        );
        // Skip if it appears to be a timestamp or time-related
        if (/\b(time|block\.timestamp|now|seconds|minutes|hours|days|weeks)\b/.test(context)) {
            continue;
        }

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

    return issues;
}

async function checkEventEmission(ast: ASTNode, source: string, filePath: string): Promise<Partial<Issue>[]> {
    const issues: Partial<Issue>[] = [];
    const functionRegex = /function\s+(\w+)[^{]*(?!\bview\b|\bpure\b)[^{]*\{/g;
    const matches = [...source.matchAll(functionRegex)];

    for (const match of matches) {
        const funcName = match[1];
        const matchPos = match.index || 0;
        if (funcName === 'constructor' || funcName === 'fallback' || funcName === 'receive') {
            continue;
        }
        const bodyStart = source.indexOf('{', matchPos);
        const bodyEnd = findMatchingBracket(source, bodyStart);

        if (bodyStart >= 0 && bodyEnd >= 0) {
            const funcBody = source.substring(bodyStart, bodyEnd + 1);
            if (funcBody.includes('=') && !funcBody.includes('emit ')) {
                const lineNumber = source.substring(0, matchPos).split('\n').length;

                issues.push({
                    line: lineNumber,
                    column: match.index ? match.index - source.lastIndexOf('\n', match.index) : 0,
                    suggestions: [
                        `Function '${funcName}' changes state but doesn't emit an event`,
                        'Consider adding events for state changes to make them observable off-chain',
                        `Example: emit ${funcName.charAt(0).toUpperCase() + funcName.slice(1)}(parameters);`
                    ],
                    canAutoFix: false
                });
            }
        }
    }
    return issues;
}

function findMatchingBracket(source: string, openPos: number): number {
    if (source[openPos] !== '{') return -1;

    let depth = 1;
    let pos = openPos + 1;

    while (pos < source.length && depth > 0) {
        if (source[pos] === '{') depth++;
        else if (source[pos] === '}') depth--;
        if (depth === 0) return pos;
        pos++;
    }

    return -1;
}

export const bestPracticesRules = PRACTICE_RULES;
export class RuleEngine {
    private rules: PracticeRule[];

    constructor(rules: PracticeRule[]) {
        this.rules = rules;
    }

    /**
     * Analyze code against the loaded rules
     * @param ast The AST to analyze
     * @param source The source code content
     * @param filePath Path to the source file
     * @param options Analysis options
     */
    async analyze(
        ast: ASTNode,
        source: string,
        filePath: string,
        options: AnalysisOptions = {}
    ): Promise<Issue[]> {
        const issues: Issue[] = [];
        let rulesToApply = [...this.rules];

        if (options.includeRules && options.includeRules.length > 0) {
            rulesToApply = rulesToApply.filter(rule =>
                options.includeRules?.includes(rule.id));
        }

        if (options.excludeRules && options.excludeRules.length > 0) {
            rulesToApply = rulesToApply.filter(rule =>
                !options.excludeRules?.includes(rule.id));
        }
        if (options.minSeverity) {
            const severityLevels: Record<string, number> = {
                critical: 4,
                high: 3,
                medium: 2,
                low: 1,
                info: 0
            };
            const minLevel = severityLevels[options.minSeverity];
            rulesToApply = rulesToApply.filter(rule => {
                const ruleLevel = severityLevels[rule.severity] || 0;
                return ruleLevel >= minLevel;
            });
        }

        // Apply each rule
        for (const rule of rulesToApply) {
            const ruleIssues = await rule.check(ast, source, filePath);
            ruleIssues.forEach(partialIssue => {
                issues.push({
                    ...partialIssue,
                    id: rule.id,
                    title: rule.title,
                    severity: rule.severity as 'high' | 'medium' | 'low' | 'info',
                    description: rule.description,
                    canAutoFix: !!partialIssue.canAutoFix,
                    filePath: filePath
                } as Issue);
            });
        }

        return issues;
    }
}
