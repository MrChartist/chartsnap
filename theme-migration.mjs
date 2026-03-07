import fs from 'fs/promises';
import path from 'path';

const REPLACEMENTS = [
    // Backgrounds
    { search: /bg-\[#0d1117\]/g, replace: 'bg-white dark:bg-[#0d1117]' },
    { search: /bg-\[#0A0D14\]/g, replace: 'bg-gray-50 dark:bg-[#0A0D14]' },
    { search: /bg-white\/5/g, replace: 'bg-black/5 dark:bg-white/5' },
    { search: /bg-white\/\[0\.02\]/g, replace: 'bg-black/[0.02] dark:bg-white/[0.02]' },
    { search: /bg-white\/\[0\.03\]/g, replace: 'bg-black/[0.03] dark:bg-white/[0.03]' },
    { search: /bg-white\/\[0\.04\]/g, replace: 'bg-black/[0.04] dark:bg-white/[0.04]' },
    { search: /bg-white\/10/g, replace: 'bg-black/10 dark:bg-white/10' },
    { search: /bg-white\/20/g, replace: 'bg-black/20 dark:bg-white/20' },
    { search: /hover:bg-white\/5/g, replace: 'hover:bg-black/5 dark:hover:bg-white/5' },
    { search: /hover:bg-white\/10/g, replace: 'hover:bg-black/10 dark:hover:bg-white/10' },

    // Text
    { search: /(?<!dark:)text-white/g, replace: 'text-gray-900 dark:text-white' },
    { search: /(?<!dark:)hover:text-white/g, replace: 'hover:text-gray-900 dark:hover:text-white' },
    { search: /(?<!dark:)text-gray-400/g, replace: 'text-gray-600 dark:text-gray-400' },
    { search: /(?<!dark:)text-gray-300/g, replace: 'text-gray-700 dark:text-gray-300' },
    { search: /(?<!dark:)text-gray-500/g, replace: 'text-gray-500 dark:text-gray-500' }, // Just to be safe, sometimes we want this

    // Borders
    { search: /(?<!dark:)border-white\/10/g, replace: 'border-gray-200 dark:border-white/10' },
    { search: /(?<!dark:)border-white\/20/g, replace: 'border-gray-300 dark:border-white/20' },

    // Special
    { search: /bg-black\/40/g, replace: 'bg-gray-100 dark:bg-black/40' },
    { search: /bg-background\/60/g, replace: 'bg-white/80 dark:bg-background/60' },
    { search: /bg-background\/95/g, replace: 'bg-white/95 dark:bg-background/95' },
];

async function processFile(filePath) {
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;

    for (const { search, replace } of REPLACEMENTS) {
        if (content.match(search)) {
            content = content.replace(search, replace);
            modified = true;
        }
    }

    if (modified) {
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

async function walk(dir) {
    const list = await fs.readdir(dir);
    for (const file of list) {
        const fullPath = path.resolve(dir, file);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
            await walk(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            // Skip Navbar/App as we already did them
            if (fullPath.includes('Navbar.jsx') || fullPath.includes('App.jsx')) continue;
            await processFile(fullPath);
        }
    }
}

const targetDir = path.resolve('/Users/mrchartist/.gemini/antigravity/scratch/PixelTrade_Brainstorm/frontend-react/src');
walk(targetDir).catch(console.error);
