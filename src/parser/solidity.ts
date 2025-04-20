import * as parser from '@solidity-parser/parser';
import { ParserError as SolidityParserError } from '@solidity-parser/parser';

export interface ParserError extends SolidityParserError {
    line: number;
    column: number;
    message: string;
}

export interface ASTNode {
    type: string;
    name?: string;
    body?: ASTNode[];
    [key: string]: any;
}

export interface ParsedContract {
    ast: ASTNode;
    errors: ParserError[];
    metadata?: {
        filePath?: string;
        contractCount: number;
        functionCount: number;
        hasImports: boolean;
    };
}

/**
 * Parse Solidity source code into an Abstract Syntax Tree (AST)
 * @param source The Solidity source code to parse
 * @returns The parsed contract with AST and any errors
 */
export function parseSolidity(source: string): ParsedContract {
    try {
        const ast = parser.parse(source, { loc: true, range: true });
        return { ast, errors: [] };
    } catch (error) {
        if (error instanceof parser.ParserError) {
            // Cast to our extended ParserError type
            return {
                ast: { type: 'error' },
                errors: [error as unknown as ParserError]
            };
        }
        throw error;
    }
}

/**
 * Parse Solidity source code and returns AST with additional metadata
 * @param source The Solidity source code to parse
 * @param filePath Optional path to the source file (for error reporting)
 * @returns Enhanced parsed contract with metadata
 */
/**
 * Simpler parse function that just returns the AST
 * @param source The Solidity source code to parse
 * @returns The AST
 */
export function parse(source: string): ASTNode {
    const result = parseSolidity(source);
    if (result.errors.length > 0) {
        throw new Error(`Parse error: ${result.errors[0].message}`);
    }
    return result.ast;
}

/**
 * Parse Solidity source code and returns AST with additional metadata
 * @param source The Solidity source code to parse
 * @param filePath Optional path to the source file (for error reporting)
 * @returns Enhanced parsed contract with metadata
 */
export function parseSolidityWithMetadata(source: string, filePath?: string): ParsedContract {
    const result = parseSolidity(source);
    
    if (result.errors.length > 0) {
        return result;
    }
    
    // Extract basic metadata about the contract
    const metadata = {
        filePath: filePath || "unknown",
        contractCount: 0,
        functionCount: 0,
        hasImports: false
    };
    
    // Simple visitor to count contracts and functions
    const visit = (node: any) => {
        if (node.type === "ContractDefinition") {
            metadata.contractCount++;
        } else if (node.type === "FunctionDefinition") {
            metadata.functionCount++;
        } else if (node.type === "ImportDirective") {
            metadata.hasImports = true;
        }
        
        for (const key in node) {
            if (node[key] && typeof node[key] === "object") {
                if (Array.isArray(node[key])) {
                    node[key].forEach((item: any) => {
                        if (item && typeof item === "object") {
                            visit(item);
                        }
                    });
                } else {
                    visit(node[key]);
                }
            }
        }
    };
    
    visit(result.ast);
    result.metadata = metadata;
    
    return result;
}
