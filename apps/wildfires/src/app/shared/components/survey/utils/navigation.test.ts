import { describe, expect, expectTypeOf, it } from 'vitest';
import { TAnswer } from '../types';
import { matchesRule } from './navigation';

describe('survey conditions', () => {
  it.each([{ result: '' }, { result: [] }])(
    'does not treat an empty selection as an existing answer: $result',
    ({ result }) => {
      expect(
        matchesRule({ type: 'answerExists', questionId: 'q' }, [
          { questionId: 'q', result },
        ]),
      ).toBe(false);
    },
  );
  it('does not treat a missing answer as existing', () => {
    expect(matchesRule({ type: 'answerExists', questionId: 'q' }, [])).toBe(
      false,
    );
  });
  it('matches whole checkbox values rather than substrings in radio values', () => {
    const rule = {
      type: 'answerIncludes' as const,
      questionId: 'q',
      value: 'a',
    };
    expect(matchesRule(rule, [{ questionId: 'q', result: 'abc' }])).toBe(false);
    expect(matchesRule(rule, [{ questionId: 'q', result: ['abc'] }])).toBe(
      false,
    );
    expect(matchesRule(rule, [{ questionId: 'q', result: ['a'] }])).toBe(true);
  });
  it('matches radio values exactly', () => {
    const rule = { type: 'answerEquals' as const, questionId: 'q', value: 'a' };
    expect(matchesRule(rule, [{ questionId: 'q', result: ['a'] }])).toBe(false);
    expect(matchesRule(rule, [{ questionId: 'q', result: 'a' }])).toBe(true);
  });
  it('distinguishes radio and checkbox answer types while keeping the stored format', () => {
    expectTypeOf<TAnswer<'radio'>['result']>().toEqualTypeOf<string>();
    expectTypeOf<TAnswer<'checkbox'>['result']>().toEqualTypeOf<string[]>();
    expectTypeOf<TAnswer['result']>().toEqualTypeOf<string | string[]>();
  });
});
