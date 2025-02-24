// BROWSER UI INTERACTIONS
import { Lexer } from "./lexer.js";
import { logInfo } from "./utils.js";

export function runCompiler(): void {
  const inputElement = document.getElementById(
    "sourceCode"
  ) as HTMLTextAreaElement;
  let outputElement = document.getElementById("output") as HTMLElement;
  outputElement.innerHTML = "";
  let outputElement2 = document.getElementById("output2") as HTMLElement;
  outputElement2.innerHTML = "";

  const sourceCode = inputElement.value;
  logInfo("Lexing Started...");

  const lexer = new Lexer(sourceCode);
  lexer.tokenize();
}

//  OUTPUT WARNINGS AND ERRORS
export function reportWarningsandErrors(lexer: Lexer): void {
  // RETURN WARNINGS FIRST
  if (lexer.warnings.length === 0 && lexer.errors.length === 0) {
    logInfo(
      `End of Program ${lexer.programID} with ${lexer.errors.length} error(s) and ${lexer.warnings.length} warnings\n`
    );
  }
  if (lexer.warnings.length > 0 && lexer.errors.length === 0) {
    logInfo(`Lex Completed with: ${lexer.warnings.length} warning(s).`);
  }
  if (lexer.warnings.length >= 0 && lexer.errors.length > 0) {
    logInfo(
      `Lex Failed with: ${lexer.errors.length} error(s) and ${lexer.warnings.length} warning(s)\n`
    );
  }
}

export function scrollToBottom() {
  const outputElement = document.getElementById("output");
  if (outputElement) {
    outputElement.scrollTop = outputElement.scrollHeight;
  }
}
