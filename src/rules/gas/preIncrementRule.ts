import { ASTNode } from '../../parser/solidity';
import { ASTNodeWithLocation, getNodeLineNumber, getNodeText } from '../../utils/astUtils';
import { GasIssue, GasRule } from '../../types';

export const preIncrementRule: GasRule = {
    id: "GAS-003",
    name: "Pre-increment Usage",
    description: "Using ++i instead of i++ saves gas",
    severity: "low",
    category: "gas",
    estimatedGasSaved: "~5 gas per operation",

    detect(node: ASTNode, sourceCode: string, filePath: string): GasIssue[] {
        if (
            node.type === "UnaryOperation" &&
            node.operator === "++" &&
            node.isPrefix === false
        ) {
            return [
                {
                    id: this.id,
                    description: "Use ++i instead of i++ to save gas",
                    severity: this.severity,
                    location: {
                        line: getNodeLineNumber(node as ASTNodeWithLocation),
                        file: filePath,
                    },
                    code: getNodeText(node as ASTNodeWithLocation, sourceCode),
                    suggestion: "Replace i++ with ++i",
                    gasSaved: this.estimatedGasSaved,
                },
            ];
        }

        return [];
    },
};
