'use strict';

const { Client, Intents } = require('discord.js');
const Command = require('./command');
const Admin = require('./admin');

class QuickPoll {
  constructor(shards = 0, shardCount = 1) {
    this.shards = shards;
    this.shardCount = shardCount;

    const bot = this.bot = new Client({
      shards: shards,
      shardCount: shardCount,
      ws: { intents: Intents.NON_PRIVILEGED },
      partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION'],
      restTimeOffset: 200
    });

    this.readyCount = 0;
    bot.on('shardReady', () => {
      bot.user.setPresence({
        activity: { name: `再接続されました(${++this.readyCount})` },
        status: 'dnd',
        shardID: shards
      }).catch(console.error);

      console.info(`Quick Poll(${(shards + 1) + '/' + shardCount}) has (re)started.`);
    });

    this.updateStatusCount = 0;
    bot.setInterval(() => this.updateStatus(this.updateStatusCount++), 30000);
  }

  login(token) {
    const bot = this.bot;

    bot.login(token)
      .then(() => {
        Admin.events(bot);
        Command.events(bot);
      })
      .catch(console.error);
  }

  updateStatus(count) {
    const bot = this.bot;

    switch(count % 4) {
      case 0:
      case 1:
        bot.user.setPresence({
          activity: { name: '/poll | ex/poll', type: 'LISTENING' },
          status: 'online',
          shardID: this.shards
        }).catch(console.error);
        break;
      case 2:
        bot.user.setPresence({
          activity: { name: `${bot.guilds.cache.size} サーバー`, type: 'WATCHING' },
          status: 'online',
          shardID: this.shards
        }).catch(console.error);
        break;
      case 3:
        bot.user.setPresence({
          activity: { name: `${this.shards + 1} / ${this.shardCount} shards`, type: 'PLAYING' },
          status: 'online',
          shardID: this.shards
        }).catch(console.error);
        break;
    }
  }
}

module.exports = QuickPoll;
