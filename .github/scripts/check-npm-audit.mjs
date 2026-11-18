import { spawnSync } from 'node:child_process';

const ALLOWED = 'GHSA-fc5q-39xc-vjpf';

const result = spawnSync(
  'npm',
  ['audit', '--audit-level=low', '--json'],
  { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
);

if (result.error || ![0, 1].includes(result.status)) {
  console.error('No se pudo ejecutar npm audit.');
  process.exit(1);
}

let report;

try {
  report = JSON.parse(result.stdout);
} catch {
  console.error('Respuesta de npm audit inválida.');
  process.exit(1);
}

if (report.error || !report.vulnerabilities) {
  console.error('Auditoría incompleta.');
  process.exit(1);
}

const vulnerabilities = report.vulnerabilities;
const names = Object.keys(vulnerabilities);

function isAllowed(name, visited = new Set()) {
  const item = vulnerabilities[name];

  if (!item || visited.has(name) ||
      !Array.isArray(item.via) || !item.via.length) {
    return false;
  }

  const next = new Set(visited);
  next.add(name);

  return item.via.every((source) => {
    if (typeof source === 'string') {
      return isAllowed(source, next);
    }

    return name === 'picomatch' &&
      source.name === 'picomatch' &&
      source.url ===
        `https://github.com/advisories/${ALLOWED}`;
  });
}

const unexpected = names.filter(
  (name) => !isAllowed(name)
);

if (unexpected.length) {
  console.error('Vulnerabilidades no autorizadas:');
  console.error(unexpected.join(', '));
  process.exit(1);
}

if (names.length > 0) {
  console.warn(
    `Excepción temporal: ${ALLOWED}. ` +
    `${names.length} paquetes afectados.`
  );
} else {
  console.log('Auditoría completa sin vulnerabilidades.');
}
