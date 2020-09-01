'use strict';

const constants = require('./constants');
const locales = require('./locales');

module.exports = class Command {
  static guildPrefixes = {};
  static guildLocales = {};

  static events(bot) {
    this.bot = bot;

    bot.once('ready', () => {
      bot.guilds.cache.each(guild => this.updateNick(guild));
    });

    bot.on('guildMemberUpdate', (_, member) => {
      if (member === member.guild.me) this.updateNick(member.guild);
    });

    bot.on('message', message => {
      if (message.author.bot) {
        message.channel.messages.cache.delete(message.id);
        return;
      }

      const commandData = this.parse(message);
      if (!commandData) {
        message.channel.messages.cache.delete(message.id);
        return;
      }

      new this().respond(commandData)
        .catch();
    });

    bot.on('messageReactionAdd', async (reaction, user) => {
      if (reaction.emoji.name !== '↩️') return;

      const message = await reaction.message.fetch();
      if (!user.equals(message.author)) {
        message.channel.messages.cache.delete(message.id);
        return;
      }

      const command = this.queues[message.id];
      if (!command) return;

      command.cancel();
    });

    for (const events of this.commandEvents) events(bot);
  }

  static CUSTOM_PREFIX_REGEX = /\[([!-~]{1,4}?)\]/;
  static LOCALE_REGEX = /<(\w{2})>/;

  static updateNick(guild) {
    const matchPrefix = guild.me.nickname?.match(this.CUSTOM_PREFIX_REGEX);
    const matchLocale = guild.me.nickname?.match(this.LOCALE_REGEX);

    this.guildPrefixes[guild.id] = matchPrefix ? matchPrefix[1] : constants.DEFAULT_PREFIX;
    if (matchLocale && locales[matchLocale[1]]) this.guildLocales[guild.id] = matchLocale[1];
  }

  static parse(message) {
    const prefix = this.guildPrefixes[message.guild?.id] ?? constants.DEFAULT_PREFIX;
    const content = message.content;

    const escapedPrefix = prefix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const commandRegex = new RegExp(`^(ex)?${escapedPrefix}`);
    const match = content.match(commandRegex);
    if (!match) return;

    const exclusive = !!match[1];
    const argsString = content.slice(match[0].length);
    const args = this.parseString(argsString);
    if (!this.commands[args[0]]) return;

    const lang = this.guildLocales[message.guild?.id] ?? constants.DEFAULT_LOCALE;

    return {
      bot: message.client,
      prefix: prefix,
      exclusive: exclusive,
      name: args[0],
      args: args.slice(1),
      message: message,
      lang: lang
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

  static commandEvents = [];

  static addEvents(events) {
    this.commandEvents.push(events);
  }

  static commands = {};

  static addCommands(commands) {
    Object.assign(this.commands, commands);
  }

  static queues = {};

  async respond(commandData) {
    this.bot = commandData.bot;
    this.message = commandData.message;

    try {
      this.response = await this.constructor.commands[commandData.name](commandData);
    } catch(error) {
      try {
        this.response = await this.sendError(error, commandData);
      }
      catch { undefined; }
    }

    this.message.react('↩️')
      .then(() => {
        this.constructor.queues[this.message.id] = this;
        this.timeout = setTimeout(() => this.clearQueue(), constants.QUEUE_TIMEOUT);
      })
      .catch();
  }

  sendError(error, commandData) {
    const channel = commandData.message.channel;

    return channel.send({
      embed: {
        title: `⚠️ ${error.title}`,
        description: error.description
      }
    });
  }

  cancel() {
    clearTimeout(this.timeout);
    this.clearQueue();

    this.response.delete()
      .catch();
  }

  clearQueue() {
    this.message.reactions.cache.get('↩️').users.remove(this.bot.user)
      .catch();

    delete this.constructor.queues[this.message.id];
  }
}
