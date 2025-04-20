import { Issue } from './common';

export interface GasIssue extends Issue {
    gasSaved?: string;
    estimatedGasSavings?: number;
    type?: string;
    fix?: () => string;
    explanation?: string;
}
