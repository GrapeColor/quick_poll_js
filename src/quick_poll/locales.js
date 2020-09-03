'use strict';

const fs = require('fs');
const yaml = require('js-yaml');

const constants = require('./constants');
const variables = { ...process.env, ...constants };

const replacer = key => { return variables[key] ?? ''; }

const localesData = () => {
  let data = fs.readFileSync(`${__dirname}/locales/locales.yml`, 'utf-8');

  data = data.replace(/\$\{(\w+)\}/g, (_, key) => replacer(key));

  return yaml.safeLoad(data);
}

console.log(localesData());

exports.locales = localesData();
