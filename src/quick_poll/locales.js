'use strict';

const fs = require('fs');
const yaml = require('js-yaml');

const constants = require('./constants');
const variables = { ...process.env, ...constants };

const replacer = (match, key, vars = variables) => { return vars[key] ?? match; }

const localesData = () => {
  let data = fs.readFileSync(`${__dirname}/locales/locales.yml`, 'utf-8');

  data = data.replace(/\$\{(\w+)\}/g, (match, key) => replacer(match, key));

  return yaml.safeLoad(data);
}

exports.locales = localesData();

exports.varsResolve = (string, vars = {}) => {
  return string.replace(/\$\{(\w+)\}/g, (match, key) => replacer(match, key, vars));
}
