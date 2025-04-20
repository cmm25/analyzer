import { ASTNode, parse } from "./parser/solidity";
import { VulnerabilityAnalyzer, VulnerabilityReport } from "./analyzers/vulnerabilityAnalyzer";
import fs from "fs";
import path from "path";

// Core exports
export { ASTNode } from "./parser/solidity";
export { ASTLocation, ASTNodeWithLocation } from "./utils/astUtils";
export * from "./types";

// Main analysis function export
export { analyze, AnalysisOptions, AnalysisResult } from "./analyzer";

// Analyzer exports
export { SecurityAnalyzer, analyzeSecurity, SecurityAnalysisResult } from "./analyzer/securityAnalyzer";
export { VulnerabilityAnalyzer, VulnerabilityReport } from "./analyzers/vulnerabilityAnalyzer";
export { GasOptimizer, analyzeGas, analyzeGasOptimization, GasAnalysisResult } from "./analyzer/gasOptimizer";
export { CombinedAnalyzer, analyzeCombined, CombinedAnalysisResult } from "./analyzer/combinedAnalyzer";
export { RuleEngine } from "./analyzer/ruleEngine";

// Rules exports
export { securityRules, reentrancyRule, uncheckedCallsRule, dangerousFunctionsRule } from "./rules/securityRules";
export { gasRules, explicitUint256Rule, packStorageVariablesRule, preIncrementRule } from "./rules/gas";

// Reporter exports
export { generateConsoleReport } from "./reporter/console";
export { generateHtmlReport } from "./reporter/html";

// Utilities
export * from "./utils/astUtils";
export * from "./utils/vulnerabilityUtils";
export { calculateGasStats } from "./utils/gasStatsCalculator";
export { readSolidityFile, writeToFile } from "./utils/fileSystem";
export { parseSolidity } from "./parser/solidity";

// Export the CLI setup
export { default as setupCLI } from "./cli";

/**
 * Analyzes a Solidity AST for vulnerabilities
 * @param ast The Solidity AST to analyze
 * @param sourceCode Original source code
 * @param filePath Path to the source file
 * @returns Vulnerability report
 */
export function analyzeSolidity(ast: ASTNode, sourceCode: string, filePath: string): VulnerabilityReport {
    const analyzer = new VulnerabilityAnalyzer(ast, sourceCode, filePath);
    return analyzer.analyze();
}

/**
 * Analyzes a Solidity file for vulnerabilities
 * @param filePath Path to the Solidity file
 * @returns Analysis report
 */
export async function analyzeSolidityFile(filePath: string): Promise<VulnerabilityReport> {
    try {
        // Read the source code from the file
        const sourceCode = fs.readFileSync(filePath, 'utf8');

        // Parse the source code to get an AST
        const ast = parse(sourceCode);

        // Create an instance of VulnerabilityAnalyzer with the required parameters
        const analyzer = new VulnerabilityAnalyzer(ast, sourceCode, filePath);

        // Call the analyze method without parameters as defined in the class
        return analyzer.analyze();
    } catch (error) {
        console.error(`Error analyzing file ${filePath}:`, error);
        throw error;
    }
}

/**
 * Analyze multiple Solidity files in a directory
 * @param directoryPath Directory containing Solidity files
 * @returns Array of analysis reports
 */
export async function analyzeSolidityDirectory(directoryPath: string): Promise<VulnerabilityReport[]> {
    try {
        const files = fs.readdirSync(directoryPath)
            .filter(file => file.endsWith('.sol'))
            .map(file => path.join(directoryPath, file));

        const results = [];
        for (const file of files) {
            results.push(await analyzeSolidityFile(file));
        }

        return results;
    } catch (error) {
        console.error(`Error analyzing directory ${directoryPath}:`, error);
        throw error;
    }
}

// If the file is executed directly, provide a simple CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Please provide a file or directory path');
        process.exit(1);
    }

    const targetPath = args[0];

    if (fs.existsSync(targetPath)) {
        if (fs.lstatSync(targetPath).isDirectory()) {
            analyzeSolidityDirectory(targetPath)
                .then(results => console.log(JSON.stringify(results, null, 2)))
                .catch(err => {
                    console.error('Analysis failed:', err);
                    process.exit(1);
                });
        } else {
            analyzeSolidityFile(targetPath)
                .then(result => console.log(JSON.stringify(result, null, 2)))
                .catch(err => {
                    console.error('Analysis failed:', err);
                    process.exit(1);
                });
        }
    } else {
        console.error(`Path does not exist: ${targetPath}`);
        process.exit(1);
    }
}
