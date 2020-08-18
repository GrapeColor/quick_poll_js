'use strict';

const Base = require('./base')

class Command extends Base {
  static events(bot) {
    bot.on('message', message => {
      
    });
  }
}

module.exports = Command;
