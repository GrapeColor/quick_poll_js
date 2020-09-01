'use strict';

const { locales } = require('./locales');

module.exports = class PollError {
  constructor(response, exception, lang = 'ja', variables = {}) {
    this.response = response;

    const errors = locales[lang].errors;
    const error = errors.poll[exception] ?? errors.unexpect;
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
