import { ASTNode } from '../../parser/solidity';
import { ASTNodeWithLocation, getNodeLineNumber, getNodeText } from '../../utils/astUtils';
import { GasIssue, GasRule } from '../../types';

export const packStorageVariablesRule: GasRule = {
    id: "GAS-002",
    name: "Storage Variable Packing",
    description: "Variables can be packed in fewer storage slots for gas optimization",
    severity: "medium",
    category: "gas",
    estimatedGasSaved: "~2000 gas per slot saved",

    detect(node: ASTNode, sourceCode: string, filePath: string): GasIssue[] {
        if (node.type === "ContractDefinition" && node.subNodes) {
            const stateVars = node.subNodes.filter(
                (n: ASTNode) => n.type  === "StateVariableDeclaration"
            );

            for (let i = 0; i < stateVars.length - 1; i++) {
                const currentVar = stateVars[i];
                const nextVar = stateVars[i + 1];

                if (
                    currentVar.variables &&
                    nextVar.variables &&
                    currentVar.variables[0].typeName &&
                    nextVar.variables[0].typeName &&
                    currentVar.variables[0].typeName.name &&
                    nextVar.variables[0].typeName.name
                ) {
                    const currentType = currentVar.variables[0].typeName.name;
                    const nextType = nextVar.variables[0].typeName.name;

                    if (
                        (currentType === "uint8" ||
                            currentType === "uint16" ||
                            currentType === "uint32") &&
                        nextType === "uint256"
                    ) {
                        return [
                            {
                                id: this.id,
                                description:
                                    "Consider rearranging state variables to optimize packing",
                                severity: this.severity,
                                location: {
                                    line: getNodeLineNumber(node as ASTNodeWithLocation),
                                    file: filePath,
                                },
                                code: getNodeText(node as ASTNodeWithLocation, sourceCode),
                                suggestion:
                                    "Group smaller variables together to pack them into single storage slots",
                                gasSaved: this.estimatedGasSaved,
                            },
                        ];
                    }
                }
            }
        }
        return [];
    },
};
