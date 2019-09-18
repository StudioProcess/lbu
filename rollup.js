// Bundle a JS module using rollup
//   Transpiles with babel
//   Minfies with terser
//   Adds a hash to the bundle
//   Adds the new bundled and hashed entry point to index.html
//   Copies asset folders

const APP_ENTRY = 'app/main.js';
const OUT = 'public';
const INDEX = 'index.html';
const MARKER_START = '<!--MAIN-->';
const MARKER_END = '<!--/MAIN-->';
const COPY_FOLDERS = ['assets', 'data', 'js', 'app'];


const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { execSync, spawnSync } = require('child_process');

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

// Replace text between two markers with a script entry point
function replaceEntry(str, new_entry = 'app/main.js') {
  let regex = new RegExp(`${MARKER_START}(.|[\n\r])*${MARKER_END}`, 'gm');
  let entry = `<script src="${new_entry}"></script>`;
  return str.replace(regex, entry);
}

// Copy folder recursively to the output dir
function copyFolder(folder) {
  const out = path.join(OUT, folder)
  fs.copySync(folder, out);
  console.log(`copied : ${folder} → ${out}`);
}

// Return SHA-1 hash for a file truncated to specified length (len = 0 doesn't truncate)
async function hashFile(filename, len = 0) {
  return new Promise( resolve => {
    let shasum = crypto.createHash('sha1');
    let stream = fs.ReadStream(filename);
    stream.on( 'data', d => shasum.update(d) );
    stream.on( 'end', () => resolve(shasum.digest('hex')) );
  }).then(hash => {
    if (len == 0) return hash;
    return hash.slice(0, len);
  });
}

// Return hashed filename e.g. app/main.js → app/main.19d8d02.js
async function addHash(filename, len = 7) {
  let parts = path.parse(filename);
  let hash = await hashFile(filename, len);
  return path.join( parts.dir, parts.name + '.' + hash + parts.ext );
}

function fileSizeKB(filename) {
  const stats = fs.statSync(filename);
  return Math.ceil(stats.size / 1024);
}



(async function main() {
  
  // delete output folder
  exec(`rm -rf ${OUT}`);
  
  // bundle js (using rollup w/ default config file)
  // app/main.js -> public/app/main.js
  exec(`rollup -c`);
  console.log();
  
  // hash bundle
  const bundle = path.join(OUT, APP_ENTRY);    // public/app/main.js
  const bundle_hashed = await addHash(bundle); // public/app/main._HASH_.js
  fs.moveSync(bundle, bundle_hashed, {overwrite:true}); // rename bundle to include hash
  console.log(`bundled: ${APP_ENTRY} → ${bundle_hashed} (${fileSizeKB(bundle_hashed)} KB)`);
  

  // replace entry point in index.html
  const relative_path = './' + path.relative(OUT, bundle_hashed); // relative path to bundle (from out dir)
  let index = fs.readFileSync(INDEX, {encoding:'utf8'});
  index = replaceEntry(index, relative_path);
  fs.writeFileSync(path.join(OUT, INDEX), index);
  console.log(`index  : ${INDEX} → ${path.join(OUT, INDEX)}`);

  // copy assets
  for (let f of COPY_FOLDERS) copyFolder(f);
  
})();
