const Discord = require('discord.js');

class QuickPoll {
  constructor(shards = 0, shardCount = 1) {
    this.shards = shards;
    this.shardCount = shardCount;

    const client = this.client = new Discord.Client({
      shards: shards,
      shardCount: shardCount,
      ws: {
        intents: ['GUILDS', 'GUILD_EMOJIS', 'GUILD_WEBHOOKS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGES']
      }
    });

    this.readyCount = 0;
    client.on('ready', () => {
      client.user.setPresence({
        activity: { name: `再接続されました(${++this.readyCount})` },
        status: 'dnd',
        shardID: shards
      }).catch(console.error);

      console.info(`Quick Poll(${(shards + 1) + '/' + shardCount}) has (re)started.`);
    });

    this.updateStatusCount = 0;
  }

  login(token) {
    this.client.login(token)
      .catch(console.error);

    setInterval(() => { this.updateStatus(this.updateStatusCount++) }, 30000);
  }

  updateStatus(count) {
    const client = this.client;

    switch(count % 3) {
      case 0:
        client.user.setPresence({
          activity: { name: '/poll | ex/poll', type: 'LISTENING' },
          status: 'online',
          shardID: this.shards
        }).catch(console.error);
        break;
      case 1:
        client.user.setPresence({
          activity: { name: `${client.guilds.cache.size} サーバー`, type: 'WATCHING' },
          status: 'online',
          shardID: this.shards
        }).catch(console.error);
        break;
      case 2:
        client.user.setPresence({
          activity: { name: `${this.shards + 1} / ${this.shardCount} shards`, type: 'PLAYING' },
          status: 'online',
          shardID: this.shards
        }).catch(console.error);
        break;
    }
  }
}

module.exports = QuickPoll;
