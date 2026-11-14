import ja from './ja';
import en from './en';
import zh from './zh';

const CONTENT = { ja, en, zh };

export function getContent(lang) {
  return CONTENT[lang] || ja;
}
