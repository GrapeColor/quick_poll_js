'use strict';

class Admin {
  static events(bot) {
    const adminIds = process.env.ADMIN_USER_ID.split(',');
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

    try { result = JSON.stringify(eval(code), null, 2); }
    catch (error) { result = error.toString(); }

    this.split(result, 2000).forEach(content => {
      channel.send(content)
        .catch(console.error);
    });
  }

  static split(content, limit) {
    let contents = [];
    let part = '```';

    content.split('\n').forEach(line => {
      line += '\n';

      if (part.length + line.length > limit - 3) {
        contents.push(`${part}\`\`\``);
        part = '```';
      }

      part += line;
    });

    contents.push(`${part}\`\`\``);

    return contents;
  }
}

module.exports = Admin;
