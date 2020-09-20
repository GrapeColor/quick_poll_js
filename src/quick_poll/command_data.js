export default class CommandData {
  constructor(bot, lang, message, prefix, exclusive = undefined, name = undefined, args = []) {
    this.bot = bot;
    this.lang = lang;
    this.message = message;
    this.prefix = prefix;
    this.exclusive = exclusive;
    this.name = name;
    this.args = args;
  }
}
