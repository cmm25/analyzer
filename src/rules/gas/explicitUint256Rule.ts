import { ASTNode } from '../../parser/solidity';
import { ASTNodeWithLocation, getNodeLineNumber, getNodeText } from '../../utils/astUtils';
import { GasIssue, GasRule } from '../../types';

export const explicitUint256Rule: GasRule = {
  id: "GAS-001",
  name: "Explicit uint256 Usage",
  description: "Using uint is more gas efficient than uint256",
  severity: "low",
  category: "gas",
  estimatedGasSaved: "~3-5 gas per usage",

  detect(node: ASTNode, sourceCode: string, filePath: string): GasIssue[] {
    if (node.type === "ElementaryTypeName" && node.name === "uint256") {
      return [
        {
          id: this.id,
          description: "Use uint instead of uint256 for better gas efficiency",
          severity: this.severity,
          location: {
            line: getNodeLineNumber(node as ASTNodeWithLocation),
            file: filePath,
          },
          code: getNodeText(node as ASTNodeWithLocation, sourceCode),
          suggestion: "Replace uint256 with uint",
          gasSaved: this.estimatedGasSaved,
        },
      ];
    }
    return [];
  },
};
