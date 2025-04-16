/**
 * Base interface for all types of issues found during analysis
 */
export interface Issue {
  /**
   * Unique identifier for the issue
   */
  id: string;

  /**
   * Display title of the issue
   */
  title: string;

  /**
   * Detailed description of the issue
   */
  description: string;

  /**
   * Severity level of the issue
   */
  severity: "high" | "medium" | "low" | "info";

  /**
   * Line number where the issue was found
   */
  line?: number;

  /**
   * Column number where the issue was found
   */
  column?: number;

  /**
   * Code snippet where the issue was found
   */
  codeSnippet?: string;

  /**
   * Array of suggestions to fix the issue
   */
  suggestions?: string[];

  /**
   * Whether the issue can be automatically fixed
   */
  canAutoFix?: boolean;

  /**
   * Function to fix the issue automatically
   */
  fix?: () => string;
}
