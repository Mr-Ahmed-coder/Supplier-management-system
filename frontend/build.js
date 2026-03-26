const fs = require('fs');
const path = require('path');

const sourceDir = __dirname;
const buildDir = path.join(__dirname, 'build');

if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
}

// Copy all files excluding build and node_modules
const files = fs.readdirSync(sourceDir);
for (const file of files) {
    if (file === 'build' || file === 'node_modules' || file === 'package.json' || file === 'build.js') continue;

    const src = path.join(sourceDir, file);
    const dest = path.join(buildDir, file);

    fs.cpSync(src, dest, { recursive: true });
}

    // Removed dangerous string replacement logic that previously injected process.env.API_URL into the monolithic build
    console.log("Skipping dynamic API_URL injection. The static system natively relies on /api routing.");

console.log('Frontend built successfully in /build with API_URL: ' + (process.env.API_URL || '/api'));
