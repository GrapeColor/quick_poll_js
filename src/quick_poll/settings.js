const fs = require('fs');

class Settings {
  static load(filePath = __dirname + '\\settings.json') {
    Object.assign(this, JSON.parse(fs.readFileSync(filePath)));
  }
}

module.exports = Settings;
