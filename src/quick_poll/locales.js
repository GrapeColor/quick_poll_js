'use strict';

const fs = require('fs');
const yaml = require('js-yaml');

exports.locales = yaml.safeLoad(fs.readFileSync(`${__dirname}/locales/locales.yml`, 'utf-8'));
