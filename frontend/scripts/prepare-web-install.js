const fs = require('fs');
const path = require('path');

const frontendDirectory = path.resolve(__dirname, '..');
const outputDirectory = path.join(frontendDirectory, 'dist');
const indexPath = path.join(outputDirectory, 'index.html');
const manifestSource = path.join(frontendDirectory, 'public', 'manifest.json');
const iconSource = path.join(frontendDirectory, 'assets');
const iconOutput = path.join(outputDirectory, 'icons');

if (!fs.existsSync(indexPath)) {
  throw new Error(`Expo web export did not create ${indexPath}`);
}

const indexHtml = fs.readFileSync(indexPath, 'utf8');
if (!indexHtml.includes('rel="manifest"')) {
  fs.writeFileSync(
    indexPath,
    indexHtml.replace('</head>', '  <link rel="manifest" href="/manifest.json" />\n  </head>')
  );
}

fs.copyFileSync(manifestSource, path.join(outputDirectory, 'manifest.json'));
fs.mkdirSync(iconOutput, { recursive: true });
for (const size of [192, 512]) {
  fs.copyFileSync(
    path.join(iconSource, `ketero-${size}.png`),
    path.join(iconOutput, `ketero-${size}.png`)
  );
}
