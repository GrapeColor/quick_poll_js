'use strict';

const { MessageEmbed } = require('discord.js');

const constants = require('./constants');
const { locales, varsResolve } = require('./locales');

module.exports = class Command {
  static guildPrefixes = {};
  static guildLocales = {};

  static events(bot) {
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

      const matchMention = message.content.match(new RegExp(`^<@!?${bot.user.id}>$`));
      if (matchMention) {
        this.sendHelp(message);
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

      if (user.id !== message.author.id) {
        message.channel.messages.cache.delete(message.id);
        return;
      }

      const queue = this.queues[message.id];
      if (!queue) return;

      queue.cancel();
    });

    for (const events of this.commandEvents) events(bot);
  }

  static updateNick(guild) {
    const matchPrefix = guild.me.nickname?.match(/\[([!-~]{1,4}?)\]/);
    const matchLocale = guild.me.nickname?.match(/<(\w{2})>/);

    this.guildPrefixes[guild.id] = matchPrefix ? matchPrefix[1] : constants.DEFAULT_PREFIX;

    if (matchLocale && locales[matchLocale[1]]) this.guildLocales[guild.id] = matchLocale[1];
  }

  static getGuildPrefix(guild) {
    return this.guildPrefixes[guild?.id] ?? constants.DEFAULT_PREFIX;
  }

  static getGuildLanguage(guild) {
    return this.guildLocales[guild?.id] ?? constants.DEFAULT_LOCALE;
  }

  static sendHelp(message) {
    new this().respond({
      bot: message.client,
      lang: this.getGuildLanguage(message.guild),
      message: message,
      prefix: this.getGuildPrefix(message.guild),
      args: []
    })
      .catch();
  }

  static parse(message) {
    const prefix = this.getGuildPrefix(message.guild);
    const content = message.content;

    const escapedPrefix = prefix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const commandRegex = new RegExp(`^(ex)?${escapedPrefix}`);
    const match = content.match(commandRegex);

    if (!match) return;

    const exclusive = !!match[1];
    const argsString = content.slice(match[0].length);
    const args = this.parseString(argsString);

    if (!this.commands[args[0]]) return;

    return {
      bot: message.client,
      lang: this.getGuildLanguage(message.guild),
      message: message,
      prefix: prefix,
      exclusive: exclusive,
      name: args[0],
      args: args.slice(1)
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

  static addEvents(events) { this.commandEvents.push(events); }

  static commands = {};

  static addCommands(commands) { Object.assign(this.commands, commands); }

  static queues = {};

  async respond(commandData) {
    this.bot = commandData.bot;
    this.message = commandData.message;

    try {
      if (commandData.args.length) {
        command = Command.commands[commandData.name](commandData);
        this.response = await command.exec();
      } else {
        this.response = await this.callHelp(commandData);
      }
    } catch(error) {
      try {
        this.response = await this.sendError(error, commandData);
      }
      catch { undefined; }
    }

    this.message.react('↩️')
      .then(() => {
        Command.queues[this.message.id] = this;
        this.timeout = setTimeout(() => this.clearQueue(), constants.QUEUE_TIMEOUT);
      })
      .catch();
  }

  async callHelp(commandData) {
    const channel = commandData.message.channel;
    const help = locales[commandData.lang].help;

    const embed = new MessageEmbed({
      color: constants.COLOR_HELP,
      title: help.title,
      url: help.url,
      description: help.description
    });

    const inviteUrl = await commandData.bot.generateInvite(constants.REQUIRED_PERMISSIONS);

    for (const field of help.fields) {
      embed.addField(field.name, varsResolve(field.value, {
        PREFIX: commandData.prefix,
        INVITE_URL: inviteUrl
      }));
    }

    return channel.send({ embed: embed });
  }

  sendError(error, commandData) {
    error.response?.delete()
      .catch();

    if (!error.title) return console.error(error);

    return commandData.message.channel.send({
      embed: {
        color: constants.COLOR_ERROR,
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

    delete Command.queues[this.message.id];
  }
}
