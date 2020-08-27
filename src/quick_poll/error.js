'use strict';

const { locales } = require('./locales');
const errors = locales.ja.poll.error;

class PollError {
  constructor(exception) {
    const error = errors[exception];
    this.title = error.title;
    this.description = error.description;
  }
}

module.exports = PollError;
