import { Client, Intents } from 'discord.js';

import { constants } from './constants';

import Command from './command';
import Admin from './admin';

export default class QuickPoll {
  shards: number;
  shardCount: number;
  bot: Client;

  readyCount: number;
  updateStatusCount: number;

  constructor(shards = 0, shardCount = 1) {
    this.shards = shards;
    this.shardCount = shardCount;

    const bot = this.bot = new Client({
      shards: shards,
      shardCount: shardCount,
      ws: { intents: Intents.NON_PRIVILEGED },
      partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION'],
      restTimeOffset: 100,
      messageCacheMaxSize: 1000
    });

    this.readyCount = 0;
    bot.on('shardReady', () => {
      bot.user?.setPresence({
        activity: { name: `再接続されました(${++this.readyCount})` },
        status: 'dnd',
        shardID: shards
      }).catch(console.error);

      console.info(`Quick Poll(${(shards + 1) + '/' + shardCount}) has (re)started.`);
    });

    this.updateStatusCount = 0;
    bot.setInterval(() => this.updateStatus(this.updateStatusCount++), 30000);
  }

  login(token: string) {
    this.bot.login(token)
      .then(() => this.entryEvents())
      .catch(console.error);
  }

  entryEvents() {
    Admin.events(this.bot);
    Command.events(this.bot);
  }

  updateStatus(count: number) {
    const bot = this.bot;
    const prefix = constants.DEFAULT_PREFIX;

    if (!bot.user) return;

    switch(count % 4) {
      case 0:
      case 1:
        bot.user.setPresence({
          activity: { name: `${prefix}poll | ex${prefix}poll`, type: 'LISTENING' },
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

import Poll from './commands/poll';

Command.addEvents(Poll.events);

Command.addCommands(Poll.commands);