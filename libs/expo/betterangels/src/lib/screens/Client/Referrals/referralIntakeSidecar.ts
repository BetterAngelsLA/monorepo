import {
  INTAKE_FIELDS,
  getIntakeField,
  type IntakeFieldDefinition,
  type StoredIntake,
} from './intakeFields';

/**
 * Compatibility adapter for intake stored in Referral.notes. Preserve the v1
 * wire format and older answers until the backend supplies dedicated storage.
 * This is the transport boundary; field behavior belongs in intakeFields.ts.
 */
const START = '\n\n<<<referral-intake:v1>>>\n';
const END = '\n<<<end-referral-intake>>>';

export const PII_KEYS = INTAKE_FIELDS.filter((field) => field.sensitive).map(
  (field) => field.key,
);
export type Intake = StoredIntake;

// Preserve the v1 convention: false and empty collections mean unanswered.
function isEmpty(value: unknown): boolean {
  return (
    value == null ||
    value === '' ||
    value === false ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function encodeReferralNotes(
  humanNotes: string,
  intake: Intake,
  definitions: readonly IntakeFieldDefinition[] = INTAKE_FIELDS,
): string {
  const directNotes: string[] = [];
  const fields: Intake = {};
  const pii: Intake = {};

  for (const [key, value] of Object.entries(intake ?? {})) {
    if (isEmpty(value)) continue;
    const definition = getIntakeField(key, definitions);
    const mapping = definition?.backend;
    if (mapping?.mode === 'unmapped') continue;
    if (mapping?.mode === 'direct') {
      if (typeof value === 'string' && value.trim())
        directNotes.push(value.trim());
      continue;
    }

    // Unknown fields may have been saved by another version. Carry them forward.
    const payloadKey = mapping?.payloadKey ?? key;
    const bucket = definition?.sensitive ? pii : fields;
    bucket[payloadKey] = value;
  }

  const clean = [...directNotes, (humanNotes ?? '').trim()]
    .filter(Boolean)
    .join('\n');
  if (Object.keys(fields).length === 0 && Object.keys(pii).length === 0) {
    return clean;
  }
  const payload = JSON.stringify({ v: 1, fields, PII: pii });
  return `${clean}${START}${payload}${END}`;
}

function isRecord(value: unknown): value is StoredIntake {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type ParsedPayload = { fields: StoredIntake; pii: StoredIntake };

function parsePayload(candidate: string): ParsedPayload | null {
  try {
    const parsed: unknown = JSON.parse(candidate);
    if (!isRecord(parsed) || parsed.v !== 1) return null;
    const fields = parsed.fields ?? {};
    const pii = parsed.PII ?? {};
    if (!isRecord(fields) || !isRecord(pii)) return null;
    return { fields, pii };
  } catch {
    return null;
  }
}

// Only strip a marker with no closing sentinel when what follows is actually a
// payload. A user can type the marker into the notes, and that text is theirs.
function looksLikePayload(candidate: string): boolean {
  try {
    JSON.parse(candidate.trim());
    return true;
  } catch {
    return false;
  }
}

// Built with Object.fromEntries, not remeda's `mapKeys`: the keys come from
// server-stored notes, and mapKeys drops an own `__proto__` key and replaces
// the result's prototype instead of preserving the key as data.
function toIntake(
  payload: ParsedPayload,
  definitions: readonly IntakeFieldDefinition[],
): Intake {
  const merged = { ...payload.fields, ...payload.pii };
  return Object.fromEntries(
    Object.entries(merged).map(([payloadKey, value]) => {
      const field = definitions.find(
        (candidate) =>
          candidate.backend.mode === 'notesSidecar' &&
          candidate.backend.payloadKey === payloadKey,
      );
      return [field?.key ?? payloadKey, value];
    }),
  );
}

export function decodeReferralNotes(
  raw: string | null | undefined,
  definitions: readonly IntakeFieldDefinition[] = INTAKE_FIELDS,
): { humanNotes: string; intake: Intake } {
  const text = raw ?? '';
  // Human notes are stored before the payload; take the last marker so a literal
  // marker typed into the notes cannot shadow the real payload.
  const startIdx = text.lastIndexOf(START);
  if (startIdx === -1) return { humanNotes: text.trim(), intake: {} };

  const before = text.slice(0, startIdx).trim();
  const endIdx = text.indexOf(END, startIdx);
  if (endIdx === -1) {
    // No closing sentinel: strip only when the remainder really is a payload,
    // otherwise the "marker" was typed into the notes and everything after it
    // belongs to the user.
    if (!looksLikePayload(text.slice(startIdx + START.length))) {
      return { humanNotes: text.trim(), intake: {} };
    }
    return { humanNotes: before, intake: {} };
  }

  const humanNotes = [before, text.slice(endIdx + END.length).trim()]
    .filter(Boolean)
    .join('\n');
  const payload = parsePayload(text.slice(startIdx + START.length, endIdx));
  if (!payload) {
    // Do not expose malformed payloads. The original stored string is untouched.
    return { humanNotes, intake: {} };
  }
  return { humanNotes, intake: toIntake(payload, definitions) };
}

/** Collect direct notes and sidecar answers according to each field's mapping. */
export function buildReferralNotes(
  intakeValues: Intake,
  pickerNotes?: string,
): string | undefined {
  return encodeReferralNotes(pickerNotes ?? '', intakeValues) || undefined;
}

export function stripSidecar(raw: string | null | undefined): string {
  return decodeReferralNotes(raw).humanNotes;
}

/** Human label for a stored value; falls back to the wire value. */
function displayValue(
  field: IntakeFieldDefinition | undefined,
  value: unknown,
): string {
  if (typeof value === 'string' && field?.control === 'multiselect') {
    return (
      field.options.find((option) => option.value === value)?.label ?? value
    );
  }
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return String(value);
}

/** Field label for a stored key; falls back to the wire key. */
function displayKey(
  key: string,
  definitions: readonly IntakeFieldDefinition[],
): string {
  return getIntakeField(key, definitions)?.label ?? key;
}

/**
 * Legacy summary wording, now in the form's vocabulary rather than raw enum
 * wire values (`Storage needed: Amnesty Lockers`, not `storage: AMNESTY_LOCKERS`).
 * Sensitivity still comes from the field definition.
 */
export function summarizeIntake(
  intake: Intake,
  opts?: { maskPII?: boolean },
  definitions: readonly IntakeFieldDefinition[] = INTAKE_FIELDS,
): string {
  const mask = opts?.maskPII ?? true;
  return Object.entries(intake ?? {})
    .filter(([, value]) => !isEmpty(value))
    .map(([key, value]) => {
      const field = getIntakeField(key, definitions);
      const label = displayKey(key, definitions);
      if (mask && field?.sensitive) {
        return `${label}: ••••`;
      }
      if (Array.isArray(value)) {
        return `${label}: ${value
          .map((item) => displayValue(field, item))
          .join(', ')}`;
      }
      return `${label}: ${displayValue(field, value)}`;
    })
    .join(' · ');
}
