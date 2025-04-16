import { SecurityRule } from "./rules";
import { ASTNode } from "../parser/solidity";
import { GasIssue } from "./gasIssue";

export interface GasRule extends SecurityRule {
    severity: "high" | "medium" | "low" | "info";
    category: string;
    estimatedGasSaved?: string;
    detect(node: ASTNode, sourceCode: string, filePath: string): GasIssue[];
}
