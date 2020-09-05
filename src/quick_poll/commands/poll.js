'use strict';

const Twemoji = require('twemoji');

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
  
    if (myReactions.lenght > 0 && !reaction.me) {
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
    numpoll: commandData => new this(commandData),
    freepoll: commandData => new this(commandData)
  };

  static DEFAULT_EMOJIS = [ '🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹' ];
  static NUMERICAL_EMOJIS = [ '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟' ];

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

      this.can_exclusively();
    } catch(error) {
      throw new CommandError(this.response, error, this.commandData.lang);
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

  can_exclusively() {
    if (!this.exclusive) return;
    if (!this.permissions) throw 'unavailableExclusive';
    if (!this.permissions.has('MANAGE_MESSAGES')) throw 'cannotExclusive';
  }
}
