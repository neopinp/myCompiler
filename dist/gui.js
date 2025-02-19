// BROWSER UI INTERACTIONS
import { Lexer } from "./lexer.js";
import { logInfo, logError } from "./utils.js";
export function runCompiler() {
    const inputElement = document.getElementById("sourceCode");
    let outputElement = document.getElementById("output");
    outputElement.innerHTML = "";
    const sourceCode = inputElement.value;
    logInfo("Lexing Started...");
    const lexer = new Lexer(sourceCode);
    lexer.tokenize();
}
// TOKENS BEING OUTPUTTED HERE (outputTokens() in EOP)
//  OUTPUT WARNINGS AND ERRORS
export function reportWarningsandErrors(lexer) {
    let outputElement = document.getElementById("output");
    // RETURN WARNINGS FIRST
    if (lexer.warnings.length === 0 && lexer.errors.length === 0) {
        logInfo(`End of Program ${lexer.programID} with ${lexer.errors.length} error(s) and ${lexer.warnings.length} warnings`);
    }
    if (lexer.warnings.length > 0 && lexer.errors.length === 0) {
        lexer.warnings.forEach((warning) => {
            outputElement.innerHTML += `<span class="warning">WARNING - (${warning.line}:${warning.column}): ${warning.message}</span><br>`;
        });
        logInfo(`Lex Completed with: ${lexer.warnings.length} warning(s).`);
    }
    if (lexer.warnings.length >= 0 && lexer.errors.length > 0) {
        lexer.warnings.forEach((warning) => {
            outputElement.innerHTML += `<span class="warning">WARNING - (${warning.line}:${warning.column}): ${warning.message}</span><br>`;
        });
        lexer.errors.forEach((error) => {
            logError(error.message, error.line, error.column);
        });
        logInfo(`Lex Failed with: ${lexer.errors.length} error(s) and ${lexer.warnings.length} warning(s)`);
    }
}
//# sourceMappingURL=gui.js.map