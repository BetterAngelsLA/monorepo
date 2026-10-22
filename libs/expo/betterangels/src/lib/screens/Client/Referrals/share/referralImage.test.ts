import {
  captureReferralImage,
  layoutReferralImage,
  wrapReferralImageText,
} from './referralImage';
import {
  buildReferralDocumentCopy,
  buildReferralTextCopy,
  type ExportReferral,
} from './referralExport';
import { encodeReferralNotes } from '../shared/referralIntakeSidecar';
import { AdaAccommodationEnum } from '../../../../apollo';
import { INTAKE_FIELDS } from '../../../../draft/intakeFields';
import { Colors } from '@monorepo/expo/shared/static';

it('preserves the past-date label and red arrival value in PNG without recoloring other fields', () => {
  const copy = buildReferralDocumentCopy({
    referral: {
      __typename: 'ReferralType',
      id: 'past',
      createdAt: '2026-10-14T12:00:00Z',
      shelter: null,
      notes: encodeReferralNotes('', { requestedArrivalDate: '2026-10-14' }),
    },
    clientName: 'Fictional client',
    generatedAt: new Date(2026, 9, 19, 12).toISOString(),
  });
  const lines = layoutReferralImage(copy).lines;
  const red = lines.filter((line) => line.color === Colors.ERROR);
  expect(red.map((line) => line.text).join('')).toBe('2026-10-14 (Past)');
  expect(
    lines.find((line) => line.text === 'Referred:')?.color,
  ).toBeUndefined();
});

const privateFields = INTAKE_FIELDS.filter(
  (field) => field.sensitive || field.backend.mode === 'direct',
).map((field) => {
  const value =
    field.control === 'multiselect'
      ? [field.options[0].value]
      : `Fictional private ${field.key}`;
  const displayed =
    field.control === 'multiselect'
      ? field.options[0].label
      : `Fictional private ${field.key}`;
  return {
    label: `${field.label} [Sensitive]`,
    displayed,
    notes: encodeReferralNotes(
      field.backend.mode === 'direct' ? displayed : '',
      field.backend.mode === 'direct' ? {} : { [field.key]: value },
    ),
    profile: undefined,
  };
});

const source = {
  referral: {
    __typename: 'ReferralType',
    id: 'r1',
    status: null,
    shelter: null,
    createdBy: null,
    notes: encodeReferralNotes('Private staff note\nShelter: not a field', {
      substances: 'Private answer',
    }),
    createdAt: '2026-10-15T12:00:00Z',
  } satisfies ExportReferral,
  clientName: 'Ana Muñoz',
  generatedAt: '2026-10-15T12:30:00Z',
};

it('keeps the approved private intake fields in the export matrix if metadata changes', () => {
  expect(privateFields.map((field) => field.label)).toEqual(
    expect.arrayContaining([
      'Substances [Sensitive]',
      'Special Situations [Sensitive]',
      'Staff Observations / Notes [Sensitive]',
    ]),
  );
});

describe.each([false, true])(
  'complete export privacy matrix, inclusion %s',
  (includePrivate) => {
    it.each([
      ...privateFields,
      {
        label: 'Accommodations [Sensitive]',
        displayed: 'Mobility',
        notes: null,
        profile: { adaAccommodation: [AdaAccommodationEnum.Mobility] },
      },
    ])(
      'protects $label in both text and image output',
      ({ label, displayed, notes, profile }) => {
        const input = {
          ...source,
          referral: { ...source.referral, notes },
          profile,
          includePrivate,
        };
        const before = JSON.stringify(input);
        const document = buildReferralDocumentCopy(input);
        const value = includePrivate ? displayed : 'Excluded (sensitive)';
        expect(document.blocks).toContainEqual({ kind: 'field', label, value });
        expect(buildReferralTextCopy(input).text).toContain(
          `${label}: ${value}`,
        );
        // Inspect the full image's answer column, not just the shared model.
        const imageValues = layoutReferralImage(document)
          .lines.filter((line) => line.fontWeight === '400')
          .map((line) => line.text)
          .join('');
        expect(imageValues.includes(displayed)).toBe(includePrivate);
        expect(JSON.stringify(input)).toBe(before);
      },
    );
  },
);

it.each([false, true])(
  'uses the same reviewed information and privacy labels in image and text, inclusion %s',
  (includePrivate) => {
    const input = { ...source, includePrivate };
    const document = buildReferralDocumentCopy(input);
    expect({ title: document.title, text: document.text }).toEqual(
      buildReferralTextCopy(input),
    );
    const layout = layoutReferralImage(document);
    const rendered = layout.lines.map((line) => line.text).join('');
    expect(rendered).toContain('Ana Muñoz');
    expect(rendered).toContain('Substances [Sensitive]:');
    expect(rendered.includes('Private answer')).toBe(includePrivate);
    expect(rendered.includes('Private staff note')).toBe(includePrivate);
    expect(layout.outputWidth).toBe(1080);
    expect(layout.outputHeight).toBeLessThanOrEqual(8192);
    expect(
      layout.lines.some(
        (line) => line.text === 'Name:' && line.fontWeight === '700',
      ),
    ).toBe(true);
    expect(
      layout.lines.some(
        (line) => line.text === 'Ana Muñoz' && line.fontWeight === '400',
      ),
    ).toBe(true);
    if (includePrivate)
      expect(
        layout.lines.find((line) => line.text === 'Shelter: not a field')
          ?.fontWeight,
      ).toBe('400');
  },
);

it('preserves code points, long tokens, spaces, and explicit blank lines while wrapping', () => {
  const text = 'WWWWWW ñ 漢字 😀 '.repeat(10);
  expect(wrapReferralImageText(text, 12).join('')).toBe(text);
  expect(wrapReferralImageText('first\n\nlast', 12)).toEqual([
    'first',
    '',
    'last',
  ]);
  expect(
    wrapReferralImageText('W'.repeat(180), 20).every(
      (line) => line.length <= 20,
    ),
  ).toBe(true);
});

it('refuses oversized images rather than silently cutting off saved information', () => {
  const copy = buildReferralDocumentCopy(source);
  expect(() =>
    layoutReferralImage({
      ...copy,
      blocks: [{ kind: 'field', label: 'Notes', value: 'W'.repeat(20001) }],
    }),
  ).toThrow(/too large/);
  expect(() =>
    layoutReferralImage({
      ...copy,
      blocks: Array.from({ length: 1000 }, () => ({
        kind: 'note',
        text: 'Another full paragraph',
      })),
    }),
  ).toThrow(/too large/);
});

it('requests the full image dimensions from the existing renderer', async () => {
  const layout = layoutReferralImage(buildReferralDocumentCopy(source));
  const svg = {
    toDataURL: vi.fn((done: (data: string) => void) => done('png-result')),
  };
  await expect(captureReferralImage(svg, layout)).resolves.toBe('png-result');
  expect(svg.toDataURL).toHaveBeenCalledWith(expect.any(Function), {
    width: layout.outputWidth,
    height: layout.outputHeight,
  });
});

it('reports native rendering failures and missing callbacks without hanging', async () => {
  const layout = layoutReferralImage(buildReferralDocumentCopy(source));
  await expect(
    captureReferralImage(
      {
        toDataURL: () => {
          throw new Error('Native capture failed');
        },
      },
      layout,
    ),
  ).rejects.toThrow('Native capture failed');
  vi.useFakeTimers();
  try {
    const waiting = captureReferralImage(
      { toDataURL: () => undefined },
      layout,
    );
    const assertion = expect(waiting).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(10000);
    await assertion;
  } finally {
    vi.useRealTimers();
  }
});
