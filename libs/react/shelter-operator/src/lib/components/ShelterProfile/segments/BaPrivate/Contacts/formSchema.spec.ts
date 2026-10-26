import { contactFormSchema } from './formSchema';

const baseValues = {
  contactName: 'Jane Doe',
  contactNumber: '212-555-5555',
  isClaimant: false,
};

function issuePaths(
  result: ReturnType<typeof contactFormSchema.safeParse>,
): string[] {
  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => issue.path.join('.'));
}

describe('Contacts formSchema', () => {
  it('trims contactTitle', () => {
    const result = contactFormSchema.safeParse({
      ...baseValues,
      contactTitle: '  Executive Director  ',
    });

    if (!result.success) {
      throw new Error(JSON.stringify(result.error.issues));
    }

    expect(result.data.contactTitle).toBe('Executive Director');
  });

  it('measures the 255 limit after trimming', () => {
    const result = contactFormSchema.safeParse({
      ...baseValues,
      contactTitle: `  ${'a'.repeat(255)}  `,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a contactTitle longer than 255 characters', () => {
    const result = contactFormSchema.safeParse({
      ...baseValues,
      contactTitle: 'a'.repeat(256),
    });

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual(['contactTitle']);
  });

  it('allows an empty contactTitle', () => {
    const result = contactFormSchema.safeParse({
      ...baseValues,
      contactTitle: '   ',
    });

    if (!result.success) {
      throw new Error(JSON.stringify(result.error.issues));
    }

    expect(result.data.contactTitle).toBe('');
  });

  it('trims contactName and still requires it', () => {
    const trimmed = contactFormSchema.safeParse({
      ...baseValues,
      contactName: '  Jane Doe  ',
      contactTitle: '',
    });

    if (!trimmed.success) {
      throw new Error(JSON.stringify(trimmed.error.issues));
    }

    expect(trimmed.data.contactName).toBe('Jane Doe');

    const blank = contactFormSchema.safeParse({
      ...baseValues,
      contactName: '   ',
      contactTitle: '',
    });

    expect(blank.success).toBe(false);
  });
});
