const fs = require('fs');

module.exports = class Settings {
  constructor(filePath) {
    Object.assign(this, JSON.parse(fs.readFileSync(filePath)));
  }
}
