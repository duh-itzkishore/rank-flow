const fs = require('fs');
const path = require('path');
const routesDir = path.join(__dirname, 'src', 'routes');
const files = fs.readdirSync(routesDir);

files.forEach(f => {
  if (f.includes('$projectId')) {
    const p = path.join(routesDir, f);
    let c = fs.readFileSync(p, 'utf-8');
    c = c.replace(/createFileRoute\(['"`]\/app\/([a-zA-Z0-9\-]+)['"`]\)/g, 'createFileRoute("/app/$projectId/$1")');
    fs.writeFileSync(p, c);
  }
});
console.log('Done');
