import { ASTNode } from "../parser/solidity";
import {
    ASTNodeWithLocation,
    getNodeLineNumber,
    getNodeText,
} from "../utils/astUtils";
import {
    findExternalCalls,
    findStateChanges,
    findAll,
} from "../utils/vulnerabilityUtils";
import { Issue, SecurityRule, ReentrancyRule, Severity } from "../types";

/**
 * Rule that detects potential reentrancy vulnerabilities
 */
export const reentrancyRule: ReentrancyRule = {
    id: "SEC-001",
    name: "Reentrancy Vulnerability",
    description:
        "Detects functions that modify state after making external calls, which could lead to reentrancy attacks",
    severity: "high",
    category: "security",

    detect(node: ASTNode, sourceCode: string, filePath: string): Issue[] {
        // Only check function definitions
        if (node.type !== "FunctionDefinition") {
            return [];
        }
        const externalCalls = findExternalCalls(node);
        const stateChanges = findStateChanges(node);

        if (externalCalls.length === 0 || stateChanges.length === 0) {
            return [];
        }

        return this.checkReentrancyPattern(
            externalCalls,
            stateChanges,
            node,
            sourceCode,
            filePath
        );
    },

    checkReentrancyPattern(
        externalCalls: ASTNodeWithLocation[],
        stateChanges: ASTNodeWithLocation[],
        functionNode: ASTNode,
        sourceCode: string,
        filePath: string
    ): Issue[] {
        const nodesByPosition: ASTNodeWithLocation[] = [
            ...externalCalls,
            ...stateChanges,
        ]
            .filter((node) => node.loc && node.loc.start)
            .sort((a, b) => {
                const aLine = a.loc?.start.line || 0;
                const bLine = b.loc?.start.line || 0;

                if (aLine === bLine) {
                    return (a.loc?.start.column || 0) - (b.loc?.start.column || 0);
                }

                return aLine - bLine;
            });

        // Check if there are any state changes after external calls
        for (let i = 0; i < nodesByPosition.length - 1; i++) {
            const currentNode = nodesByPosition[i];
            if (externalCalls.includes(currentNode)) {
                for (let j = i + 1; j < nodesByPosition.length; j++) {
                    if (stateChanges.includes(nodesByPosition[j])) {
                        // Just use type assertions where needed:
                        return [
                            {
                                id: this.id,
                                description:
                                    "Reentrancy vulnerability: state variables are modified after an external call",
                                severity: this.severity,
                                location: {
                                    line:
                                        getNodeLineNumber(functionNode as ASTNodeWithLocation) || 0,
                                    file: filePath,
                                },
                                code: getNodeText(
                                    functionNode as ASTNodeWithLocation,
                                    sourceCode
                                ),
                                suggestions: [
                                    "Follow the Checks-Effects-Interactions pattern: update state before making external calls",
                                    "Consider using a reentrancy guard modifier like 'nonReentrant'",
                                ],
                            },
                        ];
                    }
                }
            }
        }

        return [];
    },
};

export const uncheckedCallsRule: SecurityRule = {
    id: "SEC-002",
    name: "Unchecked External Call",
    description:
        "Detects external calls whose return values are not checked, which could lead to silent failures",
    severity: "medium",
    category: "security",

    detect(node: ASTNode, sourceCode: string, filePath: string): Issue[] {
        if (node.type !== "FunctionCall") {
            return [];
        }
        if (!node.expression || node.expression.type !== "MemberAccess") {
            return [];
        }

        const memberAccess = node.expression;
        if (!["call", "send"].includes(memberAccess.memberName)) {
            return [];
        }
        const parent = node.parent;
        if (
            parent &&
            ["IfStatement", "Assignment", "VariableDeclaration"].includes(parent.type)
        ) {
            return [];
        }

        return [
            {
                id: this.id,
                description: `Return value of '${memberAccess.memberName}' is not checked`,
                severity: this.severity,
                location: {
                    line: getNodeLineNumber(node as ASTNodeWithLocation),
                    file: filePath,
                },
                code: getNodeText(node as ASTNodeWithLocation, sourceCode),
                suggestions: [
                    `Check the return value with 'require(succeeded, "Message")' or store it in a variable and verify it`,
                    `For ETH transfers, consider using 'transfer()' instead which automatically reverts on failure`,
                ],
            },
        ];
    },
};

