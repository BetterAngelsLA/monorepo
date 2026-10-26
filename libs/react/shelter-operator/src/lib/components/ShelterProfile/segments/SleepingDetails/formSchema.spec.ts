import { RoomStyleChoices } from '@monorepo/react/shelter';
import { formSchema } from './formSchema';

const baseValues = {
  totalBeds: null,
  roomStyles: [],
  roomStylesOther: null,
  addNotesSleepingDetails: '',
};

function issuePaths(result: ReturnType<typeof formSchema.safeParse>): string[] {
  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => issue.path.join('.'));
}

describe('SleepingDetails formSchema — Other field pairs', () => {
  it('requires roomStylesOther when roomStyles includes Other', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      roomStyles: [RoomStyleChoices.Other],
      roomStylesOther: null,
    });

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual(['roomStylesOther']);
  });

  it('rejects whitespace-only roomStylesOther', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      roomStyles: [RoomStyleChoices.Other],
      roomStylesOther: '\t ',
    });

    expect(issuePaths(result)).toEqual(['roomStylesOther']);
  });

  it('accepts a filled roomStylesOther and trims it', () => {
    const result = formSchema.safeParse({
      ...baseValues,
      roomStyles: [RoomStyleChoices.Other],
      roomStylesOther: '  Sleeping pods  ',
    });

    if (!result.success) {
      throw new Error(JSON.stringify(result.error.issues));
    }

    expect(result.data.roomStylesOther).toBe('Sleeping pods');
  });

  it('does not require roomStylesOther when Other is not selected', () => {
    const result = formSchema.safeParse(baseValues);

    expect(result.success).toBe(true);
  });
});
