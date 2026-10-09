import { describe, expect, it } from 'vitest';
import { NEW_SHEET_FLAGS } from '../../constants';
import { TSheet, TSheetFlags } from '../../types';
import { resolveSheetsToClose } from './resolveSheetsToClose';

function makeSheet(
  id: string,
  stackBehavior: TSheet['stackBehavior'],
  flags: Partial<TSheetFlags> = {},
): TSheet {
  return {
    id,
    render: () => null,
    options: {},
    stackBehavior,
    ...NEW_SHEET_FLAGS,
    ...flags,
  };
}

const idsOf = (sheets: TSheet[]) => sheets.map((sheet) => sheet.id);

describe('resolveSheetsToClose', () => {
  it("'push' closes nothing", () => {
    const sheets = [makeSheet('a', 'replace'), makeSheet('b', 'push')];

    expect(resolveSheetsToClose(sheets)).toEqual([]);
  });

  it("'switch' closes the sheet directly below the top", () => {
    const sheets = [
      makeSheet('a', 'replace'),
      makeSheet('b', 'push'),
      makeSheet('c', 'switch'),
    ];

    expect(idsOf(resolveSheetsToClose(sheets))).toEqual(['b']);
  });

  it("'replace' closes every other live sheet", () => {
    const sheets = [
      makeSheet('a', 'replace'),
      makeSheet('b', 'push'),
      makeSheet('c', 'replace'),
    ];

    expect(idsOf(resolveSheetsToClose(sheets))).toEqual(['a', 'b']);
  });

  it('ignores sheets that are already closing', () => {
    const sheets = [
      makeSheet('a', 'replace', { closing: true, dismissed: true }),
      makeSheet('b', 'replace'),
    ];

    // `a` is on its way out: not returned, and not mistaken for the top.
    expect(resolveSheetsToClose(sheets)).toEqual([]);
  });

  it('closes nothing when there is no live sheet', () => {
    expect(resolveSheetsToClose([])).toEqual([]);
    expect(
      resolveSheetsToClose([makeSheet('a', 'replace', { closing: true })]),
    ).toEqual([]);
  });
});
