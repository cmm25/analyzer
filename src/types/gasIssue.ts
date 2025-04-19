import { Issue } from './rules';

export interface GasIssue extends Omit<Issue, 'location'> {
    filePath: string;
    gasSaved?: string;
    location?: {
        line: number | null;
        file: string;
    } | {
        start: { line: number; column: number; };
        end: { line: number; column: number; };
        line?: number | null;  
        file?: string;        
    };
    explanation?: string;
}