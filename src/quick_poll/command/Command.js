import { CommandData } from './CommandManager.js';
import CommandError from './CommandError.js';

export default class Command {
  /**
   * Issue the command.
   * @param {CommandData} commandData 
   */
  constructor(commandData) {
    this.bot = commandData.bot;
    this.lang = commandData.lang;
    this.message = commandData.message;
    this.prefix = commandData.prefix;
    this.exclusive = commandData.exclusive;
    this.name = commandData.name;
    this.args = commandData.args;
    this.response = commandData.response;

    this.editable = false;

    this.texts = undefined;

    this.user = this.message.author;
    this.channel = this.message.channel;

    this.guild = undefined;
    this.permissions = undefined;
    this.member = undefined;

    if (this.channel.type !== 'dm') {
      this.guild = this.channel.guild;
      this.permissions = this.channel.permissionsFor(this.bot.user);

      this.guild.members.fetch(this.user)
        .then(member => this.member = member)
        .catch(console.error);
    }
  }

  async exec() {
    try {
      await this.commandExec();
    } catch (error) {
      throw new CommandError(this.response, error, this.lang);
    }

    return this.response;
  }

  async commandExec() { undefined; }
}
