import { SecurityRule } from "./rules";
import { ASTNode } from "../parser/solidity";
import { GasIssue } from "./gasIssue";

export interface GasRule extends Omit<SecurityRule, 'detect'> {
    title?: string;
    estimatedGasSaved?: string;
    detect(node: ASTNode, sourceCode: string, filePath: string): GasIssue[];
}
