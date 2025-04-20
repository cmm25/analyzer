import fs from 'fs/promises';
import path from 'path';

export async function readSolidityFile(filePath: string): Promise<string> {
    try {
        console.log(`Reading file: ${filePath}`);
        const content = await fs.readFile(filePath, 'utf8');
        return content;
    } catch (error: unknown) {
        throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`);
    }
}

export async function writeToFile(filePath: string, content: string): Promise<void> {
    try {
        console.log(`Writing to file: ${filePath}`);
        const dir = path.dirname(filePath);
        
        // Check if directory exists
        try {
            await fs.access(dir);
            console.log(`Directory exists: ${dir}`);
        } catch (error) {
            console.log(`Creating directory: ${dir}`);
            await fs.mkdir(dir, { recursive: true });
        }
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`Successfully wrote to file: ${filePath}`);
    } catch (error: unknown) {
        console.error(`Error writing to file: ${(error as Error).message}`);
        throw new Error(`Failed to write file ${filePath}: ${(error as Error).message}`);
    }
}