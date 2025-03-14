import { Token } from "./token.js";
import { CST } from "./cst.js";
import { logInfo, logToScreen } from "./utils.js";
import { Lexer } from "./lexer.js";

export class Parser {
  private tokens: Token[];
  private currentIndex: number = 0;
  private currentToken: Token;
  private programID: number;


  private cst: CST;
  public errors: string[] = [];
  public warnings: string[] = [];

  constructor(tokens: Token[], programID: number) {
    this.tokens = tokens;
    this.currentToken = tokens[0]
    this.programID = programID;

    this.cst = new CST();
  }

  public parse(): CST | null {
    logInfo(`Parsing Program ${this.programID}`, 'Parser');
    this.parseProgram();

    if (this.errors.length === 0) {
      return this.cst;
    } else {
      reportError(`PARSER: Parse failed with errors`);
      return null;
    }
  }

  private parseProgram(): void {}
}
