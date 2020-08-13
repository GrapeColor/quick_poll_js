'use strict';

const Discord = require('discord.js');
const Response = require('./response');

class QuickPoll {
  constructor(shards = 0, shardCount = 1) {
    this.shards = shards;
    this.shardCount = shardCount;

    const bot = this.bot = new Discord.Client({
      shards: shards,
      shardCount: shardCount,
      ws: { intents: Discord.Intents.NON_PRIVILEGED }
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
    bot.setInterval(() => { this.updateStatus(this.updateStatusCount++) }, 30000)

    Response.events(bot);
  }

  login(token) {
    this.bot.login(token)
      .catch(console.error);
  }

  updateStatus(count) {
    const bot = this.bot;
    console.log(count);

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
