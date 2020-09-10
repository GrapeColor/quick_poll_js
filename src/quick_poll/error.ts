import { Message } from 'discord.js';

import { locales, resolveVars } from './locales';

export default class CommandError {
  response: Message | undefined;
  exception: any;
  title: String;
  description: string;

  constructor(response: Message | undefined, exception: any, lang: string, vars = {}) {
    const errors = locales[lang].errors;
    const error = typeof exception === 'string' && errors.poll[exception] || errors.unexpect;
    const infomation = locales[lang].errors.infomation;

    this.response = response;
    this.exception = exception;

    this.title = resolveVars(error.title, vars);
    this.description = `${error.description ?? ''}\n\n${infomation}`;
    this.description = resolveVars(this.description, vars);
  }
}
