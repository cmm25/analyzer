import parser, {ParserError} from '@solidity-parser/parser';

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
            return {
                ast: { type: 'error' },
                errors: [error]
            };
        }
        throw error;
    }
}