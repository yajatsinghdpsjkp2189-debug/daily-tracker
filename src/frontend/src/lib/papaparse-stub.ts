// Stub for papaparse — real package not installed, using browser FileReader fallback
export interface ParseConfig {
  header?: boolean;
  skipEmptyLines?: boolean;
  dynamicTyping?: boolean;
  complete?: (results: { data: unknown[] }) => void;
  error?: (error: Error) => void;
}

const Papa = {
  parse(file: File, config: ParseConfig) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length === 0) {
          config.complete?.({ data: [] });
          return;
        }
        const headers = lines[0]
          .split(",")
          .map((h) => h.trim().replace(/^"|"$/g, ""));
        const data = lines.slice(1).map((line) => {
          const values = line
            .split(",")
            .map((v) => v.trim().replace(/^"|"$/g, ""));
          const row: Record<string, string> = {};
          headers.forEach((h, i) => {
            row[h] = values[i] ?? "";
          });
          return row;
        });
        config.complete?.({ data });
      } catch (err) {
        config.error?.(err as Error);
      }
    };
    reader.onerror = () => config.error?.(new Error("Failed to read file"));
    reader.readAsText(file);
  },
};

export default Papa;
