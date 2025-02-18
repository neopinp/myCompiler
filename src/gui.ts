// BROWSER UI INTERACTIONS
import { Lexer } from "./lexer.js";
import { logInfo, logDebug, logError } from "./utils.js"; 


export function runCompiler(): void {
  const inputElement = document.getElementById(
    "sourceCode"
  ) as HTMLTextAreaElement;
  const outputElement = document.getElementById("output") as HTMLElement;
  outputElement.innerHTML = '';

  const sourceCode = inputElement.value;
  logInfo("Lexing Started...");

  const lexer = new Lexer(sourceCode);
  const tokens = lexer.tokenize();

  // RETURN VALID TOKENS FIRST 
  tokens.forEach((token) => {
    logDebug(
      `${token.type} [${token.value}] found at (${token.line}: ${token.column})`
    );
  });

  // RETURN ERRORS LAST 
  if (lexer.errors.length > 0) {
    logInfo(`Lex Failed with: ${lexer.errors.length} error(s)`); // not logging to screen for some reason, but logInfo itself works within other functions, successfully logging in console though
    lexer.errors.forEach((error) => {
      logError(error.message, error.line, error.column);
    })
  } else {
    logInfo(`Lex completed: 0 errors`)
  }
}
