'use strict';

const { locales } = require('./locales');

module.exports = class CommandError {
  constructor(response, exception, lang) {
    const errors = locales[lang].errors;
    const error = typeof exception === 'string' && errors.poll[exception] || errors.unexpect;
    const infomation = locales[lang].errors.infomation;

    this.response = response;
    this.title = error.title;
    this.description = `${error.description ?? ''}\n\n${infomation}`;
  }
}
