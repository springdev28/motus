// Retire the exact bundled demo without deleting projects people have edited.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}
export function projectFingerprint(value: Record<string, unknown>) {
  const { updatedAt: _updatedAt, ...project } = value;
  const text = canonical(project);
  let first = 2166136261;
  let second = 5381;
  for (let i = 0; i < text.length; i++) {
    first = Math.imul(first ^ text.charCodeAt(i), 16777619);
    second = Math.imul(second, 33) ^ text.charCodeAt(i);
  }
  return `${text.length}:${first >>> 0}:${second >>> 0}`;
}
export function isUntouchedRetiredDemo(encoded: string | null) {
  if (!encoded) return false;
  try {
    const value = JSON.parse(encoded);
    return (
      value?.id === 'signal-in-the-fog' &&
      projectFingerprint(value) === '12779:1492614431:2884831855'
    );
  } catch {
    return false;
  }
}

export function isRetiredTestEdition(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.projectId !== 'motus-sharing-browser-check-20260907') return false;
  return RETIRED_EDITION_HASHES.includes(projectFingerprint(record));
}
const RETIRED_EDITION_HASHES: readonly string[] = [
  '12869:2092501587:2326482975',
  '12837:3505606882:4139637178',
];
