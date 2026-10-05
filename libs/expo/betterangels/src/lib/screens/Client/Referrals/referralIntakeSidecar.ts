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
  if (endIdx === -1) return { humanNotes: before, intake: {} };
  const humanNotes = [before, text.slice(endIdx + END.length).trim()]
    .filter(Boolean)
    .join('\n');

  try {
    const parsed: unknown = JSON.parse(
      text.slice(startIdx + START.length, endIdx),
    );
    if (!isRecord(parsed) || parsed.v !== 1) return { humanNotes, intake: {} };
    const fields = parsed.fields ?? {};
    const pii = parsed.PII ?? {};
    if (!isRecord(fields) || !isRecord(pii)) return { humanNotes, intake: {} };

    const intake: Intake = {};
    for (const [payloadKey, value] of Object.entries({ ...fields, ...pii })) {
      const definition = definitions.find(
        (field) =>
          field.backend.mode === 'notesSidecar' &&
          field.backend.payloadKey === payloadKey,
      );
      intake[definition?.key ?? payloadKey] = value;
    }
    return { humanNotes, intake };
  } catch {
    // Do not expose malformed payloads. The original stored string is untouched.
    return { humanNotes, intake: {} };
  }
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

/** Keep legacy summary wording; sensitivity comes from the field definition. */
export function summarizeIntake(
  intake: Intake,
  opts?: { maskPII?: boolean },
  definitions: readonly IntakeFieldDefinition[] = INTAKE_FIELDS,
): string {
  const mask = opts?.maskPII ?? true;
  return Object.entries(intake ?? {})
    .filter(([, value]) => !isEmpty(value))
    .map(([key, value]) => {
      let display: string;
      if (mask && getIntakeField(key, definitions)?.sensitive) {
        display = '••••';
      } else if (Array.isArray(value)) {
        display = value.join(', ');
      } else {
        display = String(value);
      }
      return `${key}: ${display}`;
    })
    .join(' · ');
}
