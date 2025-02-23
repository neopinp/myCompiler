/* 
PROVIDE ERRORS AND WARNINGS WITH DETAILED MESSAGES
VERBOSE OUTPUT MODE (DEBUG AND INFO LOGS)
TESTING
 */

import { reportWarningsandErrors } from "./gui.js";
import { Token, TokenType } from "./token.js";
import { logInfo, logError, logDebug, logWarning } from "./utils.js";

export class Lexer {
  private source: string = "";
  public programID: number = 1;
  private tokens: Token[] = [];
  private currentChar: string = "";
  private line: number = 1;
  private column: number = 0;
  private position: number = 0;
  public errors: { message: string; line: number; column: number }[] = [];
  public warnings: { message: string; line: number; column: number }[] = [];
  private endOfFileReached: boolean = false;
  private foundEOP: boolean = false;

  constructor(source: string) {
    this.source = source;
    this.programID = 1;
    this.tokens = [];
    this.currentChar = "";
    this.line = 1;
    this.column = 0;
    this.position = 0;
    this.errors = [];
    this.warnings = [];
    this.foundEOP = false;
    this.advance();
  }

  private advance(): void {
    if (this.position < this.source.length) {
      this.currentChar = this.source[this.position];
      this.column++;
      this.position++;
    } else {
      this.currentChar = "\0"; // END OF FILE MARKER
      this.endOfFileReached = true;
    }
  }

  private addToken(type: TokenType, startColumn: number): void {
    const newTokens = new Token(type, this.currentChar, this.line, startColumn);
    this.tokens.push(newTokens);
    logDebug(
      `${newTokens.type} [${newTokens.value}] found at (${newTokens.line}:${newTokens.column})`
    );
    this.advance();
  }

  // Start token rules from most specific to least specific
  // continue to read characters until you hit a $EOP or whitespace

  public tokenize(): Token[] {
    logInfo(`Lexing Program ${this.programID}`);
    this.foundEOP = false;

    while (this.currentChar !== "\0") {
      if (this.currentChar === "\t") {
        this.reportError(`Unrecognized Token: Tab`)
        this.advance();
      } else if (/\s/.test(this.currentChar)) {
        this.handleWhiteSpace();
      } else if (this.currentChar === "{") {
        this.addToken(TokenType.OPEN_BLOCK, this.column);
      } else if (this.currentChar === "}") {
        this.addToken(TokenType.CLOSE_BLOCK, this.column);
      } else if (this.currentChar === "(") {
        this.addToken(TokenType.LPAREN, this.column);
      } else if (this.currentChar === ")") {
        this.addToken(TokenType.RPAREN, this.column);
      } else if (this.currentChar === "+") {
        this.addToken(TokenType.INT_OP, this.column);
      } else if (this.currentChar === '"') {
        this.tokenizeString();
      } else if (/[a-z]/.test(this.currentChar)) {
        this.tokenizeIdentifier();
      } else if (/\d/.test(this.currentChar)) {
        this.tokenizeNumber();
      } else if (this.currentChar === "=") {
        this.tokenizeEquals();
      } else if (this.currentChar === "!") {
        this.tokenizeNotEquals();
      } else if (this.currentChar === "$") {
        this.foundEOP = true;
        this.tokenizeEOP();
      } else if (this.currentChar === "/") {
        this.tokenizeComment();
      } else {
        this.reportError(
          `Unrecognized character PID:${this.programID} ('${this.currentChar}')`
        ); // add errors as you get them
        this.advance();
      }
    }
    if (!this.foundEOP) {
      this.reportWarning("Program is missing an EOP ($) at the end");
      reportWarningsandErrors(this);
    }
    return this.tokens;
  }

  // KEYWORDS & IDENTIFIERS
  private tokenizeIdentifier(): void {
    let startColumn = this.column; // start of identifier
    let identifier = "";
    /* 
    Start token searching at alpha char
    If Identifier === keywords[identifier] type === keyword | identifier 
    KEYWORDS === predefined words that cannot be used as variables
    
    EDIT: should use longest match + rule order 
    */

    while (/[a-z]/.test(this.currentChar)) {
      identifier += this.currentChar;

      // Check if identifier matches any keywords during looping ?
      // 
      this.advance();
    }

    // Determine keyword or identifier
    const keywords: Record<string, TokenType> = {
      print: TokenType.PRINT,
      while: TokenType.WHILE,
      if: TokenType.IF,
      int: TokenType.VAR_TYPE,
      string: TokenType.VAR_TYPE,
      boolean: TokenType.VAR_TYPE,
      true: TokenType.BOOLEAN_LITERAL,
      false: TokenType.BOOLEAN_LITERAL,
    };

    const tokenType = keywords[identifier] || TokenType.IDENTIFIER;
    this.tokens.push(new Token(tokenType, identifier, this.line, startColumn));
    logDebug(
      `${tokenType} [${identifier}] found at (${this.line}:${startColumn})`
    );
  }

