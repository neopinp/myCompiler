import { Lexer } from "./lexer.js";
import { logInfo } from "./utils.js";
import { Token } from "./token.js";
import { Parser } from "./parser.js";

export function runCompiler(): void {
  const inputElement = document.getElementById(
    "sourceCode"
  ) as HTMLTextAreaElement;
  const outputElement = document.getElementById("output")!;
  const outputElement2 = document.getElementById("output2")!;
  const cstOutputElement = document.getElementById("outputCST");

  outputElement.innerHTML = "";
  outputElement2.innerHTML = "";
  if (cstOutputElement) cstOutputElement.innerHTML = "";

  const sourceCode = inputElement.value;
  logInfo("Lexer - Lexing Started...");

  const lexer = new Lexer(sourceCode);
  lexer.tokenize();

  if (lexer.errors.length > 0) {
    logInfo("Lexer - Skipping parsing due to lexer errors.", "Lexer");
    return;
  }

  const programs: Token[][] = [];
  let currentProgram: Token[] = [];

  for (const token of lexer.getTokens()) {
    currentProgram.push(token);
    if (token.type === "EOP") {
      programs.push([...currentProgram]);
      currentProgram = [];
    }
  }

  programs.forEach((tokens, index) => {
    const parser = new Parser(tokens, index + 1);
    parser.parse();
  });
}
export function reportWarningsandErrors(lexer: Lexer): void {
  // RETURN WARNINGS FIRST
  if (lexer.warnings.length === 0 && lexer.errors.length === 0) {
    logInfo(
      `End of Program ${lexer.programID} with ${lexer.errors.length} error(s) and ${lexer.warnings.length} warnings\n`
    );
  }
  if (lexer.warnings.length > 0 && lexer.errors.length === 0) {
    logInfo(`Lex Completed with: ${lexer.warnings.length} warning(s).`);
    logInfo(`Parser & CST Skipped\n`, "Parser");
    lexer.programID++;
  }
  if (lexer.warnings.length >= 0 && lexer.errors.length > 0) {
    logInfo(
      `Lex Failed with: ${lexer.errors.length} error(s) and ${lexer.warnings.length} warning(s).`
    );
    logInfo(`Parser & CST Skipped\n`, "Parser");
    lexer.programID++;
  }
}
