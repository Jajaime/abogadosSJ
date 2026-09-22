/// lib/documents/demanda/template/paragraphUtils.js

export function normalizeParagraph(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/^[ \t]+|[ \t]+$/gm, '')
    .trim();
}

export function cleanParagraphs(items = []) {
  return items
    .map(normalizeParagraph)
    .filter(Boolean);
}

export function joinParagraphs(items = []) {
  return cleanParagraphs(items).join('\n\n');
}

export function flattenSections(sections = {}) {
  return [
    ...(sections.encabezado ?? []),
    ...(sections.hechos ?? []),
    ...(sections.derecho ?? []),
    ...(sections.peticiones ?? []),
    ...(sections.otrosi ?? []),
  ];
}

export function sectionsToSingleText(sections = {}) {
  return joinParagraphs(flattenSections(sections));
}