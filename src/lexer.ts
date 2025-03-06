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
      `${newTokens.type} [${newTokens.value}] | (${newTokens.line}:${newTokens.column})`
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
        this.reportError(`Unrecognized Token PID:${this.programID} [Tab]`);
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
          `Unrecognized character PID:${this.programID} ['${this.currentChar}']`
        ); // add errors as you get them
        this.advance();
      }
    }
    if (!this.foundEOP) {
      this.reportWarning(`PID:${this.programID} is missing an EOP ($) at the end`);
      reportWarningsandErrors(this);
    }
    return this.tokens;
  }

  // KEYWORDS & IDENTIFIERS
  private tokenizeIdentifier(): void {
    let startColumn = this.column;
    let buffer = ""; // Accumulation buffer

    // Define keyword mappings
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

    while (/[a-z]/.test(this.currentChar)) {
      buffer += this.currentChar;
      this.advance();

      // accumulate a string until you reach a keyword
      for (const key in keywords) {
        let keywordIndex = buffer.indexOf(key);
        if (keywordIndex !== -1) {
          // Tokenize everything before the keyword as single-character identifiers
          for (let i = 0; i < keywordIndex; i++) {
            this.tokens.push(
              new Token(
                TokenType.IDENTIFIER,
                buffer[i],
                this.line,
                startColumn + i
              )
            );
            logDebug(
              `ID [${buffer[i]}] | (${this.line}:${startColumn + i})`
            );
          }

          this.tokens.push(
            new Token(keywords[key], key, this.line, startColumn + keywordIndex)
          );
          logDebug(
            `${keywords[key]} [${key}] | (${this.line}:${
              startColumn + keywordIndex
          })`
          );

          // Reset buffer and start accumulating after the keyword
          buffer = buffer.substring(keywordIndex + key.length);
          startColumn += keywordIndex + key.length;
          break;
        }
      }
    }

    // If there are remaining characters after the last keyword, tokenize them as single-letter identifiers
    for (let i = 0; i < buffer.length; i++) {
      this.tokens.push(
        new Token(TokenType.IDENTIFIER, buffer[i], this.line, startColumn + i)
      );
      logDebug(`ID [${buffer[i]}] | (${this.line}:${startColumn + i})`);
    }
  }

  /* STRINGS - " "
  Capture all characters AND SPACES until you reach a closing quote 
  Contains [a-z] and spaces 
  */
  private tokenizeString(): void {
    let startColumn = this.column; // Capture starting column of the quote
    let startline = this.line;

    // Opening quote
    if (this.currentChar === '"') {
      this.addToken(TokenType.CHAR_LIST, this.column);
    } else {
      this.reportError(
        `Unterminated string literal PID:${this.programID} | ${this.line}:${this.column}`
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
        this.reportError(`Invalid character PID:${this.programID} [${this.currentChar}] in string`);
        this.advance();
      }
    }

    // Closing quote
    if (this.currentChar === '"') {
      this.addToken(TokenType.CHAR_LIST, this.column);
    } else {
      this.reportError(
        `Missing closing quote for string PID:${this.programID}`
      );
    }
  }

  // Longest Match First - Check if there is a following '=' for "=="
  private tokenizeEquals() {
    let startColumn = this.column;
    this.advance();
    if (this.currentChar === "=") {
      this.tokens.push(
        new Token(TokenType.BOOL_OP, "==", this.line, startColumn)
      );
      logDebug(
        `${TokenType.BOOL_OP} [==] | (${this.line}: ${this.column})`
      );
      this.advance();
    } else {
      this.tokens.push(
        new Token(TokenType.ASSIGN_OP, "=", this.line, startColumn)
      );
      logDebug(
        `${TokenType.ASSIGN_OP} [=] | (${this.line}: ${startColumn})`
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
      logDebug(
        `${TokenType.BOOL_OP} [!=] | (${this.line}: ${this.column})`
      );
    } else {
      this.reportError(`PID:${this.programID} Unrecognized token`);
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
      `${TokenType.DIGIT} [${number}] | (${this.line}:${startColumn})`
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
    let startLine = this.line;
    this.advance();

    if (this.currentChar !== "*") {
      this.reportError(`Missing Opening [*]`);
      return;
    }
    this.advance();

    while (!this.endOfFileReached) {
      if (this.currentChar === "*" && this.peek() === "/") {
        this.advance();
        this.advance();
        return;
      }
      this.advance();
    }
    this.reportError(
      `Unclosed Comment Starting at (${startLine}:${startColumn})`
    );
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
  private peek(offset: number = 1): string {
    if (this.position + offset - 1 < this.source.length) {
      return this.source[this.position + offset - 1];
    }
    return "\0"; 
  }
}
