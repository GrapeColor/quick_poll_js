import fs from 'fs';
import yaml from 'js-yaml';

import { constants } from './constants';

const replacer = (match: string, key: string, vars: any = constants) => {
  return vars[key] ?? match;
}

const localesData: () => any = () => {
  let data = fs.readFileSync(`${__dirname}/locales/locales.yml`, 'utf-8');

  data = data.replace(/\$\{(\w+)\}/g, (match, key) => replacer(match, key));

  return yaml.safeLoad(data);
}

export const locales = localesData();

export const resolveVars = (string: string, vars = {}) => {
  return string.replace(/\$\{(\w+)\}/g, (match, key) => replacer(match, key, vars));
}
