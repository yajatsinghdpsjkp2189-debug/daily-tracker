export interface ParsedEntry {
  id: string;
  date: string; // ISO YYYY-MM-DD or empty
  title: string;
  duration: string;
  details: string;
  raw: string;
  confidence: "high" | "low";
  note?: string;
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

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function nextWeekday(dayIndex: number, base: Date): string {
  const result = new Date(base);
  const diff = (dayIndex - base.getDay() + 7) % 7 || 7;
  result.setDate(base.getDate() + diff);
  return toISO(result.getFullYear(), result.getMonth() + 1, result.getDate());
}

export function parseDateValue(
  val: string | undefined | null,
  baseYear: number,
): string {
  if (!val) return "";
  const s = String(val).trim();
  if (!s) return "";

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return `${iso[1]}-${pad(Number(iso[2]))}-${pad(Number(iso[3]))}`;

  const slash = s.match(/^(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?$/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    const y = slash[3] ? Number(slash[3]) : baseYear;
    const fullY = y < 100 ? 2000 + y : y;
    if (b >= 1 && b <= 12 && a >= 1 && a <= 31) {
      return `${fullY}-${pad(b)}-${pad(a)}`;
    }
  }

  const sLower = s.toLowerCase();
  for (const [monthName, monthNum] of Object.entries(MONTH_MAP)) {
    const dm = sLower.match(
      new RegExp(`^(\\d{1,2})\\s+${monthName}(?:\\s+(\\d{2,4}))?$`),
    );
    if (dm) {
      const d = Number(dm[1]);
      const y = dm[2] ? Number(dm[2]) : baseYear;
      return `${y}-${pad(monthNum)}-${pad(d)}`;
    }
    const md = sLower.match(
      new RegExp(`^${monthName}\\s+(\\d{1,2})(?:\\s+(\\d{2,4}))?$`),
    );
    if (md) {
      const d = Number(md[1]);
      const y = md[2] ? Number(md[2]) : baseYear;
      return `${y}-${pad(monthNum)}-${pad(d)}`;
    }
  }

  return "";
}

function parseDate(text: string, baseYear: number): string {
  return parseDateValue(text, baseYear);
}

function extractDate(
  line: string,
  baseYear: number,
): { date: string; rest: string } {
  const today = new Date();

  const relMatch = line.match(/^\s*(today|tomorrow)\s*[:\-,]?\s*/i);
  if (relMatch) {
    const d = parseDate(relMatch[1], baseYear);
    return { date: d, rest: line.slice(relMatch[0].length) };
  }

  const dayMatch = line.match(
    /^\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|fri|sat|sun)\s*[:\-,]?\s*/i,
  );
  if (dayMatch) {
    const d = nextWeekday(DAY_MAP[dayMatch[1].toLowerCase()], today);
    return { date: d, rest: line.slice(dayMatch[0].length) };
  }

  const numStart = line.match(
    /^\s*(\d{1,2})[/\-](\d{1,2})(?:[/\-](\d{2,4}))?\s*[:\-,]?\s*/,
  );
  if (numStart) {
    const day = Number.parseInt(numStart[1]);
    const month = Number.parseInt(numStart[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const year = numStart[3] ? Number.parseInt(numStart[3]) : baseYear;
      return {
        date: toISO(year, month, day),
        rest: line.slice(numStart[0].length),
      };
    }
  }

  for (const [monthName, monthNum] of Object.entries(MONTH_MAP)) {
    const dmRe = new RegExp(
      `^\\s*(\\d{1,2})\\s+${monthName}(?:\\s+(\\d{2,4}))?\\s*[:\\-,]?\\s*`,
      "i",
    );
    const dmMatch = line.match(dmRe);
    if (dmMatch) {
      const day = Number.parseInt(dmMatch[1]);
      const year = dmMatch[2] ? Number.parseInt(dmMatch[2]) : baseYear;
      return {
        date: toISO(year, monthNum, day),
        rest: line.slice(dmMatch[0].length),
      };
    }
    const mdRe = new RegExp(
      `^\\s*${monthName}\\s+(\\d{1,2})(?:\\s+(\\d{2,4}))?\\s*[:\\-,]?\\s*`,
      "i",
    );
    const mdMatch = line.match(mdRe);
    if (mdMatch) {
      const day = Number.parseInt(mdMatch[1]);
      const year = mdMatch[2] ? Number.parseInt(mdMatch[2]) : baseYear;
      return {
        date: toISO(year, monthNum, day),
        rest: line.slice(mdMatch[0].length),
      };
    }
  }

  return { date: "", rest: line };
}

function execAll(re: RegExp, text: string): RegExpExecArray[] {
  const results: RegExpExecArray[] = [];
  let m = re.exec(text);
  while (m !== null) {
    results.push(m);
    m = re.exec(text);
  }
  return results;
}

function parseDuration(text: string): { duration: string; rest: string } {
  const durations: string[] = [];
  let rest = text;

  const singleRe =
    /(\d+(?:\.\d+)?)\s*(hours?|hrs?|h(?=\s|,|$|\|)|minutes?|mins?|m(?=\s|,|$|\|))/gi;
  const allMatches = execAll(singleRe, text).map((m) => ({
    full: m[0],
    value: m[1],
    unit: m[2],
  }));

  if (allMatches.length > 0) {
    const first = allMatches[0];
    const val = Number.parseFloat(first.value);
    const unit = first.unit.toLowerCase();
    if (unit.startsWith("h")) {
      durations.push(val === 1 ? "1 hour" : `${val} hours`);
    } else {
      durations.push(`${val} mins`);
    }
    rest = text
      .replace(
        new RegExp(first.full.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
        " ",
      )
      .trim();
  }

  return { duration: durations.join(", "), rest };
}

function parseChapters(text: string): { details: string; rest: string } {
  const chapRe = /(?:chapters?|ch|topics?)\s+([\d,\s\-and]+)/gi;
  const allMatches = execAll(chapRe, text);
  const found = allMatches.map((m) => m[0].trim());

  if (found.length > 0) {
    const rest = text
      .replace(/(?:chapters?|ch|topics?)\s+([\d,\s\-and]+)/gi, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    return { details: found.join("; "), rest };
  }

  return { details: "", rest: text };
}

function parseSegment(
  segment: string,
  date: string,
  baseYear: number,
  seenDate: boolean,
): ParsedEntry | null {
  const trimmed = segment.trim();
  if (!trimmed) return null;

  let working = trimmed;
  let entryDate = date;
  let confidence: "high" | "low" = seenDate ? "high" : "low";

  if (!entryDate) {
    const extracted = extractDate(working, baseYear);
    if (extracted.date) {
      entryDate = extracted.date;
      working = extracted.rest;
      confidence = "high";
    }
  }

  const { duration, rest: afterDuration } = parseDuration(working);
  const { details, rest: afterChapters } = parseChapters(afterDuration);

  let title = afterChapters
    .replace(/^[\s,;:\-|]+/, "")
    .replace(/[\s,;:\-|]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (title) title = title.charAt(0).toUpperCase() + title.slice(1);

  if (!title && working) {
    title = working
      .replace(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h\b|minutes?|mins?|m\b)/gi, "")
      .replace(/[\s,;:\-|]+$/, "")
      .trim();
    if (title) title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  if (!title && !duration && !details) return null;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date: entryDate,
    title: title || "Untitled",
    duration,
    details,
    raw: trimmed,
    confidence,
  };
}

// ─── CSV Section Parser ────────────────────────────────────────────────────

/**
 * Splits a CSV line into fields, respecting quoted strings.
 */
function splitCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

interface CSVSection {
  headers: string[];
  rows: string[][];
}

/**
 * Finds the index of the best date column in a header array.
 * Prefers columns literally named "date" or containing "date".
 * Skips columns that look like ordinal day-number columns ("Day", "DAY").
 */
function findDateColIdx(headers: string[]): number {
  // Exact match first
  for (let i = 0; i < headers.length; i++) {
    if (/^date$/i.test(headers[i].trim())) return i;
  }
  // Contains "date"
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase();
    if (h.includes("date") && !h.includes("update")) return i;
  }
  return -1;
}

/**
 * Returns indices of content/session columns — anything that isn't the date
 * column or a pure ordinal label column ("Day", "DAY", "#").
 */
function findContentColIdxs(headers: string[], dateIdx: number): number[] {
  const skip = new Set([dateIdx]);
  // Skip ordinal/row-number columns
  for (let i = 0; i < headers.length; i++) {
    if (/^(day|#|no\.?|num|number|sr\.?)$/i.test(headers[i].trim()))
      skip.add(i);
  }
  return headers.map((_, i) => i).filter((i) => !skip.has(i));
}

/**
 * Determines whether a column header looks like a "notes / important" column.
 */
function isNoteCol(header: string): boolean {
  const h = header.toLowerCase();
  return [
    "note",
    "important",
    "reminder",
    "tip",
    "focus",
    "comment",
    "remark",
    "ncert",
    "formula",
    "revision",
    "highlight",
  ].some((k) => h.includes(k));
}

/**
 * Parses a CSV section (header + data rows) into ParsedEntries.
 * Creates one entry per (row × content-column) so each session / task gets
 * its own calendar event.
 */
function csvSectionToEntries(
  section: CSVSection,
  baseYear: number,
): ParsedEntry[] {
  const { headers, rows } = section;
  const dateIdx = findDateColIdx(headers);
  if (dateIdx === -1) return []; // no date column → can't map to calendar

  const contentIdxs = findContentColIdxs(headers, dateIdx);
  if (contentIdxs.length === 0) return [];

  const entries: ParsedEntry[] = [];

  for (const row of rows) {
    const rawDate = row[dateIdx] ?? "";
    const date = parseDateValue(rawDate, baseYear);
    if (!date) continue; // skip rows with no parseable date

    for (const ci of contentIdxs) {
      const cellVal = (row[ci] ?? "").trim();
      if (!cellVal) continue;

      const colHeader = headers[ci] ?? "";
      const colNote = isNoteCol(colHeader);

      // Build a descriptive title: "<ColHeader>: <content>" if header adds context
      // For SESSION-style headers include the time
      let title = cellVal;
      let note: string | undefined;

      if (colNote) {
        // This column is a note/reminder — attach as note to the previous entry
        // or create a reminder entry if we have a date.
        note = cellVal;
        title = `Reminder: ${cellVal}`;
      } else if (/session\s*\d+/i.test(colHeader)) {
        // SESSION 1 (7:00-10:00) → keep time info from header as details
        const timeMatch = colHeader.match(
          /(\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2})/i,
        );
        const sessionNum = colHeader.match(/session\s*(\d+)/i)?.[1];
        title = cellVal;
        if (timeMatch) {
          entries.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            date,
            title,
            duration: timeMatch[1],
            details: sessionNum ? `Session ${sessionNum}` : colHeader,
            raw: cellVal,
            confidence: "high",
            note: undefined,
          });
          continue;
        }
      } else if (
        !colNote &&
        contentIdxs.length > 1 &&
        colHeader &&
        !/^(session|task|subject|activity|topic|description|content)$/i.test(
          colHeader,
        )
      ) {
        // Add col header as context prefix if it adds useful info
        title = cellVal;
      }

      entries.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        date,
        title,
        duration: "",
        details: colHeader,
        raw: cellVal,
        confidence: "high",
        note,
      });
    }
  }

  return entries;
}

