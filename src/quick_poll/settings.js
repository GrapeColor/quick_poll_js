const fs = require('fs');

class Settings {
  constructor(filePath) {
    Object.assign(this, JSON.parse(fs.readFileSync(filePath)));
  }
}

module.exports = Settings;
