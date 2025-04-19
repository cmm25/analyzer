import { ASTNode } from '../../parser/solidity';
import { GasIssue, GasRule } from '../../types';

export const explicitUint256Rule: GasRule = {
  id: "GAS-001",
  name: "Explicit uint256 is redundant", 
  description: "Using `uint256` is redundant as it's the default type for `uint`",
  severity: "low",
  category: "gas",
  
  detect(node: ASTNode, sourceCode: string, filePath: string): GasIssue[] {
    const issues: GasIssue[] = [];
    if (node.type === "ElementaryTypeName" && node.name === "uint256") {
      issues.push({
        id: this.id,
        description: this.description,
        message: "Use `uint` instead of `uint256` to save gas", 
        severity: this.severity,
        filePath,
        line: node.loc?.start.line,
        column: node.loc?.start.column,
        location: node.loc ? {
          start: { line: node.loc.start.line, column: node.loc.start.column },
          end: { line: node.loc.end.line, column: node.loc.end.column }
        } : undefined,
        code: sourceCode.substring(  
          node.range[0], 
          node.range[1]
        ),
        suggestions: [
          "Use `uint` instead of `uint256` to save gas",
          "uint is an alias for uint256 and uses less bytecode"
        ],
        estimatedGasSavings: 3,
      });
    }
    return issues;
  }
};