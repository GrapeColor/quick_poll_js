'use strict';

const Twemoji = require('twemoji');
const _ = require('lodash');

const constants = require('../constants');

const CommandError = require('../error');
const { locales } = require('../locales');

module.exports = class Poll {
  static events(bot) {
    bot.on('messageReactionAdd', (reaction, user) => excludeReaction(reaction, user));
  }

  static async excludeReaction(reaction, user) {
    const botUser = user.client.user;
    const channel = reaction.message.channel;
    if (user.bot || !channel || channel.type === 'dm') return;

    const message = await reaction.message.fetch();
    const pollEmbed = message.embeds[0];
    const pollColor = pollEmbed?.color;
    if (!message.author.equals(botUser) || pollColor !== constants.COLOR_POLL && pollColor !== constants.COLOR_EXPOLL) {
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

  static DEFAULT_EMOJIS = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹'];
  static NUMERICAL_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

  constructor(commandData) {
    this.bot = commandData.bot;
    this.lang = commandData.lang;
    this.message = commandData.message;
    this.prefix = commandData.prefix;
    this.exclusive = commandData.exclusive;
    this.name = commandData.name;
    this.args = commandData.args;

    this.labels = locales[this.commandData.lang].poll;

    this.channel = this.message.channel;
    if (this.channel.type !== 'dm') {
      this.permissions = this.channel.permissionsFor(this.bot.user);
    }
  }

  async exec() {
    try {
      this.response = await this.sendWaiter();
      this.canExclusively();
      this.parseArgs();
      this.optionsValidation();
    } catch(error) {
      throw new CommandError(this.response, error, this.commandData.lang, {
        MAX_OPTIONS: Poll.DEFAULT_EMOJIS.length,
        MAX_NUMBER: Poll.NUMERICAL_EMOJIS.length
      });
    }

    return response;
  }

  sendWaiter() {
    return this.channel.send({
      embed: {
        color: constants.COLOR_WAIT,
        title: `⌛ ${this.labels.wait}`
      }
    });
  }

  canExclusively() {
    if (!this.exclusive) return;
    if (!this.permissions) throw 'unavailableExclusive';
    if (!this.permissions.has('MANAGE_MESSAGES')) throw 'unusableExclusive';
  }

  parseArgs() {
    this.query = this.args.shift();

    const parsers = {
      poll: this.parsePoll,
      freepoll: this.parsePoll,
      numpoll: this.parseNumpoll
    };

    this.options = parsers[this.name]();
  }

  parsePoll() {
    if (!this.args.length) return _.zipObject(['⭕', '❌'], []);

    if (this.args.length > Poll.DEFAULT_EMOJIS.length * 2) throw 'tooManyOptions';

    if (!(_.partition(emojis, emoji => this.isEmoji(emoji))[1].length)) {
      if (this.args.length > Poll.DEFAULT_EMOJIS.length) throw 'tooManyOptions';
      if (this.args.length > _.uniq(this.args).length) throw 'duplicateEmojis';

      return _.zipObject(this.args, []);
    }

    let index = 0;
    const [emojis, strings] = _.partition(this.args, _ => (++index) % 2);

    if (!(this.args.length % 2) && !(_.partition(emojis, emoji => this.isEmoji(emoji))[1].length)) {
      if (emojis.length > Poll.DEFAULT_EMOJIS.length) throw 'tooManyOptions';
      if (emojis.length > _.uniq(emojis).length) throw 'duplicateEmojis';

      return _.zipObject(emojis, strings);
    }

    if (this.args.length > Poll.DEFAULT_EMOJIS.length) throw 'tooManyOptions';

    return _.zipObject(Poll.DEFAULT_EMOJIS.slice(0, this.args.length), this.args);
  }

  parseNumpoll() {
    if (!this.args.length) throw 'unspecifiedNumber';

    const number = Number(this.args[0].replace(/[０-９]/g, match => String.fromCharCode(match.charCodeAt() - 0xFEE0)));
    if (number < 1) throw 'tooSmallNumber';
    if (number > Poll.NUMERICAL_EMOJIS.length) throw 'tooLargeNumber';

    return _.zipObject(Poll.NUMERICAL_EMOJIS.slice(0, number), []);
  }

  isEmoji(arg) { return /^<a?:.+?:\d+>$/.test(arg) || Twemoji.test(arg); }

  optionsValidation() {
    if (this.query.length > constants.QUERY_MAX) throw 'tooLongQuery';

    if (_(this.options).values().partition(str => str.length > constants.OPTION_MAX).value()[0]) throw 'tooLongOption';

    // 絵文字が使用可能か検証
  }
}