/**
 * Rule that detects use of dangerous Solidity functions
 */
export const dangerousFunctionsRule: SecurityRule = {
    id: "SEC-003",
    name: "Dangerous Function Use",
    description:
        "Detects use of potentially dangerous functions like selfdestruct, delegatecall, or assembly",
    severity: "high",
    category: "security",

    detect(node: ASTNode, sourceCode: string, filePath: string): Issue[] {
        const issues: Issue[] = [];

        // Check for selfdestruct
        if (
            node.type === "FunctionCall" &&
            node.expression &&
            node.expression.type === "Identifier" &&
            node.expression.name === "selfdestruct"
        ) {
            issues.push({
                id: `${this.id}-SELFDESTRUCT`,
                description: "Use of selfdestruct can permanently destroy contracts",
                severity: this.severity,
                location: {
                    line: getNodeLineNumber(node as ASTNodeWithLocation),
                    file: filePath,
                },
                code: getNodeText(node as ASTNodeWithLocation, sourceCode),
                suggestions: [
                    "Consider using a more controlled deactivation mechanism instead of selfdestruct",
                ],
            });
        }

        // Check for delegatecall
        if (
            node.type === "FunctionCall" &&
            node.expression &&
            node.expression.type === "MemberAccess" &&
            node.expression.memberName === "delegatecall"
        ) {
            issues.push({
                id: `${this.id}-DELEGATECALL`,
                description:
                    "Use of delegatecall can lead to context manipulation vulnerabilities",
                severity: this.severity,
                location: {
                    line: getNodeLineNumber(node as ASTNodeWithLocation),
                    file: filePath,
                },
                code: getNodeText(node as ASTNodeWithLocation, sourceCode),
                suggestions: [
                    "Ensure the target of delegatecall is trusted and can't be manipulated by attackers",
                ],
            });
        }

        // Check for assembly
        if (node.type === "InlineAssemblyStatement") {
            issues.push({
                id: `${this.id}-ASSEMBLY`,
                description: "Use of inline assembly bypasses Solidity safety checks",
                severity: "medium",
                location: {
                    line: getNodeLineNumber(node as ASTNodeWithLocation),
                    file: filePath,
                },
                code: getNodeText(node as ASTNodeWithLocation, sourceCode),
                suggestions: [
                    "Try to use high-level Solidity constructs instead of assembly when possible",
                ],
            });
        }

        return issues;
    },
};

/**
 * Rule that detects missing access control on sensitive functions
 */
export const accessControlRule: SecurityRule = {
    id: "SEC-004",
    name: "Missing Access Control",
    description:
        "Detects sensitive functions that lack proper access control mechanisms",
    severity: "high",
    category: "security",

    detect(node: ASTNode, sourceCode: string, filePath: string): Issue[] {
        if (node.type !== "FunctionDefinition") {
            return [];
        }

        const functionNode = node as any;

        // Skip internal/private functions
        if (["internal", "private"].includes(functionNode.visibility)) {
            return [];
        }

        // Sensitive function names
        const sensitiveFunctions = [
            "mint",
            "burn",
            "transferOwnership",
            "changeOwner",
            "lock",
            "unlock",
            "pause",
            "unpause",
            "withdraw",
        ];

        const name = functionNode.name.toLowerCase();
        const isSensitive = sensitiveFunctions.some(
            (sf) => name === sf || name.includes(sf)
        );

        if (!isSensitive) {
            return [];
        }

        // Check for access control modifiers
        const hasOwnerModifier = (functionNode.modifiers || []).some(
            (mod: any) =>
                mod.name?.toLowerCase().includes("owner") ||
                mod.name?.toLowerCase().includes("admin") ||
                mod.name?.toLowerCase() === "onlyowner"
        );

        // Look for msg.sender checks in the function body
        const functionText = getNodeText(
            functionNode as ASTNodeWithLocation,
            sourceCode
        );
        const hasMsgSenderCheck =
            functionText.includes("require") &&
            functionText.includes("msg.sender") &&
            (functionText.includes("owner") || functionText.includes("admin"));

        if (!hasOwnerModifier && !hasMsgSenderCheck) {
            return [
                {
                    id: this.id,
                    description: `Function "${functionNode.name}" lacks proper access control`,
                    severity: this.severity,
                    location: {
                        line: getNodeLineNumber(functionNode as ASTNodeWithLocation),
                        file: filePath,
                    },
                    code: getNodeText(functionNode as ASTNodeWithLocation, sourceCode),
                    suggestions: [
                        "Add access control with onlyOwner modifier",
                        "Add require(msg.sender == owner, 'Not authorized')",
                    ],
                },
            ];
        }

        return [];
    },
};

