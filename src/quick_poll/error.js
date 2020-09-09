'use strict';

const { locales, resolveVars } = require('./locales');

module.exports = class CommandError {
  constructor(response, exception, lang, vars = {}) {
    const errors = locales[lang].errors;
    const error = typeof exception === 'string' && errors.poll[exception] || errors.unexpect;
    const infomation = locales[lang].errors.infomation;

    this.response = response;
    this.title = resolveVars(error.title, vars);
    this.description = `${error.description ?? ''}\n\n${infomation}`;
    this.description = resolveVars(this.description, vars);
  }
}
