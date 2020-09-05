'use strict';

const { locales, varsResolve } = require('./locales');

module.exports = class CommandError {
  constructor(response, exception, lang, vars = {}) {
    const errors = locales[lang].errors;
    const error = typeof exception === 'string' && errors.poll[exception] || errors.unexpect;
    const infomation = locales[lang].errors.infomation;

    this.response = response;
    this.title = varsResolve(error.title, vars);
    this.description = `${error.description ?? ''}\n\n${infomation}`;
    this.description = varsResolve(this.description, vars);
  }
}
