/* 
PROVIDE ERRORS AND WARNINGS WITH DETAILED MESSAGES
VERBOSE OUTPUT MODE (DEBUG AND INFO LOGS)
TESTING
 */

import { Token, TokenType } from "./token.js";
import { logInfo, logError } from "./utils.js";

export class Lexer {
  private source: string = "";
  public programID: number = 1;
  private tokens: Token[] = [];
  private currentChar: string = ""; // different than value?
  private line: number = 1;
  private column: number = 0;
  private position: number = 0;
  public errors: { message: string; line: number; column: number }[] = [];

  constructor(source: string) {
    this.source = source;
    this.programID = 1;
    this.tokens = [];
    this.currentChar = "";
    this.line = 1;
    this.column = 0;
    this.position = 0;
    this.errors = [];
    this.advance();
  }

  private advance(): void {
    if (this.position < this.source.length) {
      this.currentChar = this.source[this.position];
      this.column++;
      this.position++;
    } else {
      this.currentChar = "\0"; // END OF FILE MARKER
    }
  }
  private addToken(type: TokenType): void {
    this.tokens.push(new Token(type, this.currentChar, this.line, this.column));
    this.advance();
  }

  // Start token rules from most specific to least specific
  // continue to read characters until you hit a $EOP or whitespace

  public tokenize(): Token[] {
    logInfo(`Lexing Program ${this.programID}`);

    while (this.currentChar != "\0") {
      if (/\s/.test(this.currentChar)) {
        this.handleWhiteSpace();
      } else if (this.currentChar === "{") {
        this.addToken(TokenType.OPEN_BLOCK);
      } else if (this.currentChar === "}") {
        this.addToken(TokenType.CLOSE_BLOCK);
      } else if (this.currentChar === "$") {
        this.addToken(TokenType.EOP);
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
      } else {
        this.reportError(`Unrecognized character '${this.currentChar}'`);
        this.advance();
      }
    }
    logInfo("Lexical analysis complete.");
    return this.tokens;
  }

  // KEYWORDS & IDENTIFIERS
  private tokenizeIdentifier(): void {
    let startColumn = 0; // start of identifier
    let identifier = "";
    /* 
    Start token searching at alpha char
    If Identifier === keywords[identifier] type === keyword | identifier 
    KEYWORDS === predefined words that cannot be used as variables

    EDIT: should use longet match + rule order 
    */

    while (/[a-z]/.test(this.currentChar)) {
      identifier += this.currentChar;
      this.advance();
    }

    // Determine keyword or identifier
    const keywords: Record<string, TokenType> = {
      print: TokenType.PRINT,
      while: TokenType.WHILE,
      if: TokenType.IF,
      int: TokenType.INT_TYPE,
      string: TokenType.STRING_TYPE,
      boolean: TokenType.BOOLEAN_LITERAL,
      true: TokenType.BOOLEAN_TYPE,
      false: TokenType.BOOLEAN_LITERAL,
    };

    const tokenType = keywords[identifier] || TokenType.IDENTIFIER;
    this.tokens.push(new Token(tokenType, identifier, this.line, startColumn));
  }

  /* STRINGS - " "
  Capture all characters AND SPACES until you reach a closing quote 
  Contains [a-z] and spaces 
  */
  private tokenizeString() {
    let startColumn = this.column;
    let stringExpr = "";

    this.advance();

    while (this.currentChar !== '"' && this.currentChar !== "\0") {
      if (/[A-Za-z]/.test(this.currentChar)) {
        stringExpr += this.currentChar;
        this.advance();
      } else {
        this.reportError(`Invalid character ${this.currentChar} in string.`);
        this.advance();
      }
    }
    if (this.currentChar === '"') {
      this.tokens.push(
        new Token(TokenType.STRING, `"${stringExpr}"`, this.line, startColumn)
      );
      this.advance();
    } else {
      this.reportError(
        `Unterminted string literal strating at ${this.line}:${startColumn}`
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
    } else {
      this.tokens.push(
        new Token(TokenType.BOOL_OP, "=", this.line, startColumn)
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
  }

  private handleWhiteSpace(): void {
    if (this.currentChar === "\n") {
      this.line++;
      this.column = 0;
    }
    this.advance();
  }
  // for immediate reporting / storing for output at completion
  private reportError(message: string): void {
    logError(message, this.line, this.column);
    this.errors.push({ message, line: this.line, column: this.column });
  }
}