/**
 * Detects whether a block of text looks like a CSV table.
 * Returns true if the majority of non-empty lines have 3+ comma-separated fields.
 */
function looksLikeCSV(lines: string[]): boolean {
  const nonEmpty = lines.filter((l) => l.trim());
  if (nonEmpty.length < 2) return false;
  const csvLines = nonEmpty.filter((l) => l.split(",").length >= 3);
  return csvLines.length >= nonEmpty.length * 0.6;
}

/**
 * Splits text into CSV sections (separated by blank lines or section-title lines).
 * Each section starts with a header row.
 */
function extractCSVSections(text: string): CSVSection[] {
  const rawLines = text.split(/\n/);
  const sections: CSVSection[] = [];

  let currentBlock: string[] = [];

  const flushBlock = () => {
    const block = currentBlock.filter((l) => l.trim());
    currentBlock = [];
    if (block.length < 2) return;
    if (!looksLikeCSV(block)) return;

    // Determine if first line is a title (very few commas) vs a header row
    const firstFields = splitCSVLine(block[0]);
    if (firstFields.length < 3) {
      // Likely a title row — drop it and use next as header
      block.shift();
      if (block.length < 2) return;
    }

    const headers = splitCSVLine(block[0]);
    const rows = block.slice(1).map(splitCSVLine);
    sections.push({ headers, rows });
  };

  for (const line of rawLines) {
    if (!line.trim()) {
      flushBlock();
    } else {
      currentBlock.push(line);
    }
  }
  flushBlock();

  return sections;
}

// ─── Main Export ──────────────────────────────────────────────────────────

export function parseScheduleText(
  text: string,
  baseYear?: number,
): ParsedEntry[] {
  const year = baseYear ?? new Date().getFullYear();

  // --- Try CSV multi-section parsing first ---
  const trimmed = text.trim();
  if (trimmed.includes(",") && trimmed.split("\n").filter(Boolean).length > 2) {
    const sections = extractCSVSections(trimmed);
    const csvEntries: ParsedEntry[] = [];
    for (const section of sections) {
      csvEntries.push(...csvSectionToEntries(section, year));
    }
    if (csvEntries.length > 0) return csvEntries;
  }

  // --- Fall back to original line-by-line parser ---
  const results: ParsedEntry[] = [];
  const lines = text.split(/\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const { date: lineDate, rest: lineRest } = extractDate(trimmedLine, year);
    const hasLineDate = !!lineDate;

    const segments = lineRest.split(/[|;]/);

    for (const seg of segments) {
      const entry = parseSegment(seg, lineDate, year, hasLineDate);
      if (entry) results.push(entry);
    }
  }

  return results;
}
