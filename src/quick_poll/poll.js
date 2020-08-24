'use strict';

const Command = require('./command');
const constants = require('./constants');

const excludeReaction = async (reaction, user) => {
  const botUser = user.client.user;
  const channel = reaction.message.channel;
  if (user.equals(botUser) || !channel || channel.type === 'dm') return;

  const message = await reaction.message.fetch();

  const pollEmbed = message.embeds[0];
  if (!pollEmbed || !message.author.equals(botUser)) return;

  const pollColor = pollEmbed.color;
  if (pollColor !== constants.COLOR_POLL && pollColor !== constants.COLOR_EXPOLL) return;

  const partial = reaction.partial;
  const emoji = reaction.emoji;
  const reactions = message.reactions;

  if (partial) {
    reactions.add(reaction);
    reactions.cache.get(emoji.id ?? emoji.name).users.add(user);
  }

  const myReactions = reactions.cache.filter(reaction => reaction.me);

  if (reaction.lenght > 0 && !myReactions.some(reaction => reaction.emoji.name === emoji.name)) {
    myReactions.get(emoji.id ?? emoji.name).users.remove(user)
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

Command.add('poll', bot => {
  bot.on('messageReactionAdd', (reaction, user) => excludeReaction(reaction, user));
}, commandData => {

});
