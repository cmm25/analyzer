import fs from 'fs/promises';
import path from 'path';

export async function readSolidityFile(filePath: string): Promise<string> {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return content;
    } catch (error:unknown) {
        throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`);
    }
}

export async function writeToFile(filePath: string, content: string): Promise<void> {
    try {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });

        await fs.writeFile(filePath, content, 'utf8');
    } catch (error:unknown) {
        throw new Error(`Failed to write file ${filePath}: ${(error as Error).message}`);
    }
}