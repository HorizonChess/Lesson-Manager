const fs = require('fs');
const path = require('path');

// Read the HTML file
const htmlPath = path.join(__dirname, '..', 'dist', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf-8');

// Extract head and body
const headMatch = html.match(/<head>([\s\S]*?)<\/head>/);
const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);

if (!headMatch || !bodyMatch) {
  throw new Error('Could not parse HTML structure');
}

let head = headMatch[1];
const body = bodyMatch[1];

// Read and inline CSS
const cssMatch = head.match(/href="\/assets\/(index-[^"]+\.css)"/);
if (cssMatch) {
  const cssPath = path.join(__dirname, '..', 'dist', 'assets', cssMatch[1]);
  const css = fs.readFileSync(cssPath, 'utf-8');
  head = head.replace(
    /<link[^>]+href="\/assets\/[^"]+\.css"[^>]*>/,
    `<style>${css}</style>`
  );
}

// Read and inline JS
const jsMatch = head.match(/src="\/assets\/(index-[^"]+\.js)"/);
if (jsMatch) {
  const jsPath = path.join(__dirname, '..', 'dist', 'assets', jsMatch[1]);
  const js = fs.readFileSync(jsPath, 'utf-8');
  head = head.replace(
    /<script[^>]+src="\/assets\/[^"]+\.js"[^>]*><\/script>/,
    `<script type="module">${js}</script>`
  );
}

// Update title in head
head = head.replace(
  /<title>[^<]*<\/title>/,
  '<title>Lesson Manager</title>'
);

// Remove icon link from head
head = head.replace(/<link[^>]+rel="icon"[^>]*>/, '');

// Reconstruct the full HTML
const finalHtml = `<!doctype html>
<html lang="en">
  <head>${head}
  </head>
  <body>${body}
  </body>
</html>`;

// Write the single file
const outputPath = path.join(__dirname, '..', 'lesson-manager-standalone.html');
fs.writeFileSync(outputPath, finalHtml, 'utf-8');

console.log(`✓ Single file created: ${outputPath}`);
console.log(`✓ File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
