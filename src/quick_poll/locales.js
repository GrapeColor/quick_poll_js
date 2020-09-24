import path from 'path';
import fs from'fs';
import yaml from 'js-yaml';

import { CONST } from './const.js';

/**
 * Replace variables.
 * @param {string} match 
 * @param {string} key 
 * @param {Object.<string, string>} vars 
 */
const replacer = (match, key, vars = CONST) => vars[key] ?? match;

const localesData = () => {
  let data = fs.readFileSync(
    path.resolve('src/quick_poll/locales/locales.yml'), 'utf-8'
  );

  data = data.replace(/\$\{(\w+)\}/g, (match, key) => replacer(match, key));

  return yaml.safeLoad(data);
}

export const locales = localesData();

/**
 * Resolve the variable later.
 * @param {string} string 
 * @param {Object.<string, string>} vars 
 */
export const resolveVars = (string, vars = {}) => {
  return string.replace(/\$\{(\w+)\}/g, (match, key) => replacer(match, key, vars));
}
