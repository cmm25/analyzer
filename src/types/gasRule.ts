import { SecurityRule } from "./rules";

export interface GasRule extends SecurityRule {
    estimatedGasSaved?: string;
}
