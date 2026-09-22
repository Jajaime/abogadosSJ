/// lib/documents/demanda/index.js

export { resolveTerminationCase } from './resolver/resolveTerminationCase';
export { validateTerminationCase } from './resolver/validators';
export { normalizeTerminationData } from './resolver/normalize';
export { CASE_KEYS, DISCIPLINARY_KEYS, createClauseResult } from './types';
export { buildDemandaDocument } from './buildDemandaDocument';
export { buildTemplateData } from './template/buildTemplateData';