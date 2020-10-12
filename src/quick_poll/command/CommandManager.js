import Discord from 'discord.js';

import { CONST } from '../const.js';
import { locales, resolveVars } from '../locales.js';
import Command from './Command.js';

import CommandError from './CommandError.js';

/**
 * @typedef CommandData
 * @property {Discord.Client} bot - This bot client.
 * @property {string} lang - Language setting.
 * @property {Discord.Message} message - Command message.
 * @property {string} prefix - Command prefix.
 * @property {boolean|undefined} exclusive - Is it exclusive.
 * @property {string|undefined} name - Command name.
 * @property {string[]} args - Command arguments.
 * @property {Discord.Message|undefined} response - Command response.
 */

export default class CommandManager {
  /**
   * Entry events of this class.
   * @param {Discord.Client} bot
   */
  static events(bot) {
    bot.once('ready', () => {
      bot.guilds.cache.each(guild => this.updateNick(guild));
    });

    bot.on('guildMemberUpdate', (_, member) => {
      if (member === member.guild.me) this.updateNick(member.guild);
    });

    bot.on('message', message => this.processingMessage(message));

    bot.on('messageReactionAdd',
      (reaction, user) => this.cancelReaction(reaction, user));

    bot.on('messageUpdate', (_, message) => this.editCommand(message));

    for (const events of this.commandEvents) events(bot);
  }

  /** @type {Object.<string, string>} */
  static guildPrefixes = {};

  /** @type {Object.<string, string>} */
  static guildLocales = {};

  /**
   * Handles bot nickname changes.
   * @param {Discord.Guild} guild
   */
  static updateNick(guild) {
    const matchPrefix = guild.me.nickname?.match(/\[([!-~]{1,4}?)\]/);
    const matchLocale = guild.me.nickname?.match(/<(\w{2})>/);

    this.guildPrefixes[guild.id]
      = matchPrefix ? matchPrefix[1] : CONST.DEFAULT_PREFIX;

    if (matchLocale && locales[matchLocale[1]])
      this.guildLocales[guild.id] = matchLocale[1];
  }

  /**
   * Get the prefix within the guild.
   * @param {Discord.Guild} guild
   */
  static getGuildPrefix(guild) {
    return this.guildPrefixes[guild?.id] ?? CONST.DEFAULT_PREFIX;
  }

  /**
   * Get the language within the guild.
   * @param {Discord.Guild} guild
   */
  static getGuildLanguage(guild) {
    return this.guildLocales[guild?.id] ?? CONST.DEFAULT_LOCALE;
  }

  /**
   * Processing a message.
   * @param {Discord.Message} message 
   */
  static processingMessage(message) {
    if (message.author.bot) {
      message.channel.messages.cache.delete(message.id);
      return;
    }

    const matchMention = message.content.match(new RegExp(`^<@!?${bot.user.id}>$`));

    if (matchMention) {
      this.callHelp(message);
      return;
    }

    const commandData = this.parse(message);

    if (!commandData) {
      message.channel.messages.cache.delete(message.id);
      return;
    }

    new CommandManager(commandData);
  }

  /**
   * Processing a cancel reaction.
   * @param {Discord.MessageReaction} reaction 
   * @param {Discord.User} user 
   */
  static cancelReaction(reaction, user) {
    if (reaction.emoji.name !== '↩️') return;

    reaction.message.fetch()
      .then(message => {
        if (user.id !== message.author.id) {
          message.channel.messages.cache.delete(message.id);
          return;
        }

        const responser = this.responsers[message.id];

        responser?.cancel();
      })
      .catch(console.error);
  }

  /**
   * Edit command message.
   * @param {Discord.Message} message 
   */
  static editCommand(message) {
    if (!message.editedAt) return;

    const responser = this.resoponser[message.id];


  }

  /**
   * Call a help message.
   * @param {Discord.Message} message
   */
  static callHelp(message) {
    new CommandManager({
      bot: message.client,
      lang: this.getGuildLanguage(message.guild),
      message: message,
      prefix: this.getGuildPrefix(message.guild),
      args: []
    });
  }

  /**
   * Parse the content of the message.
   * @param {Discord.Message} message - The message to be parsed.
   * @returns {CommandData}
   */
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

