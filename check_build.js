const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, 'dist');
const srcDir = path.join(__dirname, 'src');

function getNewestFileTime(dir) {
    let newest = 0;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            const subdirNewest = getNewestFileTime(filePath);
            if (subdirNewest > newest) newest = subdirNewest;
        } else {
            if (stat.mtimeMs > newest) newest = stat.mtimeMs;
        }
    }
    return newest;
}

try {
    if (!fs.existsSync(distDir)) {
        console.log('Dist missing');
        process.exit(1); // Need rebuild
    }

    const lastBuildTime = fs.statSync(distDir).mtimeMs;
    const lastCodeChange = getNewestFileTime(srcDir);

    if (lastCodeChange > lastBuildTime) {
        console.log('Code changed');
        process.exit(1); // Need rebuild
    }

    console.log('Up to date');
    process.exit(0); // No rebuild needed
} catch (e) {
    process.exit(1);
}
