import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const tokenDirectory = path.resolve(scriptDirectory, '../../design-system/tokens');
const tokenFiles = [
  'primitives.tokens.json',
  'typography.tokens.json',
  'semantic.tokens.json',
  'themes/light.tokens.json',
  'themes/dark.tokens.json',
];

function isAlias(value) {
  return typeof value === 'string' && /^\{[^{}]+\}$/.test(value);
}

function aliasPath(value) {
  return value.slice(1, -1);
}

/** Load every DTCG token document, retaining its relative file path. */
export function loadTokenFiles(directory = tokenDirectory) {
  return tokenFiles.map((file) => ({
    file,
    document: JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')),
  }));
}

/** Flatten nested DTCG groups to token paths, including theme-qualified paths. */
export function flattenGroups(documents) {
  const result = [];

  function visit(value, prefix, file) {
    for (const [key, item] of Object.entries(value)) {
      if (key.startsWith('$')) continue;
      const tokenPath = prefix ? `${prefix}.${key}` : key;
      if (item && typeof item === 'object' && '$value' in item) {
        result.push({ path: tokenPath, ...item, file });
      } else if (item && typeof item === 'object') {
        visit(item, tokenPath, file);
      }
    }
  }

  for (const { file, document } of documents) {
    const prefix = file.startsWith('themes/')
      ? `themes.${path.basename(file).split('.')[0]}`
      : '';
    visit(document, prefix, file);
  }

  return result;
}

function validateValue(value, type, token) {
  let valid = true;
  if (type === 'color') {
    valid = typeof value === 'string' && /^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value);
  } else if (type === 'dimension') {
    // Layout dimensions also allow the contract's clamp() expressions.
    valid = typeof value === 'string'
      && /^(?:0|-?(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em)|clamp\(.+\))$/.test(value);
  } else if (type === 'fontWeight') {
    valid = typeof value === 'number' && value >= 1 && value <= 1000;
  } else if (type === 'lineHeight') {
    valid = typeof value === 'number' && value > 0;
  }

  if (!valid) {
    throw new Error(
      `${token.file}: ${token.path}: invalid $value for ${type}: ${JSON.stringify(value)}`,
    );
  }
}

function compareThemeKeys(documents) {
  const themes = documents.filter((document) => document.file.startsWith('themes/'));
  if (themes.length !== 2) return;

  const getKeys = (document) => flattenGroups([document])
    .map((token) => token.path.replace(/^themes\.(?:light|dark)\./, ''))
    .sort();
  const lightKeys = getKeys(themes[0]);
  const darkKeys = getKeys(themes[1]);
  if (JSON.stringify(lightKeys) === JSON.stringify(darkKeys)) return;

  const missing = lightKeys.find((key) => !darkKeys.includes(key))
    ?? darkKeys.find((key) => !lightKeys.includes(key));
  throw new Error(
    `${themes[1].file}: ${missing}: semantic colour key missing or extra `
      + `compared with ${themes[0].file}`,
  );
}

/** Resolve aliases recursively and validate all token values. */
export function resolveTokens(documents) {
  const tokens = flattenGroups(documents);
  const tokenMap = new Map(tokens.map((token) => [token.path, token]));

  function resolve(token, stack = []) {
    if (stack.includes(token.path)) {
      throw new Error(
        `${token.file}: ${token.path}: cyclic alias (${[...stack, token.path].join(' -> ')})`,
      );
    }

    const value = token.$value;
    if (isAlias(value)) {
      const reference = aliasPath(value);
      const target = tokenMap.get(reference);
      if (!target) {
        throw new Error(`${token.file}: ${token.path}: broken alias {${reference}}`);
      }
      return resolve(target, [...stack, token.path]);
    }

    if (token.$type === 'typography') {
      const composite = {};
      for (const [key, fieldValue] of Object.entries(value)) {
        if (isAlias(fieldValue)) {
          const reference = aliasPath(fieldValue);
          const target = tokenMap.get(reference);
          if (!target) {
            throw new Error(`${token.file}: ${token.path}.${key}: broken alias ${fieldValue}`);
          }
          composite[key] = resolve(target, [...stack, token.path]);
          continue;
        }

        const fieldTypes = {
          fontSize: 'dimension',
          letterSpacing: 'dimension',
          fontWeight: 'fontWeight',
          lineHeight: 'lineHeight',
        };
        if (fieldTypes[key]) {
          validateValue(fieldValue, fieldTypes[key], {
            ...token,
            path: `${token.path}.${key}`,
          });
        }
        composite[key] = fieldValue;
      }
      return composite;
    }

    if (token.$type) validateValue(value, token.$type, token);
    return value;
  }

  const values = Object.fromEntries(tokens.map((token) => [token.path, resolve(token)]));
  compareThemeKeys(documents);
  return { tokens, values };
}
