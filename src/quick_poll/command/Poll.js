import _ from 'lodash';
import Discord from 'discord.js';

import twemojiRegex from 'twemoji-parser/dist/lib/regex.js';

import { CONST } from '../const.js';
import { locales } from '../locales.js';

import { CommandData } from './CommandManager.js';
import Command from './Command.js';

export default class Poll extends Command {
  /**
   * Entry events of this class.
   * @param {Discord.Client} bot 
   */
  static events(bot) {
    bot.on('messageReactionAdd', (reaction, user) =>
      Poll.excludeReaction(reaction, user));
  }

  /**
   * Exclusive reaction.
   * @param {Discord.MessageReaction} reaction 
   * @param {Discord.User} user 
   */
  static async excludeReaction(reaction, user) {
    const botUser = user.client.user;
    const channel = reaction.message.channel;

    if (user.bot || !channel || channel.type === 'dm') return;

    const message = await reaction.message.fetch();
    const pollEmbed = message.embeds[0];
    const pollColor = pollEmbed?.color;

    if (!message.author.id === botUser.id
      || pollColor !== CONST.COLOR_POLL
      && pollColor !== CONST.COLOR_EXPOLL) {
      channel.messages.cache.delete(message.id);
      return;
    }

    const partial = reaction.partial;
    const emoji = reaction.emoji;
    const reactions = message.reactions;

    if (partial) {
      reactions.add(reaction);
      reactions.cache.get(emoji.id ?? emoji.name).users.add(user);
    }

    const botReactions = reactions.cache.filter(reaction => reaction.me);

    if (botReactions.size && !reaction.me) {
      reactions.cache.get(emoji.id ?? emoji.name).users.remove(user)
        .catch(undefined);
      return;
    }

    if (pollColor !== CONST.COLOR_EXPOLL) return;

    for (const reaction of botReactions.array()) {
      const shouldDelete
        = reaction.users.cache.has(user.id) && reaction.emoji.name !== emoji.name;

      if (partial) {
        if (shouldDelete)
          try { await reaction.users.remove(user); }
          catch { undefined; }
      } else {
        if (shouldDelete)
          reaction.users.remove(user)
            .catch(undefined);
      }
    }
  }

  /**
   * Commands of this class.
   * @type {Object.<string, function(CommandData): Poll>}
   */
  static commands = {
    poll:     commandData => new Poll(commandData),
    freepoll: commandData => new Poll(commandData),
    numpoll:  commandData => new Poll(commandData)
  };

  static EMOJI_REGEX = new RegExp(
    `^(${twemojiRegex.default.toString().slice(1, -2)})$`
  );
  static GUILD_EMOJI_REGEX = /^<a?:.+?:(\d+)>$/;
  static ATTACHMENT_REGEX = /\.(png|jpg|jpeg|gif|webp)$/;

  static DEFAULT_EMOJIS = [
    '🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯',
    '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹'
  ];
  static NUMERICAL_EMOJIS = [
    '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'
  ];

  /**
   * @typedef Option
   * @property {string} emoji
   * @property {string} reaction
   * @property {string|undefined} value
   */

  /**
   * Issue the poll command.
   * @param {CommandData} commandData 
   */
  constructor(commandData) {
    super(commandData);

    this.editable = true;

    this.texts = locales[this.lang].poll;

    if (this.channel.type !== 'dm') {
      this.allowManageMessages = this.permissions.has('MANAGE_MESSAGES');
      this.allowExternalEmojis = this.permissions.has('USE_EXTERNAL_EMOJIS');
    }

    this.query = undefined;
    this.options = undefined;
    this.attachment = undefined;
  }

  async commandExec() {
    if (!this.response) this.response = await this.sendWaiter();

    if (this.exclusive) {
      if (!this.guild) throw 'unavailableExclusive';
      if (!this.allowManageMessages) throw 'unusableExclusive';
    }

    this.options = this.parseArgs();
    this.attachment = this.message.attachments.find(attachment =>
      Poll.ATTACHMENT_REGEX.test(attachment.name));

    await this.sendPoll();
    await this.addReactions();
  }

  sendWaiter() {
    const embed = new Discord.MessageEmbed({ color: CONST.COLOR_WAIT });

    embed.title = `⌛ ${this.texts.wait}`;

    return this.channel.send(embed);
  }

