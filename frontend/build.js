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

// Inject API_URL into auth.js
const authPath = path.join(buildDir, 'auth.js');
if (fs.existsSync(authPath)) {
    let authCode = fs.readFileSync(authPath, 'utf8');

    // Default to relative /api if API_URL env is not provided (e.g. local unified testing)
    const apiUrl = process.env.API_URL || '/api';

    // Simple replacement of the exact string
    authCode = authCode.replace("let API_URL = '/api';", `let API_URL = '${apiUrl}';`);

    fs.writeFileSync(authPath, authCode);
}

console.log('Frontend built successfully in /build with API_URL: ' + (process.env.API_URL || '/api'));