/**
 * Rule that detects integer overflow/underflow vulnerabilities
 */
export const integerOverflowRule: SecurityRule = {
    id: "SEC-005",
    name: "Integer Overflow/Underflow",
    description:
        "Detects potential integer overflow or underflow vulnerabilities",
    severity: "high",
    category: "security",

    detect(node: ASTNode, sourceCode: string, filePath: string): Issue[] {
        // Only check arithmetic operations
        if (node.type !== "BinaryOperation") {
            return [];
        }

        const binaryOp = node as any;
        if (!["+", "-", "*"].includes(binaryOp.operator)) {
            return [];
        }

        // Check if SafeMath is being used in the file
        const fileContent = sourceCode.toLowerCase();
        const usesSafeMath =
            fileContent.includes("using safemath") ||
            fileContent.includes(
                'import "@openzeppelin/contracts/utils/math/safeMath.sol"'
            );

        // Check if this is Solidity 0.8.0+ which has built-in overflow checking
        const solidity08Check =
            fileContent.includes("pragma solidity ^0.8") ||
            fileContent.includes("pragma solidity >=0.8");

        if (usesSafeMath || solidity08Check) {
            return [];
        }

        // Get the operation text
        const opText = getNodeText(binaryOp as ASTNodeWithLocation, sourceCode);

        return [
            {
                id: this.id,
                description: `Potential integer overflow/underflow in arithmetic operation`,
                severity: this.severity,
                location: {
                    line: getNodeLineNumber(binaryOp as ASTNodeWithLocation),
                    file: filePath,
                },
                code: opText,
                suggestions: [
                    "Use SafeMath library for arithmetic operations",
                    "Upgrade to Solidity 0.8.0+ which has built-in overflow checking",
                    "Add explicit bounds checking before operations",
                ],
            },
        ];
    },
};

/**
 * Rule that detects unprotected SELFDESTRUCT operations
 */
export const unprotectedSelfdestructRule: SecurityRule = {
    id: "SEC-006",
    name: "Unprotected Selfdestruct",
    description:
        "Detects unprotected selfdestruct operations that could be called by anyone",
    severity: "high",
    category: "security",

    detect(node: ASTNode, sourceCode: string, filePath: string): Issue[] {
        // Check for selfdestruct calls
        if (
            node.type !== "FunctionCall" ||
            !node.expression ||
            node.expression.type !== "Identifier" ||
            node.expression.name !== "selfdestruct"
        ) {
            return [];
        }

        // Find containing function
        let currentNode: any = node;
        while (currentNode && currentNode.type !== "FunctionDefinition") {
            currentNode = currentNode.parent;
        }

        if (!currentNode) {
            return [];
        }

        const functionNode = currentNode;

        // Check for access control modifiers
        const hasOwnerModifier = (functionNode.modifiers || []).some(
            (mod: any) =>
                mod.name?.toLowerCase().includes("owner") ||
                mod.name?.toLowerCase().includes("admin") ||
                mod.name?.toLowerCase() === "onlyowner"
        );

        // Look for msg.sender checks in the function
        const functionText = getNodeText(
            functionNode as ASTNodeWithLocation,
            sourceCode
        );
        const hasMsgSenderCheck =
            functionText.includes("require") &&
            functionText.includes("msg.sender") &&
            (functionText.includes("owner") || functionText.includes("admin"));

        if (!hasOwnerModifier && !hasMsgSenderCheck) {
            return [
                {
                    id: this.id,
                    description:
                        "Unprotected selfdestruct - anyone can destroy the contract",
                    severity: this.severity,
                    location: {
                        line: getNodeLineNumber(node as ASTNodeWithLocation),
                        file: filePath,
                    },
                    code: getNodeText(node as ASTNodeWithLocation, sourceCode),
                    suggestions: [
                        "Add access control to protect selfdestruct operation",
                        "Use onlyOwner modifier or require(msg.sender == owner)",
                    ],
                },
            ];
        }

        return [];
    },
};

