import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import glob from 'glob';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { analyze, AnalysisOptions, AnalysisResult } from './analyzer';
import { generateConsoleReport, generateHtmlReport } from './reporter';
import { readSolidityFile, writeToFile } from './utils/fileSystem';
import { parseSolidity, ParserError } from './parser/solidity'; // Import ParserError type

const globPromise = promisify(glob.Glob);

const program = new Command();
program
    .name('solidity-analyzer')
    .description('CLI tool to analyze Solidity smart contracts for security issues and gas optimizations')
    .version('0.1.0');

program
    .command('analyze')
    .description('Analyze Solidity contract files')
    .argument('<files>', 'Solidity file(s) to analyze (glob pattern supported)')
    .option('-o, --output <format>', 'Output format (console, html)', 'console')
    .option('--output-dir <directory>', 'Directory for output reports', './reports')
    .option('--security-only', 'Only check for security issues')
    .option('--gas-only', 'Only check for gas optimizations')
    .option('--practices-only', 'Only check for best practices')
    .option('--fix', 'Try to automatically fix some issues')
    .action(async (filesPatterns, options) => {
        try {
            const files = await globPromise(filesPatterns)
            if (files.length === 0) {
                console.log(chalk.yellow(`No files matching the pattern: ${filesPatterns}`))
                return
            }
            console.log(chalk.blue(`Found ${files.length} Solidity files to analyze`))

            // output directory
            if (options.output === 'html') {
                if (!fs.existsSync(options.outputDir)) {
                    fs.mkdirSync(options.outputDir, { recursive: true });
                }
            }
            
            // Define the analysis options
            const analysisOptions: AnalysisOptions = {
                security: options.securityOnly || (!options.gasOnly && !options.practicesOnly),
                gas: options.gasOnly || (!options.securityOnly && !options.practicesOnly),
                practices: options.practicesOnly || (!options.securityOnly && !options.gasOnly)
            };
            for (const file of files) {
                await processFile(file, analysisOptions, options)
            }
            console.log(chalk.green('\nAnalysis complete!'));
        } catch (error) {
            console.error(chalk.red(`Error: ${(error as Error).message}`))
            process.exit(1)
        }
    });

async function processFile(filepath: string, analysisOption: AnalysisOptions, cliOptions: any): Promise<void> {
    const spinner = ora(`Analyzing ${filepath}...`).start()
    try {
        const content = await readSolidityFile(filepath)
        const parsedContract = parseSolidity(content);
        const ast = parsedContract.ast;
        if (parsedContract.errors.length > 0) {
            spinner.fail(`Parsing errors in ${filepath}`);
            for (const error of parsedContract.errors) {
                console.error(chalk.red(`  Line ${error.line}:${error.column} - ${error.message}`));
            }
            return;
        }
        
        // Pass the AST, analysis options, and filepath to the analyze functiont
        const results = await analyze(ast, analysisOption, filepath);
        const issueCount = countIssues(results)

        if (issueCount === 0) {
            spinner.succeed(`${filepath}: No issues found`);
        } else {
            spinner.warn(`${filepath}: Found ${issueCount} issues`);
        }
        // Report
        if (cliOptions.output === 'console') {
            generateConsoleReport(results, filepath, content);
        } else if (cliOptions.output === 'html') {
            const outputPath = path.join(cliOptions.outputDir, `${path.basename(filepath, '.sol')}-report.html`);
            await generateHtmlReport(results, filepath, content, outputPath);
            console.log(chalk.green(`  HTML report saved to: ${outputPath}`));
        }
    }

    catch (error) {
        spinner.fail(`Error analyzing ${filepath}: ${(error as Error).message}`);
    }
}
function countIssues(results: AnalysisResult): number {
    return results.securityIssues.length + results.gasIssues.length + results.practiceIssues.length;
}

function hasFixableIssues(results: AnalysisResult): boolean {
    return [...results.securityIssues, ...results.gasIssues, ...results.practiceIssues]
        .some(issue => issue.canAutoFix);
}

program.parse()
