'use strict';

const Command = require('./command');
const Constants = require('./constants');

const lastReactions = {};

const excludeReaction = (reaction, user) => {
  const bot = user.client;
  const emoji = reaction.emoji;
  const message = reaction.message.fetch();
  const channel = message.channel.fetch();

  if (user.equals(bot.user) || channel.type === 'dm') return;

  const pollEmbed = message.embeds[0];
  if (!pollEmbed || !message.user.equals(bot.user)) return;

  const pollColor = pollEmbed.color;
  if (pollColor !== Constants.COLOR_POLL && pollColor !== Constants.COLOR_EXPOLL) return;

  const reactions = message.reactions.cache;
  const myReactions = reactions.filter(reaction => reaction.me);

  if (reaction.lenght > 0 && !reactions.some(reaction => reaction.emoji === emoji)) {
    reactions.get(emoji.name).users.remove(user)
      .catch();
    return;
  }

  if (pollColor !== Constants.COLOR_EXPOLL) return;

  const users = lastReactions[message.id];
  if (!users) lastReactions[message.id] = {};

  const reactedEmoji = users[user.id];
  lastReactions[message.id][user.id] = emoji;

  if (reactedEmoji !== undefined) {
    if (reactedEmoji !== null) reactions.get(reactedEmoji.name).users.remove(user)
      .catch();
  } else {
    for (reaction of reactions) {
      if (lastReactions[message.id][user.id] === reaction.emoji) continue;
      reactions.get(reaction.emoji.name).users.remove(user)
        .catch();
    }
  }
}

Command.add('poll', bot => {
  bot.on('messageReactionAdd', (reaction, user) => excludeReaction(reaction, user));
  bot.on('messageReactionRemove', (reaction, user) => {});
}, commandData => {

});
