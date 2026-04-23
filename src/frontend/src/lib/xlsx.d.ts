declare module "xlsx" {
  const SSF: {
    parse_date_code(v: number): { y: number; m: number; d: number } | null;
  };
  function read(
    data: ArrayBuffer,
    opts: { type: string; cellDates?: boolean },
  ): Workbook;
  interface Workbook {
    SheetNames: string[];
    Sheets: Record<string, Sheet>;
  }
  interface Sheet {}
  const utils: {
    sheet_to_json<T>(
      sheet: Sheet,
      opts?: { defval?: unknown; raw?: boolean },
    ): T[];
  };
}
