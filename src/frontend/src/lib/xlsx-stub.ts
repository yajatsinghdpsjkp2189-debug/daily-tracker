// Stub for xlsx — real package not installed
export const SSF = {
  parse_date_code(_v: number): { y: number; m: number; d: number } | null {
    return null;
  },
};

export interface Sheet {
  [key: string]: unknown;
}

export interface Workbook {
  SheetNames: string[];
  Sheets: Record<string, Sheet>;
}

export function read(
  _data: ArrayBuffer,
  _opts: { type: string; cellDates?: boolean },
): Workbook {
  return { SheetNames: [], Sheets: {} };
}

export const utils = {
  sheet_to_json<T>(
    _sheet: Sheet,
    _opts?: { defval?: unknown; raw?: boolean },
  ): T[] {
    return [];
  },
};