    const lang = this.getGuildLanguage(message.guild);

    return {
      bot: message.client,
      lang: lang,
      message: message,
      prefix: prefix,
      exclusive: exclusive,
      name: args[0],
      args: args.slice(1)
    };
  }

  static QUOTE_PAIRS = { '“': '”', '„': '”', "‘": "’", "‚": "’" };

  /**
   * Paese a string as an argument.
   * @param {string} string
   * @param {string[]} args
   */
  static parseString(string, args = []) {
    let arg = '', quote = '', escape = false;

    for (const char of [...string]) {
      if (!escape && (quote === '' && /["'”“„‘‚]/.test(char)) || quote === char) {
        if (quote === char) {
          args.push(arg);
          quote = '';
        } else {
          if (arg !== '')
            args.push(arg);
          quote = this.QUOTE_PAIRS[char] ?? char;
        }

        arg = '';
        continue;
      }

      if (/[\s]/.test(char) && quote === '' && !escape) {
        if (arg !== '')
          args.push(arg);
        arg = quote = '';
        continue;
      }

      if (escape = char === '\\' && !escape)
        continue;

      arg += char;
    }

    if (arg !== '')
      args.push(arg);
    return args;
  }

  /** @type {Function[]} */
  static commandEvents = [];

  /**
   * Add command events.
   * @param {Function} events
   */
  static addEvents(events) { this.commandEvents.push(events); }

  /** @type {Object.<string, function(CommandData): Command>} */
  static commands = {};

  /**
   * Add commands.
   * @param {Object.<string, function(CommandData): Command>} commands
   */
  static addCommands(commands) { Object.assign(this.commands, commands); }

  /**
   * A command that is waiting after responding to a command.
   * @type {Object.<string, CommandManager>} 
   */
  static responsers = {};

  /**
   * Issue a command.
   * @param {CommandData} commandData
   */
  constructor(commandData) {
    this.bot = commandData.bot;
    this.message = commandData.message;

    this.afterResponding(
      commandData.args.length
      ? CommandManager.commands[commandData.name](commandData).exec()
      : this.sendHelp(commandData)
    );
  }

  /**
   * Processing after responding.
   * @param {Promise<Discord.Message>} response
   */
  afterResponding(response) {
    response
      .then(response => {
        this.response = response;
        this.addResponser();
      })
      .catch(error => this.sendError(error, commandData));
  }

  addResponser() {
    this.message.react('↩️')
      .then(() => {
        CommandManager.responsers[this.message.id] = this;

        this.timeout = setTimeout(() => this.clearQueue(), CONST.QUEUE_TIMEOUT);
      })
      .catch(undefined);
  }

  /**
   * Send error message and report.
   * @param {CommandError} error 
   * @param {CommandData} commandData 
   */
  sendError(error, commandData) {
    error.response?.delete()
      .catch(undefined);

    if (!error.title) {
      console.error(error);
      return;
    }

    const embed = new Discord.MessageEmbed({ color: CONST.COLOR_ERROR });

    embed.title = `⚠️ ${error.title}`;
    embed.description = error.description;

    commandData.message.channel.send(embed)
      .then(response => this.response = response)
      .catch(undefined);
  }

  /**
   * Send help message.
   * @param {CommandData} commandData 
   */
  async sendHelp(commandData) {
    const channel = commandData.message.channel;
    const help = locales[commandData.lang].help;
    const embed = new Discord.MessageEmbed({ color: CONST.COLOR_HELP });

    embed.title = help.title;
    embed.url = help.url;
    embed.description = help.description;

    const inviteUrl
      = await commandData.bot.generateInvite(CONST.REQUIRED_PERMISSIONS);

    for (const field of help.fields) {
      embed.addField(field.name, resolveVars(field.value, {
        PREFIX: commandData.prefix,
        INVITE_URL: inviteUrl
      }));
    }

    return channel.send(embed);
  }

  cancel() {
    clearTimeout(this.timeout);
    this.removeResponser();

    this.response.delete()
      .catch();
  }

  removeResponser() {
    this.message.reactions.cache.get('↩️').users.remove(this.bot.user)
      .catch();

    delete CommandManager.responsers[this.message.id];
  }
}
