'use strict';

const constants = require('./constants');

class Command {
  static commands = {};
  static commandEvents = [];
  static guildPrefixes = {};

  static waitQueues = {};

  static events(bot) {
    bot.once('ready', () => {
      bot.guilds.cache.each(guild => this.updatePrefix(guild));
    });

    bot.on('guildMemberUpdate', (_, member) => {
      if (member === member.guild.me) this.updatePrefix(member.guild);
    });

    bot.on('message', message => {
      const commandData = this.parse(message);
      if (!commandData) {
        message.channel.messages.cache.delete(message.id);
        return;
      }

      this.waitQueues[message.id] = new this(commandData);
    });

    for (const events of this.commandEvents) events(bot);
  }

  static CUSTOM_PREFIX_REGEX = /\[([!-~]{1,4}?)\]/;
  static DEFAULT_PREFIX = '/';
  static updatePrefix(guild) {
    const match = guild.me.nickname?.match(this.CUSTOM_PREFIX_REGEX);
    this.guildPrefixes[guild.id] = match ? match[1] : this.DEFAULT_PREFIX;
  }

  static add(name, events, callback) {
    this.commands[name] = callback;
    this.commandEvents.push(events);
  }

  static parse(message) {
    const prefix = this.guildPrefixes[message.guild.id];
    const content = message.content;

    const escapedPrefix = prefix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const commandRegex = new RegExp(`^(ex)?${escapedPrefix}`);
    const match = content.match(commandRegex);
    if (!match) return;

    const exclusive = !!match[1];
    const prefixRegex = new RegExp(`^${exclusive ? match[1] : ''}${escapedPrefix}`);
    const argsString = content.replace(prefixRegex, '');
    const args = this.parseString(argsString);
    if (!Object.keys(this.commands).includes(args[0])) return;

    return {
      prefix: prefix,
      exclusive: exclusive,
      name: args[0],
      args: args.slice(1),
      message: message
    };
  }

  static QUOTE_PAIRS = { '“': '”', '„': '”', "‘": "’", "‚": "’" };
  static QUOTES_REGEX = new RegExp(`[${Object.keys(this.QUOTE_PAIRS).join()}]`);
  static parseString(string, args = []) {
    let arg = '', quote = '', escape = false;

    for (const char of [...string]) {
      if (!escape && (quote === '' && /["'”“„‘‚]/.test(char)) || quote === char) {
        if (quote === char) {
          args.push(arg);
          quote = '';
        } else {
          if (arg !== '') args.push(arg);
          quote = char.replace(this.QUOTES_REGEX, match => {
            return this.QUOTE_PAIRS[match];
          });
        }

        arg = '';
        continue;
      }

      if (/[\s]/.test(char) && quote === '' && !escape) {
        if (arg !== '') args.push(arg);
        arg = quote = '';
        continue;
      }

      if (escape = char === '\\' && !escape) continue;

      arg += char;
    }

    if (arg !== '') args.push(arg);
    return args;
  }

  constructor(commandData) {
    const result = command[commandData.name](commandData);

    result.react('↩️')
      .then(setTimeout(() => this.timeout, constants.QUEUE_TIMEOUT))
      .catch();
  };
}

module.exports = Command;

require('./poll');