/**
 * Rule that detects missing input validation for address parameters
 */
export const addressValidationRule: SecurityRule = {
    id: "SEC-007",
    name: "Missing Address Validation",
    description: "Detects missing zero-address validation for address parameters",
    severity: "medium",
    category: "security",

    detect(node: ASTNode, sourceCode: string, filePath: string): Issue[] {
        if (node.type !== "FunctionDefinition") {
            return [];
        }

        const functionNode = node as any;
        const issues: Issue[] = [];

        // Check address parameters
        const parameters = functionNode.parameters?.parameters || [];
        const addressParams = parameters.filter(
            (param: any) => param.typeName?.name === "address"
        );

        if (addressParams.length === 0) {
            return [];
        }

        const functionText = getNodeText(
            functionNode as ASTNodeWithLocation,
            sourceCode
        );

        for (const param of addressParams) {
            const paramName = param.name;

            // Check if there's validation for zero address
            const hasZeroCheck =
                functionText.includes(`${paramName} != address(0)`) ||
                functionText.includes(`${paramName} != 0x0`);

            if (!hasZeroCheck) {
                issues.push({
                    id: this.id,
                    description: `Missing zero address validation for parameter "${paramName}"`,
                    severity: this.severity,
                    location: {
                        line:
                            getNodeLineNumber(param as ASTNodeWithLocation) ||
                            getNodeLineNumber(functionNode as ASTNodeWithLocation),
                        file: filePath,
                    },
                    code: getNodeText(param as ASTNodeWithLocation, sourceCode),
                    suggestions: [
                        `Add require(${paramName} != address(0), "Zero address not allowed")`,
                    ],
                });
            }
        }

        return issues;
    },
};

/**
 * Rule that detects improper ERC20 implementations
 */
export const erc20ImplementationRule: SecurityRule = {
    id: "SEC-008",
    name: "ERC20 Implementation Issues",
    description: "Detects common issues in ERC20 token implementations",
    severity: "high",
    category: "security",

    detect(node: ASTNode, sourceCode: string, filePath: string): Issue[] {
        if (node.type !== "ContractDefinition") {
            return [];
        }

        const contractNode = node as any;
        const issues: Issue[] = [];

        // Check if this is likely an ERC20 token
        const isERC20 =
            sourceCode.includes("ERC20") ||
            sourceCode.includes("IERC20") ||
            sourceCode.includes("function transfer(") ||
            sourceCode.includes("function transferFrom(") ||
            sourceCode.includes("function approve(");

        if (!isERC20) {
            return [];
        }

        // Check for return values in transfer and transferFrom
        if (
            sourceCode.includes("function transfer(address") &&
            !sourceCode.includes("function transfer(address") &&
            !sourceCode.includes("return true") &&
            !sourceCode.includes("return _transfer")
        ) {
            issues.push({
                id: `${this.id}-TRANSFER`,
                description:
                    "ERC20 transfer() function might not return a boolean as required by the standard",
                severity: this.severity,
                location: {
                    line: getNodeLineNumber(contractNode as ASTNodeWithLocation),
                    file: filePath,
                },
                code: "function transfer(...)",
                suggestions: [
                    "Ensure transfer() returns a boolean value as required by the ERC20 standard",
                    "Consider using OpenZeppelin's ERC20 implementation",
                ],
            });
        }

        // Check for approve race condition
        if (sourceCode.includes("function approve(address")) {
            const approveFunction = sourceCode.substring(
                sourceCode.indexOf("function approve(address"),
                sourceCode.indexOf(
                    "}",
                    sourceCode.indexOf("function approve(address")
                ) + 1
            );

            if (
                !approveFunction.includes("require") ||
                !approveFunction.includes("allowance")
            ) {
                issues.push({
                    id: `${this.id}-APPROVE`,
                    description:
                        "ERC20 approve() function might be vulnerable to race conditions",
                    severity: "medium",
                    location: {
                        line: sourceCode
                            .substring(0, sourceCode.indexOf("function approve(address"))
                            .split("\n").length,
                        file: filePath,
                    },
                    code: "function approve(...)",
                    suggestions: [
                        "Consider using increaseAllowance/decreaseAllowance instead of approve",
                        "Add a check to prevent changing a non-zero allowance without setting it to zero first",
                    ],
                });
            }
        }

        return issues;
    },
};

