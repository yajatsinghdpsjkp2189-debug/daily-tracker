import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CalendarPlus,
  FileSpreadsheet,
  Info,
  Loader2,
  MapPin,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useCreateCalendarEvent } from "../hooks/useQueries";
import type { ParsedEntry } from "../lib/scheduleParser";
import { parseScheduleText } from "../lib/scheduleParser";
import type { ColumnMap } from "../lib/spreadsheetParser";
import { parseSpreadsheet } from "../lib/spreadsheetParser";

const PLACEHOLDER = `Try any format — the parser handles it live:

10 march: 3 hours study physics chapter 3,4 | 2 hours chemistry ch 7,8
March 11 - Maths 1.5h topic 5, English 45mins
12/3 biology 2 hours (chapters 1-3), history 1hr ch 5
Monday: work on project report 2 hours
tomorrow: revise economics 90mins topics 2,3`;

const COLUMN_LABELS: Record<keyof ColumnMap, string> = {
  date: "Date",
  task: "Task",
  duration: "Hours",
  notes: "Notes",
};

function EntryCard({
  entry,
  idx,
  onUpdate,
  onRemove,
}: {
  entry: ParsedEntry;
  idx: number;
  onUpdate: (id: string, field: keyof ParsedEntry, value: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      data-ocid={`schedule.entry.item.${idx + 1}`}
      className={`relative rounded-xl border p-3 bg-card/40 backdrop-blur-sm transition-colors ${
        entry.confidence === "low"
          ? "border-amber-400/40 bg-amber-400/5"
          : "border-border/40"
      }`}
    >
      {entry.confidence === "low" && (
        <div className="flex items-center gap-1.5 mb-2 text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs font-medium">
            Review date — none detected
          </span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={entry.date}
              onChange={(e) => onUpdate(entry.id, "date", e.target.value)}
              className="bg-secondary/60 border border-border/40 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 min-w-[140px]"
            />
            {entry.duration && (
              <Badge
                variant="secondary"
                className="text-[11px] bg-primary/10 text-primary border-primary/20 font-medium"
              >
                {entry.duration}
              </Badge>
            )}
          </div>

          <input
            type="text"
            value={entry.title}
            onChange={(e) => onUpdate(entry.id, "title", e.target.value)}
            className="w-full bg-transparent border-b border-border/30 text-sm font-medium text-foreground focus:outline-none focus:border-primary/50 pb-0.5 transition-colors placeholder:text-muted-foreground/40"
            placeholder="Title"
          />

          {entry.details && (
            <p className="text-xs text-muted-foreground">{entry.details}</p>
          )}

          {entry.note && (
            <div
              data-ocid={`schedule.entry.note.${idx + 1}`}
              className="flex items-start gap-1.5 mt-1 px-2.5 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/25"
            >
              <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
              <span className="text-[11px] text-amber-300 leading-relaxed">
                {entry.note}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          data-ocid={`schedule.entry.remove_button.${idx + 1}`}
          onClick={() => onRemove(entry.id)}
          className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label="Remove entry"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function EntriesList({
  entries,
  isAdding,
  onUpdate,
  onRemove,
  onAddToCalendar,
}: {
  entries: ParsedEntry[];
  isAdding: boolean;
  onUpdate: (id: string, field: keyof ParsedEntry, value: string) => void;
  onRemove: (id: string) => void;
  onAddToCalendar: () => void;
}) {
  const validCount = entries.filter((e) => e.date).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Parsed Entries
        </h2>
        <span className="text-xs">
          {entries.filter((e) => e.confidence === "low").length > 0 && (
            <span className="text-amber-400">
              {entries.filter((e) => e.confidence === "low").length} need review
            </span>
          )}
        </span>
      </div>

      <div className="space-y-2">
        {entries.map((entry, idx) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            idx={idx}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))}
      </div>

      <Button
        data-ocid="schedule.add_to_calendar.button"
        onClick={onAddToCalendar}
        disabled={isAdding || validCount === 0}
        className="w-full gap-2 font-semibold"
      >
        {isAdding ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CalendarPlus className="w-4 h-4" />
        )}
        {isAdding
          ? "Adding to Calendar..."
          : validCount === 0
            ? "No valid dates — review entries above"
            : `Add ${validCount} event${validCount > 1 ? "s" : ""} to Calendar`}
      </Button>
    </motion.div>
  );
}

function UploadMode() {
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [columnMap, setColumnMap] = useState<ColumnMap>({});
  const [uncertainCols, setUncertainCols] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createEvent = useCreateCalendarEvent();

  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") {
      toast.error("Only .csv and .xlsx files are supported.");
      return;
    }
    setIsParsing(true);
    setFileName(file.name);
    try {
      const result = await parseSpreadsheet(file);
      setEntries(result.entries);
      setColumnMap(result.columnMap);
      setUncertainCols(result.uncertainColumns);
      setRowCount(result.rowCount);
      if (result.entries.length === 0) {
        toast.warning(
          "No entries could be parsed. Check that your file has a header row.",
        );
      } else {
        toast.success(
          `Parsed ${result.entries.length} entries from ${result.rowCount} rows.`,
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse file.");
      setFileName("");
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const clearFile = () => {
    setEntries([]);
    setColumnMap({});
    setUncertainCols([]);
    setRowCount(0);
    setFileName("");
  };

  const updateEntry = (id: string, field: keyof ParsedEntry, value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const addToCalendar = async () => {
    const validEntries = entries.filter((e) => e.date);
    if (!validEntries.length) {
      toast.error("No entries with valid dates to add.");
      return;
    }
    setIsAdding(true);
    try {
      await Promise.all(
        validEntries.map((e) =>
          createEvent.mutateAsync({
            title: e.title,
            date: e.date,
            eventType: "task",
            description: [e.duration, e.details, e.note ? `📌 ${e.note}` : ""]
              .filter(Boolean)
              .join(" — "),
          }),
        ),
      );
      toast.success(
        `${validEntries.length} event${validEntries.length > 1 ? "s" : ""} added to Calendar!`,
      );
      clearFile();
    } catch {
      toast.error("Failed to add some events. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const mappedKeys = Object.keys(columnMap) as (keyof ColumnMap)[];

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      {!fileName ? (
        <label
          data-ocid="schedule.upload.dropzone"
          htmlFor="schedule-file-upload"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 p-10 text-center cursor-pointer block ${
            isDragging
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-border/50 hover:border-primary/40 hover:bg-primary/5"
          }`}
        >
          <input
            ref={fileInputRef}
            id="schedule-file-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
            data-ocid="schedule.upload.button"
          />
          {isParsing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Reading file…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                  isDragging ? "bg-primary/20" : "bg-secondary/60"
                }`}
              >
                <Upload
                  className={`w-7 h-7 transition-colors ${
                    isDragging ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div>
                <p className="font-display font-semibold text-sm text-foreground">
                  Drag &amp; drop your spreadsheet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports .csv and .xlsx (Excel, Google Sheets export)
                </p>
              </div>
              <span className="inline-flex items-center gap-2 mt-1 px-3 py-1.5 rounded-lg border border-border/60 text-xs text-muted-foreground bg-secondary/40 hover:bg-secondary/60 transition-colors">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Browse File
              </span>
            </div>
          )}
        </label>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {fileName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {rowCount} rows · {entries.length} entries parsed
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            data-ocid="schedule.upload.column_map.panel"
            className="rounded-lg bg-secondary/40 border border-border/30 p-3 space-y-2"
          >
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Column Mapping
            </p>
            <div className="flex flex-wrap gap-1.5">
              {mappedKeys.map((role) => (
                <div
                  key={role}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[11px]"
                >
                  <span className="text-primary font-medium">
                    {COLUMN_LABELS[role]}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-foreground/80">{columnMap[role]}</span>
                </div>
              ))}
              {uncertainCols.map((col) => (
                <div
                  key={col}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-[11px]"
                >
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                  <span className="text-amber-300">{col}</span>
                  <span className="text-muted-foreground/60 text-[10px]">
                    (unmatched)
                  </span>
                </div>
              ))}
              {mappedKeys.length === 0 && uncertainCols.length === 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="w-3 h-3" />
                  No columns detected
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {entries.length > 0 ? (
          <EntriesList
            key="upload-entries"
            entries={entries}
            isAdding={isAdding}
            onUpdate={updateEntry}
            onRemove={removeEntry}
            onAddToCalendar={addToCalendar}
          />
        ) : fileName && !isParsing ? (
          <motion.div
            key="no-entries"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            data-ocid="schedule.upload.empty_state"
            className="text-center py-8 text-muted-foreground text-sm space-y-2"
          >
            <FileSpreadsheet className="w-6 h-6 mx-auto opacity-30" />
            <p>No entries could be extracted. Try adding a header row.</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PasteMode() {
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const createEvent = useCreateCalendarEvent();

  const handleTextChange = (val: string) => {
    setText(val);
    if (val.trim()) {
      setEntries(parseScheduleText(val));
    } else {
      setEntries([]);
    }
  };

  const updateEntry = (id: string, field: keyof ParsedEntry, value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const addToCalendar = async () => {
    const validEntries = entries.filter((e) => e.date);
    if (!validEntries.length) {
      toast.error("No entries with valid dates to add.");
      return;
    }
    setIsAdding(true);
    try {
      await Promise.all(
        validEntries.map((e) =>
          createEvent.mutateAsync({
            title: e.title,
            date: e.date,
            eventType: "task",
            description: [e.duration, e.details].filter(Boolean).join(" — "),
          }),
        ),
      );
      toast.success(
        `${validEntries.length} event${validEntries.length > 1 ? "s" : ""} added to Calendar!`,
      );
      setText("");
      setEntries([]);
    } catch {
      toast.error("Failed to add some events. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          data-ocid="schedule.input.textarea"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={10}
          className="resize-none bg-card/60 border-border/60 focus:border-primary/50 focus:ring-primary/20 font-body text-sm leading-relaxed placeholder:text-muted-foreground/50 transition-colors"
        />
        {text && (
          <div className="absolute top-2 right-2">
            <Badge
              variant="secondary"
              className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20"
            >
              <Sparkles className="w-2.5 h-2.5" />
              {entries.length} parsed
            </Badge>
          </div>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {entries.length > 0 ? (
          <EntriesList
            key="paste-entries"
            entries={entries}
            isAdding={isAdding}
            onUpdate={updateEntry}
            onRemove={removeEntry}
            onAddToCalendar={addToCalendar}
          />
        ) : text.trim() ? (
          <motion.div
            key="no-parse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-muted-foreground text-sm"
          >
            <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-30" />
            Parsing… keep typing
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-ocid="schedule.empty_state"
            className="rounded-2xl border border-dashed border-border/50 p-10 text-center space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Wand2 className="w-6 h-6 text-primary/60" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground/80">
                Type anything above
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Dates, times, subjects, chapters — the parser figures it out
                live
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {["10 march", "3 hours", "ch 3,4", "Monday", "tomorrow"].map(
                (hint) => (
                  <span
                    key={hint}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/80 text-muted-foreground font-mono"
                  >
                    {hint}
                  </span>
                ),
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
          <Wand2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">
            Schedule Import
          </h1>
          <p className="text-xs text-muted-foreground">
            Paste text or upload a spreadsheet — parsed live
          </p>
        </div>
      </div>

      <Tabs defaultValue="paste" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger
            value="paste"
            className="flex-1 gap-1.5"
            data-ocid="schedule.mode.paste_tab"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Paste Text
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            className="flex-1 gap-1.5"
            data-ocid="schedule.mode.upload_tab"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paste">
          <PasteMode />
        </TabsContent>

        <TabsContent value="upload">
          <UploadMode />
        </TabsContent>
      </Tabs>
    </div>
  );
}
