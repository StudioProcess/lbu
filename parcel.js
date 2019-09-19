// build for production
// uses parcel-bundler
// adds a small fix to bundled index.html. See: https://github.com/parcel-bundler/parcel/issues/1401#issuecomment-477869363

const { execSync } = require('child_process');
const fs = require('fs-extra');

// Execute a command
function exec(cmd, continueOnFailure = false) {
  let result;
  try {
    result = execSync(cmd, {stdio: 'inherit'}); // 'inherit' forwards all IO to the console as it happens, preserving coloring etc.
  } catch (err) { // process times out or has non-zero exit code
    if (continueOnFailure) {
      console.warn(err); // just log the error
    } else {
      throw err;
    }
  }
  return result;
}

// clean build dir
exec(`rm -rf dist`);

// run parcel
exec(`npx parcel build index.html`);

// remove type="module" from script tag in bundled html
const INDEX_FILE = './dist/index.html';
let index = fs.readFileSync(INDEX_FILE, {encoding:'utf8'});
index = index.replace('script type="module"', 'script');
fs.writeFileSync(INDEX_FILE, index);

// copy robots.txt if it's there
try {
  fs.copySync('./robots.txt', './dist/robots.txt')
  console.log('WARNING: Copied robots.txt. REMOVE ROBOTS.TXT IN PRODUCTION TO ALLOW INDEXING!');
} catch (err) {
  // nop
}
