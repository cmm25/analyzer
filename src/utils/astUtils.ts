import { ASTNode } from '../parser/solidity';

export interface ASTLocation {
    line: number;
    column: number;
}

export interface ASTNodeWithLocation extends ASTNode {
    loc?: {
        start: ASTLocation;
        end: ASTLocation;
    };
    range?: [number, number];
}
export function findNodes(ast: ASTNode, type: string): ASTNode[] {
    const nodes: ASTNode[] = [];
    
    function traverse(node: ASTNode) {
        if (!node) return;        
        if (node.type === type) {
            nodes.push(node);
        }
        for (const key in node) {
            if (typeof node[key] === 'object' && node[key] !== null) {
                if (Array.isArray(node[key])) {
                    node[key].forEach(traverse);
                } else {
                    traverse(node[key]);
                }
            }
        }
    }
    
    traverse(ast);
    return nodes;
}
export function findContracts(ast: ASTNode): ASTNode[] {
    return findNodes(ast, 'ContractDefinition');
}

export function findFunctions(ast: ASTNode): ASTNode[] {
    return findNodes(ast, 'FunctionDefinition');
}
export function findStateVariables(ast: ASTNode): ASTNode[] {
    const contracts = findContracts(ast);
    let stateVars: ASTNode[] = [];
    
    for (const contract of contracts) {
        if (contract.subNodes) {
            const vars = contract.subNodes.filter(
                (node: ASTNode) => node.type === 'StateVariableDeclaration'
            );
            stateVars = [...stateVars, ...vars];
        }
    }
    
    return stateVars;
}
export function nodeContains(node: ASTNode, type: string): boolean {
    let found = false;
    
    function traverse(subNode: ASTNode) {
        if (!subNode || found) return;
        
        if (subNode.type === type) {
            found = true;
            return;
        }
        for (const key in subNode) {
            if (typeof subNode[key] === 'object' && subNode[key] !== null && !found) {
                if (Array.isArray(subNode[key])) {
                    subNode[key].forEach(traverse);
                } else {
                    traverse(subNode[key]);
                }
            }
        }
    }
    
    traverse(node);
    return found;
}
export function getNodeLineNumber(node: ASTNodeWithLocation): number | null {
    if (node.loc && node.loc.start) {
        return node.loc.start.line;
    }
    return null;
}
export function getNodeText(node: ASTNodeWithLocation, source: string): string {
    if (node.loc && node.range) {
        return source.substring(node.range[0], node.range[1]);
    }
    return '';
}
export function getNodeModifiers(node: ASTNode): string[] {
    const modifiers: string[] = [];
    
    if (node.type === 'FunctionDefinition') {
        if (node.visibility) {
            modifiers.push(node.visibility);
        }
        
        if (node.stateMutability) {
            modifiers.push(node.stateMutability);
        }
        
        if (node.modifiers) {
            node.modifiers.forEach((mod: any) => {
                if (mod.name) {
                    modifiers.push(mod.name);
                }
            });
        }
    }
    
    return modifiers;
}