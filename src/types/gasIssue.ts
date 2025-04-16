import { Issue } from "./rules";

export interface GasIssue extends Issue {
    filePath: string;
    gasSaved?: string;
    location?: {
        start: { line: number; column: number; };
        end: { line: number; column: number; };
    };
    explanation?: string;
}
