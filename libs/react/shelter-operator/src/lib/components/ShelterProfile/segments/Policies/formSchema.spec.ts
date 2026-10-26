import { ExitPolicyChoices } from '@monorepo/react/shelter';
import { formSchema } from './formSchema';

const baseValues = {
  maxStay: null,
  onSiteSecurity: null,
  visitorsAllowed: null,
  emergencySurge: null,
  exitPolicy: [],
  exitPolicyOther: null,
  otherRules: null,
};

function issuePaths(result: ReturnType<typeof formSchema.safeParse>): string[] {
  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => issue.path.join('.'));
}

describe('Policies formSchema — Other field pairs', () => {
  it('requires exitPolicyOther when exitPolicy includes Other', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      exitPolicy: [ExitPolicyChoices.Other],
      exitPolicyOther: null,
    });

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual(['exitPolicyOther']);
  });

  it('rejects whitespace-only exitPolicyOther', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      exitPolicy: [ExitPolicyChoices.Other],
      exitPolicyOther: '  ',
    });

    expect(issuePaths(result)).toEqual(['exitPolicyOther']);
  });

  it('accepts a filled exitPolicyOther and trims it', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      exitPolicy: [ExitPolicyChoices.Other],
      exitPolicyOther: '  Time limit  ',
    });

    if (!result.success) {
      throw new Error(JSON.stringify(result.error.issues));
    }

    expect(result.data.exitPolicyOther).toBe('Time limit');
  });

  it('does not require exitPolicyOther when Other is not selected', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      exitPolicy: [],
    });

    expect(result.success).toBe(true);
  });
});
