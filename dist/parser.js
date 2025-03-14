import { CST } from "./cst.js";
import { logInfo } from "./utils.js";
import { logError, logWarning } from "./utils.js";
export class Parser {
    tokens;
    currentIndex = 0;
    currentToken;
    programID;
    cst;
    errors = [];
    warnings = [];
    constructor(tokens, programID) {
        this.tokens = tokens;
        this.currentToken = tokens[0];
        this.programID = programID;
        this.cst = new CST();
    }
    parse() {
        logInfo(`Parsing Program ${this.programID}`, "Parser");
        this.parseProgram();
        if (this.errors.length === 0) {
            logInfo(`Displaying CST for Program ${this.programID}`, "Parser");
            return this.cst;
        }
        else {
            logInfo(`PARSER: Parse failed with ${this.errors.length} errors`, "Parser");
            return null;
        }
    }
    parseProgram() { }
    reportError(message, source = "Lexer") {
        logError(message, 0, 0, source);
        this.errors.push({ message, line: 0, column: 0 });
    }
    reportWarning(message, source = "Lexer") {
        logWarning(message, 0, 0, source);
        this.warnings.push({ message, line: 0, column: 0 });
    }
}
//# sourceMappingURL=parser.js.map