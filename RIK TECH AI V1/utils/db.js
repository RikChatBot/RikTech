const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

function readJSON(filename, defaultValue) {
  const fp = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(fp)) {
      fs.writeFileSync(fp, JSON.stringify(defaultValue || {}));
      return defaultValue || {};
    }
    const raw = fs.readFileSync(fp, 'utf8');
    return JSON.parse(raw || 'null') || (defaultValue || {});
  } catch (e) {
    console.error('readJSON error', e);
    return defaultValue || {};
  }
}

function writeJSON(filename, obj) {
  const fp = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(fp, JSON.stringify(obj, null, 2));
    return true;
  } catch (e) {
    console.error('writeJSON error', e);
    return false;
  }
}

module.exports = { readJSON, writeJSON };