  parseArgs() {
    this.query = this.args.shift();

    if (this.query.length > CONST.QUERY_MAX) throw 'tooLongQuery';

    switch(this.name) {
      case 'poll':
      case 'freepoll':
        return this.parsePoll();
      case 'numpoll':
        return this.parseNumpoll();
    }
  }

  /** @returns {Option[]} */
  parsePoll() {
    if (!this.args.length) return ['⭕', '❌'].map(emoji => {
      return { emoji: emoji, reaction: emoji, value: undefined };
    });

    /** @type {[string[],string[], string[]]} */
    const [emojis, reactions, values] = [[], [], []];

    for (const arg of this.args) {
      const reaction = this.resolveEmoji(arg);

      if (reaction) {
        const len = emojis.push(arg);
        reactions.push(reaction);

        if (values.length < len - 1) values.push(undefined);
      } else {
        if (arg > CONST.OPTION_MAX) throw 'tooLongOption';

        const len = values.push(arg);

        if (emojis.length < len) {
          const emoji = Poll.DEFAULT_EMOJIS[len - 1];

          emojis.push(emoji);
          reactions.push(emoji);
        }
      }

      if (emojis.length > CONST.MAX_OPTIONS) throw 'tooManyOptions';
    }

    if (emojis.length > _(emojis).uniq().size()) throw 'duplicateEmojis';

    return emojis.map((emoji, i) => {
      return { emoji: emoji, reaction: reactions[i], value: values[i] };
    });
  }

  /**
   * Check if the argument is an emoji.
   * @param {string} arg - Arguments to check.
   * @returns {string|undefined}
   */
  resolveEmoji(arg) {
    if (Poll.EMOJI_REGEX.test(arg)) return arg;

    const matchGuildEmoji = arg.match(Poll.GUILD_EMOJI_REGEX);

    if (!matchGuildEmoji) return;

    const guildEmojiID = matchGuildEmoji[1];
    const guildEmoji = this.bot.emojis.cache.get(guildEmojiID);

    if (!guildEmoji) throw 'unknownEmoji';

    if (this.guild
      && this.guild.id !== guildEmoji.guild.id
      && !this.allowExternalEmojis) throw 'denyExternalEmojis';

    const roles = guildEmoji.roles.cache;
    const botRoles = guildEmoji.guild.me.roles.cache;

    if (roles.size && !roles.intersect(botRoles).size) throw 'unavailableEmoji';

    return guildEmojiID;
  }

  /** @returns {Option[]} */
  parseNumpoll() {
    if (!this.args.length) throw 'unspecifiedNumber';

    const number = Number(
      this.args[0].replace(/[０-９]/g, match =>
        String.fromCharCode(match.charCodeAt() - 0xFEE0))
    );

    if (number < 1) throw 'tooSmallNumber';
    if (number > Poll.NUMERICAL_EMOJIS.length) throw 'tooLargeNumber';

    return Poll.NUMERICAL_EMOJIS.slice(0, number).map(emoji => {
      return { emoji: emoji, reaction: emoji, value: undefined };
    });
  }

  sendPoll() {
    const embed = new Discord.MessageEmbed();

    embed.color = this.exclusive ? CONST.COLOR_EXPOLL : CONST.COLOR_POLL;
    embed.setAuthor(
      this.member?.displayName ?? this.user.tag,
      this.user.displayAvatarURL()
    );
    embed.title = `${this.query}\u200C`;
    embed.description = this.optionsList();
    embed.setImage(this.attachment ? this.attachment.name : undefined);
    embed.setFooter(this.exclusive
      ? this.texts.footer.ex[this.name] : this.texts.footer[this.name]);

    return this.response.edit(embed);
  }

  optionsList() {
    let list = '';

    if (this.options.find(option => option.value))
      list = this.options.map(option => {
        return `\u200B${option.emoji} ${option.value}\u200C`
      })
        .join('\n');

    list += `\n\n[📊](${CONST.MANUAL_URL}sumpoll) `
      + `\`${this.prefix}sumpoll ${this.channel.id}-${this.response.id}\``;

    return list;
  }

  addReactions() {
    return Promise.all(this.options.map(option =>
      this.response.react(option.reaction)));
  }
}
