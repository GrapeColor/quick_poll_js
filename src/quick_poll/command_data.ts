import { Client, Message } from 'discord.js';

export default interface CommandData {
  bot: Client;
  lang: string;
  message: Message;
  prefix: string;
  exclusive: boolean;
  name: string;
  args: string[];
}
