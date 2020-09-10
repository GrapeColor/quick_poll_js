import { Client, DMChannel } from 'discord.js';

export default class Admin {
  static events(bot: Client) {
    const adminIDs = String(process.env.ADMIN_USER_IDS).split(',');
    const evalRegex = /^admin\s```\n?(.+)\n?```/s;

    bot.on('message', message => {
      if (message.channel.type !== 'dm') return;
      if (!adminIDs.includes(message.author.id)) return;

      const matchedCode = message.content.match(evalRegex);
      if (!matchedCode) return;

      this.execute(message.channel, matchedCode[1]);
    });
  }

  static execute(channel: DMChannel, code: string) {
    const bot = channel.client;
    let result = '';

    try { result = String(JSON.stringify(eval(code), null, 2)); }
    catch (error) { result = String(error); }

    this.split(result, 2000).forEach(content => {
      channel.send(content)
        .catch(console.error);
    });
  }

  static split(content: string, limit: number) {
    const contents = [];
    let part = '```';

    for (const match of content.matchAll(/.*\n?/g)) {
      if (part.length + match[0].length > limit - 3) {
        contents.push(`${part}\`\`\``);
        part = '```';
      }
      part += match[0];
    }

    contents.push(`${part}\`\`\``);

    return contents;
  }
}
