import Papa from "./papaparse-stub";
import type { ParsedEntry } from "./scheduleParser";
import * as XLSX from "./xlsx-stub";

export interface ColumnMap {
  date?: string;
  task?: string;
  duration?: string;
  notes?: string;
}

export interface SpreadsheetParseResult {
  entries: ParsedEntry[];
  columnMap: ColumnMap;
  uncertainColumns: string[];
  rowCount: number;
}

const DATE_KEYWORDS = ["date", "day", "when", "schedule"];
const TASK_KEYWORDS = [
  "task",
  "subject",
  "topic",
  "activity",
  "title",
  "what",
  "study",
  "work",
  "lesson",
];
const DURATION_KEYWORDS = [
  "hour",
  "time",
  "duration",
  "mins",
  "minutes",
  "hrs",
  "h",
  "period",
];
const NOTES_KEYWORDS = [
  "note",
  "important",
  "reminder",
  "tip",
  "focus",
  "comment",
  "remark",
  "extra",
];

function matchColumn(header: string, keywords: string[]): boolean {
  const h = header.toLowerCase().trim();
  return keywords.some((k) => h.includes(k));
}

function detectColumns(headers: string[]): {
  map: ColumnMap;
  uncertain: string[];
} {
  const map: ColumnMap = {};
  const uncertain: string[] = [];

  for (const h of headers) {
    if (!map.date && matchColumn(h, DATE_KEYWORDS)) {
      map.date = h;
    } else if (!map.task && matchColumn(h, TASK_KEYWORDS)) {
      map.task = h;
    } else if (!map.duration && matchColumn(h, DURATION_KEYWORDS)) {
      map.duration = h;
    } else if (!map.notes && matchColumn(h, NOTES_KEYWORDS)) {
      map.notes = h;
    } else if (h && !Object.values(map).includes(h)) {
      uncertain.push(h);
    }
  }

  return { map, uncertain };
}

const MONTH_MAP: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function parseDateValue(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "") return "";

  if (typeof val === "number") {
    const date = XLSX.SSF.parse_date_code(val);
    if (date) {
      return `${date.y}-${pad(date.m)}-${pad(date.d)}`;
    }
    return "";
  }

  const s = String(val).trim();
  const today = new Date();
  const year = today.getFullYear();

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return `${iso[1]}-${pad(Number(iso[2]))}-${pad(Number(iso[3]))}`;

  const slash = s.match(/^(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?$/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    const y = slash[3] ? Number(slash[3]) : year;
    const fullY = y < 100 ? 2000 + y : y;
    const [day, month] = b > 12 ? [a, b] : [a, b];
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${fullY}-${pad(month)}-${pad(day)}`;
    }
  }

  const sLower = s.toLowerCase();
  for (const [monthName, monthNum] of Object.entries(MONTH_MAP)) {
    const dm = sLower.match(
      new RegExp(`^(\\d{1,2})\\s+${monthName}(?:\\s+(\\d{2,4}))?$`),
    );
    if (dm) {
      const d = Number(dm[1]);
      const y = dm[2] ? Number(dm[2]) : year;
      return `${y}-${pad(monthNum)}-${pad(d)}`;
    }
    const md = sLower.match(
      new RegExp(`^${monthName}\\s+(\\d{1,2})(?:\\s+(\\d{2,4}))?$`),
    );
    if (md) {
      const d = Number(md[1]);
      const y = md[2] ? Number(md[2]) : year;
      return `${y}-${pad(monthNum)}-${pad(d)}`;
    }
  }

  return "";
}

function parseDurationValue(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "") return "";
  const s = String(val).trim();

  const num = Number(s);
  if (!Number.isNaN(num)) {
    return num === 1 ? "1 hour" : `${num} hours`;
  }

  const match = s.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)/i);
  if (match) {
    const v = Number(match[1]);
    const u = match[2].toLowerCase();
    if (u.startsWith("h")) return v === 1 ? "1 hour" : `${v} hours`;
    return `${v} mins`;
  }

  return s;
}

function rowsToEntries(
  rows: Record<string, string | number | null>[],
  map: ColumnMap,
): ParsedEntry[] {
  const entries: ParsedEntry[] = [];

  for (const row of rows) {
    const rawDate = map.date ? row[map.date] : null;
    const rawTask = map.task ? row[map.task] : null;
    const rawDuration = map.duration ? row[map.duration] : null;
    const rawNote = map.notes ? row[map.notes] : null;

    const date = parseDateValue(rawDate as string | number | null);
    const title = rawTask ? String(rawTask).trim() : "";
    const duration = parseDurationValue(rawDuration as string | number | null);
    const note = rawNote ? String(rawNote).trim() : undefined;

    if (!title && !date) continue;

    entries.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date,
      title: title || "Untitled",
      duration,
      details: "",
      raw: JSON.stringify(row),
      confidence: date ? "high" : "low",
      note: note || undefined,
    });
  }

  return entries;
}

async function parseCSV(
  file: File,
): Promise<Record<string, string | number | null>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        resolve(results.data as Record<string, string | number | null>[]);
      },
      error: (err) => reject(err),
    });
  });
}

async function parseXLSX(
  file: File,
): Promise<Record<string, string | number | null>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, string | number | null>>(
    sheet,
    {
      defval: null,
      raw: true,
    },
  );
  return json;
}

export async function parseSpreadsheet(
  file: File,
): Promise<SpreadsheetParseResult> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  let rows: Record<string, string | number | null>[];
  if (ext === "csv") {
    rows = await parseCSV(file);
  } else if (ext === "xlsx" || ext === "xls") {
    rows = await parseXLSX(file);
  } else {
    throw new Error(`Unsupported file type: .${ext}. Please use .csv or .xlsx`);
  }

  if (rows.length === 0) {
    return { entries: [], columnMap: {}, uncertainColumns: [], rowCount: 0 };
  }

  const headers = Object.keys(rows[0]);
  const { map, uncertain } = detectColumns(headers);
  const entries = rowsToEntries(rows, map);

  return {
    entries,
    columnMap: map,
    uncertainColumns: uncertain,
    rowCount: rows.length,
  };
}