  /* STRINGS - " "
  Capture all characters AND SPACES until you reach a closing quote 
  Contains [a-z] and spaces 
  */
  private tokenizeString(): void {
    let startColumn = this.column; // Capture starting column of the quote

    // Opening quote
    if (this.currentChar === '"') {
      this.addToken(TokenType.CHAR_LIST, this.column);
    } else {
      this.reportError(
        `Unterminated string literal starting at ${this.line}:${this.column}`
      );
      return;
    }

    // Process each character inside the string
    while (this.currentChar !== '"' && this.currentChar !== "\0") {
      if (/[a-z]/.test(this.currentChar)) {
        // Assuming only lowercase characters are valid
        this.addToken(TokenType.CHAR, this.column);
      } else if (/\s/.test(this.currentChar)) {
        this.addToken(TokenType.SPACE, this.column);
      } else {
        this.reportError(`Invalid character ${this.currentChar} in string`);
        this.advance();
      }
    }

    // Closing quote
    if (this.currentChar === '"') {
      this.addToken(TokenType.CHAR_LIST, startColumn);
    } else {
      this.reportError(
        `Missing closing quote for string starting at ${this.line}:${startColumn}`
      );
    }
  }

  // Longest Match First - Check if there is a following '=' for "=="
  private tokenizeEquals() {
    let startColumn = this.column;
    this.advance();
    if (this.currentChar === "=") {
      this.advance();
      this.tokens.push(
        new Token(TokenType.BOOL_OP, "==", this.line, startColumn)
      );
      logDebug(
        `${TokenType.BOOL_OP} [==] found at (${this.line}: ${this.column})`
      );
    } else {
      this.tokens.push(
        new Token(TokenType.ASSIGN_OP, "=", this.line, startColumn)
      );
      logDebug(
        `${TokenType.ASSIGN_OP} [=] found at (${this.line}: ${this.column})`
      );
    }
  }

  private tokenizeNotEquals() {
    let startColumn = this.column;
    this.advance();
    if (this.currentChar === "=") {
      this.advance();
      this.tokens.push(
        new Token(TokenType.BOOL_OP, "!=", this.line, startColumn)
      );
      logDebug(`${TokenType.BOOL_OP} [!=] found at (${this.line}: ${this.column})`)
    } else {
      this.reportError("Unrecognized token");
    }
  }

  private tokenizeNumber() {
    let startColumn = this.column;
    let number = "";

    while (/\d/.test(this.currentChar)) {
      number += this.currentChar;
      this.advance();
    }
    this.tokens.push(
      new Token(TokenType.DIGIT, number, this.line, startColumn)
    );
    logDebug(
      `${TokenType.DIGIT} [${number}] found at (${this.line}:${startColumn})`
    );
  }

  private tokenizeEOP() {
    this.addToken(TokenType.EOP, this.column);
    reportWarningsandErrors(this);
    this.programID++;

    this.skipWhiteSpace();
    if (!this.endOfFileReached && this.currentChar !== "\0") {
      this.foundEOP = false;
      logInfo(`Lexing Program ${this.programID}`);
    }
    this.errors = [];
    this.warnings = [];
    this.column = 0;
    this.line = 0;
  }

  private tokenizeComment(): void {
    let startColumn = this.column;
    this.advance();

    if (this.currentChar !== "*") {
      this.reportWarning(`Missing Opening '*' ${this.line}:${startColumn}`);
    }
    this.advance();

    while (this.currentChar !== "/" && this.currentChar !== "\0") {
      this.advance();
    }
    // add error checking for missing closing of comments
    this.advance();
  }

  private handleWhiteSpace(): void {
    if (this.currentChar === "\n") {
      this.line++;
      this.column = 0;
    }
    this.advance();
  }
  private skipWhiteSpace(): void {
    while (/\s/.test(this.currentChar)) {
      this.advance();
    }
  }
  // for immediate reporting / storing for output at completion - move to gui.ts
  private reportError(message: string): void {
    logError(message, this.line, this.column);
    this.errors.push({ message, line: this.line, column: this.column });
  }
  private reportWarning(message: string): void {
    logWarning(message, this.line, this.column);
    this.warnings.push({ message, line: this.line, column: this.column });
  }
}
