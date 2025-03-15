// BROWSER UI INTERACTIONS
import { Lexer } from "./lexer.js";
import { logInfo } from "./utils.js";
import { Parser } from "./parser.js";
export function runCompiler() {
    const inputElement = document.getElementById("sourceCode");
    const outputElement = document.getElementById("output");
    const outputElement2 = document.getElementById("output2");
    const cstOutputElement = document.getElementById("outputCST");
    outputElement.innerHTML = "";
    outputElement2.innerHTML = "";
    if (cstOutputElement)
        cstOutputElement.innerHTML = "";
    const sourceCode = inputElement.value;
    logInfo("Lexer - Lexing Started...");
    const lexer = new Lexer(sourceCode);
    lexer.tokenize();
    if (lexer.errors.length > 0) {
        logInfo("Lexer - Skipping parsing due to lexer errors.", "Lexer");
        return;
    }
    const allTokens = lexer.getTokens();
    const programs = [];
    let currentProgram = [];
    for (const token of allTokens) {
        currentProgram.push(token);
        if (token.type === "EOP") {
            programs.push([...currentProgram]);
            currentProgram = [];
        }
    }
    let programID = 1;
    for (const programTokens of programs) {
        logInfo(`Parser - Parsing Program ${programID}...`);
        const parser = new Parser(programTokens, programID);
        const cst = parser.parse();
        if (parser.errors.length === 0) {
            logInfo(`Parser - Displaying CST for Program ${programID}`, "Parser");
            if (cst) {
                cst.display();
            }
        }
        else {
            logInfo(`Parser - Skipping CST display due to ${parser.errors.length} parser error(s).`, "Parser");
        }
        programID++;
    }
}
//  OUTPUT WARNINGS AND ERRORS
export function reportWarningsandErrors(lexer) {
    // RETURN WARNINGS FIRST
    if (lexer.warnings.length === 0 && lexer.errors.length === 0) {
        logInfo(`End of Program ${lexer.programID} with ${lexer.errors.length} error(s) and ${lexer.warnings.length} warnings\n`);
    }
    if (lexer.warnings.length > 0 && lexer.errors.length === 0) {
        logInfo(`Lex Completed with: ${lexer.warnings.length} warning(s).`);
        logInfo(`Parser & CST Skipped\n`, "Parser");
        lexer.programID++;
    }
    if (lexer.warnings.length >= 0 && lexer.errors.length > 0) {
        logInfo(`Lex Failed with: ${lexer.errors.length} error(s) and ${lexer.warnings.length} warning(s).`);
        logInfo(`Parser & CST Skipped\n`, "Parser");
        lexer.programID++;
    }
}
//# sourceMappingURL=gui.js.map