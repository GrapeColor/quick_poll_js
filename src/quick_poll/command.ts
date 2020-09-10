import { Client, Guild, Message, MessageEmbed } from 'discord.js';

import { constants } from './constants';
import { locales, resolveVars } from './locales';

import CommandData from './command_data';
import CommandError from './error';

export default class Command {
  static queues: { [key: string]: Command } = {};

  static events(bot: Client) {
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

      const matchMention = message.content.match(new RegExp(`^<@!?${bot.user?.id}>$`));

      if (matchMention) {
        this.sendHelp(message);
        return;
      }

      const commandData = this.parse(message);

      if (!commandData) {
        message.channel.messages.cache.delete(message.id);
        return;
      }

      new this(commandData).respond()
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

  static guildPrefixes: { [key: string]: string } = {};
  static guildLocales: { [key: string]: string } = {};

  static updateNick(guild: Guild) {
    const matchPrefix = guild.me?.nickname?.match(/\[([!-~]{1,4}?)\]/);
    const matchLocale = guild.me?.nickname?.match(/<(\w{2})>/);

    this.guildPrefixes[guild.id] = matchPrefix ? matchPrefix[1] : constants.DEFAULT_PREFIX;

    if (matchLocale && locales[matchLocale[1]]) this.guildLocales[guild.id] = matchLocale[1];
  }

  static getGuildPrefix(guild: Guild | null) {
    if (!guild) return constants.DEFAULT_PREFIX;
    return this.guildPrefixes[guild.id] ?? constants.DEFAULT_PREFIX;
  }

  static getGuildLanguage(guild: Guild | null) {
    if (!guild) return constants.DEFAULT_LOCALE;
    return this.guildLocales[guild.id] ?? constants.DEFAULT_LOCALE;
  }

  static sendHelp(message: Message) {
    const lang = this.getGuildLanguage(message.guild);
    const prefix = this.getGuildPrefix(message.guild);

    const commandData: CommandData = {
      bot: message.client, lang: lang, message: message, prefix: prefix,
      exclusive: false, name: '', args: []
    };

    new this(commandData).respond()
      .catch();
  }

  static parse(message: Message) {
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

    const commandData: CommandData = {
      bot: message.client,
      lang: this.getGuildLanguage(message.guild),
      message: message,
      prefix: prefix,
      exclusive: exclusive,
      name: args[0],
      args: args.slice(1)
    }

    return commandData;
  }

  static QUOTE_PAIRS: { [key: string]: string } = { '“': '”', '„': '”', "‘": "’", "‚": "’" };

  static parseString(string: String, args: string[] = []) {
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

  static commandEvents: Function[] = [];

  static addEvents(events: (bot: Client) => void) { this.commandEvents.push(events); }

  static commands: { [key: string]: Function } = {};

  static addCommands(commands: { [key: string]: (commandData: CommandData) => any }) { Object.assign(this.commands, commands); }

  commandData: CommandData;
  bot: Client;
  message: Message;
  response: Message | undefined;
  timeout: NodeJS.Timeout | undefined;

  constructor(commandData: CommandData) {
    this.commandData = commandData;
    this.bot = commandData.bot;
    this.message = commandData.message;
  }

  async respond() {
    try {
      if (this.commandData.args.length) {
        this.response = await Command.commands[this.commandData.name](this.commandData).exec();
      } else {
        this.response = await this.callHelp();
      }
    } catch(error) {
      try {
        this.response = await this.sendError(error);
      }
      catch { return; }
    }

    this.message.react('↩️')
      .then(() => {
        Command.queues[this.message.id] = this;
        this.timeout = this.bot.setTimeout(() => this.clearQueue(), constants.QUEUE_TIMEOUT);
      })
      .catch();
  }

  async callHelp() {
    const channel = this.message.channel;
    const help = locales[this.commandData.lang].help;

    const embed = new MessageEmbed({
      color: constants.COLOR_HELP,
      title: help.title,
      url: help.url,
      description: help.description
    });

    const inviteUrl = await this.bot.generateInvite(constants.REQUIRED_PERMISSIONS);

    for (const field of help.fields) {
      embed.addField(field.name, resolveVars(field.value, {
        PREFIX: this.commandData.prefix,
        INVITE_URL: inviteUrl
      }));
    }

    return channel.send({ embed: embed });
  }

  sendError(error: CommandError) {
    error.response?.delete()
      .catch();

    if (!error.title) {
      console.error(error);
      return;
    }

    return this.commandData.message.channel.send({
      embed: {
        color: constants.COLOR_ERROR,
        title: `⚠️ ${error.title}`,
        description: error.description,
        footer: {
          text: error.exception.toString()
        }
      }
    });
  }

  cancel() {
    if (this.timeout) this.bot.clearTimeout(this.timeout);
    this.clearQueue();

    this.response?.delete()
      .catch();
  }

  clearQueue() {
    this.message.reactions.cache.get('↩️')?.users.remove(this.bot.user?.id)
      .catch();

    delete Command.queues[this.message.id];
  }
}
