import { Client, Message } from 'discord.js';

export default class CommandData {
  /**
   * Command data.
   * @param {Client} bot This bot client.
   * @param {string} lang Language setting.
   * @param {Message} message Command message.
   * @param {string} prefix Command prefix.
   * @param {boolean} exclusive Is it exclusive.
   * @param {string} name Command name.
   * @param {string[]} args Command arguments.
   */
  constructor(bot, lang, message, prefix, exclusive = false, name = '', args = []) {
    this.bot = bot;
    this.lang = lang;
    this.message = message;
    this.prefix = prefix;
    this.exclusive = exclusive;
    this.name = name;
    this.args = args;
  }
}
