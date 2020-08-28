'use strict';

const { locales } = require('./locales');

class PollError {
  constructor(exception, lang = 'ja', variables = {}) {
    const error = locales[lang].errors.poll[exception];
    const infomation = locales[lang].errors.infomation;

    let title = error.title;
    let description = `${error.description ?? ''}\n\n${infomation}`;

    variables = { ...variables, ...process.env };

    title = title.replace(/\$\{(\w+)\}/g, (_, key) => this.replacer(variables, key));
    description = description.replace(/\$\{(\w+)\}/g, (_, key) => this.replacer(variables, key));

    this.title = title;
    this.description = description;
  }

  replacer(variables, key) { return `${variables[key] ?? '' }`; }
}

module.exports = PollError;
