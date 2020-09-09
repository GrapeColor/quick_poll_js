'use strict';

const _ = require('lodash');

const twemojiRegex = require('twemoji-parser/dist/lib/regex').default;

const constants = require('../constants');

const CommandError = require('../error');
const { locales } = require('../locales');

module.exports = class Poll {
  static events(bot) {
    bot.on('messageReactionAdd', (reaction, user) => Poll.excludeReaction(reaction, user));
  }

  static async excludeReaction(reaction, user) {
    const botUser = user.client.user;
    const channel = reaction.message.channel;

    if (user.bot || !channel || channel.type === 'dm') return;

    const message = await reaction.message.fetch();
    const pollEmbed = message.embeds[0];
    const pollColor = pollEmbed?.color;

    if (!message.author.id === botUser.id
      || pollColor !== constants.COLOR_POLL && pollColor !== constants.COLOR_EXPOLL) {
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

    const myReactions = reactions.cache.filter(reaction => reaction.me);

    if (myReactions.length && !reaction.me) {
      reactions.get(emoji.id ?? emoji.name).users.remove(user)
        .catch();
      return;
    }

    if (pollColor !== constants.COLOR_EXPOLL) return;

    for (const reaction of myReactions.array()) {
      if (!partial && !reaction.users.cache.has(user.id) || reaction.emoji.name === emoji.name) continue;

      reaction.users.remove(user)
        .catch();
    }
  }

  static commands = {
    poll: commandData => new this(commandData),
    freepoll: commandData => new this(commandData),
    numpoll: commandData => new this(commandData)
  };

  static emojiRegex = new RegExp(`^(${twemojiRegex.toString().slice(1, -2)})$`);
  static guildEmojiRegex = /^<a?:.+?:(\d+)>$/;

  static DEFAULT_EMOJIS = [
    '🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹'
  ];
  static NUMERICAL_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

  static IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

  constructor(commandData) {
    this.bot = commandData.bot;
    this.lang = commandData.lang;
    this.message = commandData.message;
    this.prefix = commandData.prefix;
    this.exclusive = commandData.exclusive;
    this.name = commandData.name;
    this.args = commandData.args;

    this.texts = locales[this.lang].poll;

    this.user = this.message.author;
    this.channel = this.message.channel;
    this.guild = this.channel.guild;

    if (this.guild) {
      this.member = this.guild.members.resolve(this.user);
      this.permissions = this.channel.permissionsFor(this.bot.user);
      this.allowManageMessages = this.permissions.has('MANAGE_MESSAGES');
      this.allowExternalEmojis = this.permissions.has('USE_EXTERNAL_EMOJIS');
    }
  }

  async exec() {
    try {
      await this.sendWaiter();

      this.canExclusively();
      this.parseArgs();
      this.optionsValidation();
      this.getAttachement();

      await this.sendPoll();

      await this.addReactions();
    } catch(error) {
      throw new CommandError(this.response, error, this.lang, {
        MAX_OPTIONS: Poll.DEFAULT_EMOJIS.length,
        MAX_NUMBER: Poll.NUMERICAL_EMOJIS.length
      });
    }

    return this.response;
  }

  async sendWaiter() {
    this.response = await this.channel.send({
      embed: {
        color: constants.COLOR_WAIT,
        title: `⌛ ${this.texts.wait}`
      }
    });
  }

  canExclusively() {
    if (!this.exclusive) return;

    if (!this.guild) throw 'unavailableExclusive';

    if (!this.allowManageMessages) throw 'unusableExclusive';
  }

  parseArgs() {
    this.query = this.args.shift();

    switch(this.name) {
      case 'poll':
      case 'freepoll':
        this.options = this.parsePoll();
        break;

      case 'numpoll':
        this.options = this.parseNumpoll();
        break;
    }
  }

  parsePoll() {
    if (!this.args.length) return this.zipOptions(['⭕', '❌']);

    if (this.args.length > Poll.DEFAULT_EMOJIS.length * 2) throw 'tooManyOptions';

    let [resolves, rejects] = _.partition(this.args, arg => this.resolveEmoji(arg));

    if (!rejects.length) {
      if (resolves.length > Poll.DEFAULT_EMOJIS.length) throw 'tooManyOptions';
      if (resolves.length > _.uniq(resolves).length) throw 'duplicateEmojis';

      return this.zipOptions(this.args, resolves);
    }

    let index = 0;
    const [emojis, strings] = _.partition(this.args, _ => (++index) % 2);

    [resolves, rejects] = _.partition(emojis, emoji => this.resolveEmoji(emoji));

    if (emojis.length === strings.length && !rejects.length) {
      if (resolves.length > Poll.DEFAULT_EMOJIS.length) throw 'tooManyOptions';
      if (resolves.length > _.uniq(resolves).length) throw 'duplicateEmojis';

      return this.zipOptions(emojis, resolves, strings);
    }

    if (this.args.length > Poll.DEFAULT_EMOJIS.length) throw 'tooManyOptions';

    return this.zipOptions(Poll.DEFAULT_EMOJIS.slice(0, this.args.length), [], this.args);
  }

  parseNumpoll() {
    if (!this.args.length) throw 'unspecifiedNumber';

    const number = Number(
      this.args[0].replace(/[０-９]/g, match => String.fromCharCode(match.charCodeAt() - 0xFEE0))
      );

    if (number < 1) throw 'tooSmallNumber';
    if (number > Poll.NUMERICAL_EMOJIS.length) throw 'tooLargeNumber';

    return this.zipOptions(Poll.NUMERICAL_EMOJIS.slice(0, number));
  }

  zipOptions(emojis, reactions = [], strings = []) {
    return _.zipWith(emojis, reactions, strings, (emoji, reaction, string) => {
      return { emoji: emoji, reaction: reaction ?? emoji, string: string };
    });
  }

  resolveEmoji(arg) {
    if (Poll.emojiRegex.test(arg)) return arg;

    const matchGuildEmoji = arg.match(Poll.guildEmojiRegex);

    if (matchGuildEmoji) {
      const guildEmojiID = matchGuildEmoji[1];
      const guildEmoji = this.bot.emojis.cache.get(guildEmojiID);

      if (!guildEmoji) throw 'unknownEmoji';

      if (this.guild && this.guild.id !== guildEmoji.guild.id && !this.allowExternalEmojis) {
        throw 'denyExternalEmojis';
      }

      const roles = guildEmoji.roles.cache;
      const botRoles = guildEmoji.guild.me.roles.cache;

      if (roles.size && !roles.intersect(botRoles).size) throw 'unavailableEmoji';

      return guildEmojiID;
    }
  }

  optionsValidation() {
    if (this.query.length > constants.QUERY_MAX) throw 'tooLongQuery';

    for (const str of Object.values(this.options)) {
      if (str.length > constants.OPTION_MAX) throw 'tooLongOption';
    }
  }

  getAttachement() {
    const attachment = this.message.attachments.first();

    if (!attachment) return;

    for (const extension of Poll.IMAGE_EXTENSIONS) {

      if (attachment.name.endsWith(extension)) {
        this.attachment = attachment;
        break;
      }
    }
  }

  async sendPoll() {
    await this.response.edit({
      embed: {
        color: this.exclusive ? constants.COLOR_EXPOLL : constants.COLOR_POLL,
        author: {
          iconURL: this.user.displayAvatarURL(),
          name: this.member?.displayName ?? this.user.tag
        },
        title: `${this.query}\u200C`,
        description: this.generateDescription(),
        image: {
          url: this.attachment ? this.attachment.name : undefined
        },
        footer: {
          text: this.exclusive ? this.texts.footer.ex[this.name] : this.texts.footer[this.name]
        }
      },
      files: this.attachment ? this.attachment.url : []
    });
  }

  generateDescription() {
    let description = _(this.options).filter(option => option.string).map(option => {
      return `\u200B${option.emoji} ${option.string}\u200C`
    }).join('\n');

    description += `\n\n[📊](${constants.MANUAL_URL}sumpoll) \`${this.prefix}sumpoll ${this.response.id}\``;

    return description;
  }

  async addReactions() {
    
  }
}
