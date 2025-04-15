import { Issue } from "./rules";

export interface GasIssue extends Issue {
    gasSaved?: string;
}
