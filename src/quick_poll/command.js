'use strict';

const constants = require('./constants');
const locales = require('./locales');

const poll = require('./poll');

class Command {
  static commands = {
    ...poll.commands
  };
  static commandEvents = [
    ...poll.events
  ];

  static guildPrefixes = {};
  static guildLocales = {};

  static waitQueues = {};

  static events(bot) {
    bot.once('ready', () => {
      bot.guilds.cache.each(guild => this.updateNick(guild));
    });

    bot.on('guildMemberUpdate', (_, member) => {
      if (member === member.guild.me) this.updateNick(member.guild);
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
  static LOCALE_REGEX = /<(\w{2})>/;
  static DEFAULT_LOCALE = 'ja';

  static updateNick(guild) {
    const matchPrefix = guild.me.nickname?.match(this.CUSTOM_PREFIX_REGEX);
    const matchLocale = guild.me.nickname?.match(this.LOCALE_REGEX);

    this.guildPrefixes[guild.id] = matchPrefix ? matchPrefix[1] : this.DEFAULT_PREFIX;
    this.guildLocales[guild.id] = matchLocale && locales[matchLocale[1]] ? matchLocale[1] : this.DEFAULT_LOCALE;
  }

  static parse(message) {
    const prefix = this.guildPrefixes[message.guild.id];
    const content = message.content;

    const escapedPrefix = prefix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const commandRegex = new RegExp(`^(ex)?${escapedPrefix}`);
    const match = content.match(commandRegex);
    if (!match) return;

    const exclusive = !!match[1];
    const argsString = content.slice(match[0].length);
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
  static parseString(string, args = []) {
    let arg = '', quote = '', escape = false;

    for (const char of [...string]) {
      if (!escape && (quote === '' && /["'”“„‘‚]/.test(char)) || quote === char) {
        if (quote === char) {
          args.push(arg);
          quote = '';
        } else {
          if (arg !== '') args.push(arg);
          quote = this.QUOTE_PAIRS[char] ?? char;
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
