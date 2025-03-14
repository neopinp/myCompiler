import { Token } from "./token.js";
import { CST } from "./cst.js";
import { logInfo, logToScreen } from "./utils.js";
import { Lexer } from "./lexer.js";
import { logError, logWarning } from "./utils.js";

export class Parser {
  private tokens: Token[];
  private currentIndex: number = 0;
  private currentToken: Token;
  private programID: number;
  

  private cst: CST;
  public errors: { message: string; line: number; column: number }[] = [];
  public warnings: { message: string; line: number; column: number }[] = [];

  constructor(tokens: Token[], programID: number) {
    this.tokens = tokens;
    this.currentToken = tokens[0];
    this.programID = programID;

    this.cst = new CST();
  }

  public parse(): CST | null {
    logInfo(`Parsing Program ${this.programID}`, "Parser");
    this.parseProgram();
    if (this.errors.length === 0) {
      logInfo(`Displaying CST for Program ${this.programID}`, "Parser");
      return this.cst;
    } else {
      logInfo(`PARSER: Parse failed with ${this.errors.length} errors`, "Parser");
      return null;
    }
  }

  private parseProgram(): void {}


  public reportError(message: string, source: string = "Lexer"): void {
    logError(message, 0, 0, source);
    this.errors.push({ message, line: 0, column: 0 });
  }
  public reportWarning(message: string, source: string = "Lexer"): void {
    logWarning(message, 0, 0, source);
    this.warnings.push({ message, line: 0, column: 0 });
  }
}
