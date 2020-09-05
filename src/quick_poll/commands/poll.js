'use strict';

const constants = require('../constants');

const PollError = require('../error');
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

  constructor(commandData) {
    this.commandData = commandData;
  }

  async exec() {
    this.message = this.commandData.message;
    this.channel = message.channel;

    this.labels = locales[this.commandData.lang].poll;

    try {
      this.response = await this.sendWaiter();
    } catch(error) {
      throw new PollError(this.response, error, this.commandData.lang);
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
}