/**
 * Rule that detects tx.origin usage for authentication
 */
export const txOriginAuthRule: SecurityRule = {
    id: "SEC-009",
    name: "tx.origin Authentication",
    description:
        "Detects use of tx.origin for authentication, which is vulnerable to phishing attacks",
    severity: "high",
    category: "security",

    detect(node: ASTNode, sourceCode: string, filePath: string): Issue[] {
        if (node.type !== "MemberAccess") {
            return [];
        }

        const memberAccess = node as any;
        if (
            memberAccess.memberName !== "origin" ||
            !memberAccess.expression ||
            memberAccess.expression.name !== "tx"
        ) {
            return [];
        }

        // Check if it's used in an authentication context
        const nodeText = getNodeText(
            memberAccess as ASTNodeWithLocation,
            sourceCode
        );
        const surroundingText = sourceCode.substring(
            Math.max(0, sourceCode.indexOf(nodeText) - 50),
            Math.min(
                sourceCode.length,
                sourceCode.indexOf(nodeText) + nodeText.length + 50
            )
        );

        if (
            surroundingText.includes("require") ||
            surroundingText.includes("if") ||
            surroundingText.includes("==") ||
            surroundingText.includes("!=")
        ) {
            return [
                {
                    id: this.id,
                    description:
                        "Using tx.origin for authentication is vulnerable to phishing attacks",
                    severity: this.severity,
                    location: {
                        line: getNodeLineNumber(memberAccess as ASTNodeWithLocation),
                        file: filePath,
                    },
                    code: nodeText,
                    suggestions: [
                        "Use msg.sender instead of tx.origin for authentication",
                        "tx.origin refers to the original external account that started the transaction",
                    ],
                },
            ];
        }

        return [];
    },
};

/**
 * Rule that detects timestamp dependence vulnerabilities
 */
export const timestampDependenceRule: SecurityRule = {
    id: "SEC-010",
    name: "Timestamp Dependence",
    description:
        "Detects critical operations that depend on block.timestamp, which can be manipulated by miners",
    severity: "medium",
    category: "security",

    detect(node: ASTNode, sourceCode: string, filePath: string): Issue[] {
        if (node.type !== "MemberAccess") {
            return [];
        }

        const memberAccess = node as any;
        if (
            memberAccess.memberName !== "timestamp" ||
            !memberAccess.expression ||
            memberAccess.expression.name !== "block"
        ) {
            return [];
        }

        // Check if it's used in a critical context
        let currentNode: any = node;
        while (currentNode && currentNode.type !== "FunctionDefinition") {
            // Check if it's used in a condition
            if (
                currentNode.type === "IfStatement" ||
                currentNode.type === "WhileStatement" ||
                currentNode.type === "ForStatement"
            ) {
                return [
                    {
                        id: this.id,
                        description:
                            "Critical operation depends on block.timestamp, which can be manipulated by miners",
                        severity: this.severity,
                        location: {
                            line: getNodeLineNumber(memberAccess as ASTNodeWithLocation),
                            file: filePath,
                        },
                        code: getNodeText(memberAccess as ASTNodeWithLocation, sourceCode),
                        suggestions: [
                            "Avoid using block.timestamp for critical operations",
                            "If timing is needed, consider using block.number as a more reliable source of timing",
                        ],
                    },
                ];
            }

            currentNode = currentNode.parent;
        }

        return [];
    },
};

export const securityRules = [
    reentrancyRule,
    uncheckedCallsRule,
    dangerousFunctionsRule,
    accessControlRule,
    integerOverflowRule,
    unprotectedSelfdestructRule,
    addressValidationRule,
    erc20ImplementationRule,
    txOriginAuthRule,
    timestampDependenceRule,
];
