'use strict';

module.exports = class Admin {
  static events(bot) {
    const adminIds = process.env.ADMIN_USER_IDS.split(',');
    const evalRegex = new RegExp(`^<@!?${bot.user.id}> admin\\n\`\`\`\\n(.+)\\n\`\`\``, 's');

    bot.on('message', message => {
      if (message.channel.type !== 'dm') return;
      if (!adminIds.includes(message.author.id)) return;

      const matchedCode = message.content.match(evalRegex);
      if (!matchedCode) return;

      this.execute(message.channel, matchedCode[1]);
    });
  }

  static execute(channel, code) {
    const bot = channel.client;
    let result = '';

    try { result = String(JSON.stringify(eval(code), null, 2)); }
    catch (error) { result = String(error); }

    this.split(result, 2000).forEach(content => {
      channel.send(content)
        .catch(console.error);
    });
  }

  static split(content, limit) {
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
