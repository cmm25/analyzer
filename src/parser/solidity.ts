import parser, {ParserError as SolidityParserError} from '@solidity-parser/parser';
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
}

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
