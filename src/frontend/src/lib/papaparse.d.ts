declare module "papaparse" {
  interface ParseConfig {
    header?: boolean;
    skipEmptyLines?: boolean;
    dynamicTyping?: boolean;
    complete?: (results: ParseResult) => void;
    error?: (error: Error) => void;
  }
  interface ParseResult {
    data: unknown[];
    errors: unknown[];
    meta: unknown;
  }
  function parse(file: File, config: ParseConfig): void;
  export default { parse };
}
