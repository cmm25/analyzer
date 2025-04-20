import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import glob from "glob";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { analyze, AnalysisOptions, AnalysisResult } from "./analyzer";
import { generateConsoleReport, generateHtmlReport } from "./reporter";
import { readSolidityFile, writeToFile } from "./utils/fileSystem";
import { parseSolidity, ParserError } from "./parser/solidity"; 

const globPromise = promisify(glob.Glob);

const program = new Command();
program
    .name("solidity-analyzer")
    .description(
        "CLI tool to analyze Solidity smart contracts for security issues and gas optimizations"
    )
    .version("0.1.0");

program
    .command("analyze")
    .description("Analyze Solidity contract files")
    .argument("<files>", "Solidity file(s) to analyze (glob pattern supported)")
    .option("-o, --output <format>", "Output format (console, html)", "console")
    .option(
        "--output-dir <directory>",
        "Directory for output reports",
        "./reports"
    )
    .option("--security-only", "Only check for security issues")
    .option("--gas-only", "Only check for gas optimizations")
    .option("--practices-only", "Only check for best practices")
    .option("--fix", "Try to automatically fix some issues")
    .option("-v, --verbose", "Enable verbose output")
    .action(async (filesPatterns, options) => {
        try {
            console.log(chalk.blue("Solidity Analyzer - Static Analysis Tool"));
            console.log(chalk.blue("========================================="));
            console.log(`Working directory: ${process.cwd()}`);

            const files = await globPromise(filesPatterns);
            if (files.length === 0) {
                console.log(
                    chalk.yellow(`No files matching the pattern: ${filesPatterns}`)
                );
                return;
            }
            
            console.log(chalk.green(`Found ${files.length} Solidity file(s) to analyze`));

            // output directory
            if (options.output === "html") {
                const outputDir = path.resolve(options.outputDir);
                console.log(chalk.blue(`Reports will be saved to: ${outputDir}`));

                if (!fs.existsSync(outputDir)) {
                    console.log(chalk.blue(`Creating output directory: ${outputDir}`));
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                options.outputDir = outputDir;
            }

            // Define the analysis options
            const analysisOptions: AnalysisOptions = {
                security:
                    options.securityOnly || (!options.gasOnly && !options.practicesOnly),
                gas:
                    options.gasOnly || (!options.securityOnly && !options.practicesOnly),
                practices:
                    options.practicesOnly || (!options.securityOnly && !options.gasOnly),
                verbose: options.verbose
            };

            if (options.verbose) {
                console.log(
                    chalk.blue(`Analysis options: ${JSON.stringify(analysisOptions)}`)
                );
            }

            for (const file of files) {
                await processFile(file, analysisOptions, options);
            }
            
            console.log(chalk.green("\nAnalysis complete!"));
            
            if (options.output === "html") {
                console.log(chalk.green(`HTML reports have been saved to: ${options.outputDir}`));
                console.log(chalk.blue("You can open these files in your web browser to view the detailed analysis."));
            }
        } catch (error) {
            console.error(chalk.red(`Error: ${(error as Error).message}`));
            if (options.verbose && (error as Error).stack) {
                console.error(chalk.red((error as Error).stack));
            }
            process.exit(1);
        }
    });

async function processFile(
    filepath: string,
    analysisOption: AnalysisOptions,
    cliOptions: any
): Promise<void> {
    console.log(chalk.cyan(`\nAnalyzing: ${filepath}`));
    
    const spinner = cliOptions.verbose ? null : ora(`Reading and parsing file...`).start();
    
    try {
        // Read file content
        console.log(chalk.dim(`Reading file: ${filepath}`));
        const content = await readSolidityFile(filepath);
        
        // Parse Solidity
        console.log(chalk.dim(`Parsing Solidity code...`));
        const parsedContract = parseSolidity(content);
        const ast = parsedContract.ast;
        
        if (parsedContract.errors.length > 0) {
            if (spinner) spinner.fail(`Parsing errors in ${filepath}`);
            console.error(chalk.red(`Parsing errors in ${filepath}:`));
            
            for (const error of parsedContract.errors) {
                console.error(
                    chalk.red(`  Line ${error.line}:${error.column} - ${error.message}`)
                );
            }
            return;
        }

        // Run analysis
        console.log(chalk.dim(`Running analysis...`));
        if (spinner) spinner.text = `Analyzing file...`;
        
        // Pass the AST, analysis options, filepath, and source code to the analyze function
        const results = await analyze(ast, analysisOption, filepath, content);
        const issueCount = countIssues(results);

        if (spinner) {
            if (issueCount === 0) {
                spinner.succeed(`${filepath}: No issues found`);
            } else {
                spinner.warn(`${filepath}: Found ${issueCount} issues`);
            }
        } else {
            if (issueCount === 0) {
                console.log(chalk.green(`${filepath}: No issues found`));
            } else {
                console.log(chalk.yellow(`${filepath}: Found ${issueCount} issues`));
                
                // Print a summary of issues by type
                if (results.securityIssues.length > 0) {
                    console.log(chalk.red(`  Security issues: ${results.securityIssues.length}`));
                }
                if (results.gasIssues.length > 0) {
                    console.log(chalk.yellow(`  Gas optimization issues: ${results.gasIssues.length}`));
                }
                if (results.practiceIssues.length > 0) {
                    console.log(chalk.blue(`  Best practice issues: ${results.practiceIssues.length}`));
                }
            }
        }

        // Generate reports
        if (cliOptions.output === "console") {
            console.log(chalk.dim(`\nGenerating console report...`));
            if (spinner) spinner.text = `Generating console report...`;
            generateConsoleReport(results, filepath, content);
            if (spinner) spinner.succeed(`Console report generated for ${filepath}`);
        } else if (cliOptions.output === "html") {
            const outputDir = path.resolve(cliOptions.outputDir);
            const outputFileName = `${path.basename(filepath, ".sol")}-report.html`;
            const outputPath = path.join(outputDir, outputFileName);

            console.log(chalk.dim(`\nGenerating HTML report...`));
            if (spinner) spinner.text = `Generating HTML report...`;

            // Ensure directory exists
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
                console.log(chalk.dim(`Created directory: ${outputDir}`));
            }

            await generateHtmlReport(results, filepath, content, outputPath);
            
            console.log(chalk.green(`\n----------------------------------------------`));
            console.log(chalk.green(`HTML REPORT SAVED TO: ${outputPath}`));
            console.log(chalk.green(`----------------------------------------------\n`));
            
            if (spinner) spinner.succeed(`HTML report generated for ${filepath}`);
        }
    } catch (error) {
        if (spinner) {
            spinner.fail(`Error analyzing ${filepath}: ${(error as Error).message}`);
        } else {
            console.error(chalk.red(`Error analyzing ${filepath}: ${(error as Error).message}`));
        }
        
        if (cliOptions.verbose && (error as Error).stack) {
            console.error(chalk.red((error as Error).stack || ""));
        }
    }
}

function countIssues(results: AnalysisResult): number {
    return (
        results.securityIssues.length +
        results.gasIssues.length +
        results.practiceIssues.length
    );
}

function hasFixableIssues(results: AnalysisResult): boolean {
    return [
        ...results.securityIssues,
        ...results.gasIssues,
        ...results.practiceIssues,
    ].some((issue) => issue.canAutoFix);
}

program.parse();
export default function setupCLI() {
    program.parse();
    return program;
}