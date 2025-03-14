import { CST } from "./cst.js";
import { logInfo } from "./utils.js";
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
        logInfo(`Parsing Program ${this.programID}`, 'Parser');
        this.parseProgram();
        if (this.errors.length === 0) {
            return this.cst;
        }
        else {
            reportError(`PARSER: Parse failed with errors`);
            return null;
        }
    }
    parseProgram() { }
}
//# sourceMappingURL=parser.js.map