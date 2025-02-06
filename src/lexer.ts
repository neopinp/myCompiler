/* 
PROVIDE ERRORS AND WARNINGS WITH DETAILED MESSAGES
VERBOSE OUTPUT MODE (DEBUG AND INFO LOGS)
TESTING
 */ 

import { Token, TokenType } from "./token.js";
import { logInfo, logError } from "./utils.js";

export class Lexer {
  private source: string = "";
  private tokens: Token[] = [];
  private currentChar: string = ""; // different than value?
  private line: number = 1;
  private column: number = 0;
  private position: number = 0;
  public errors: {message: string, line: number, column: number}[] = [];

  constructor(source: string) {
    this.source = source;
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

  public tokenize(): Token[] {
    logInfo("Starting Lexical Analysis...");

    while (this.currentChar != "\0") {
      if (/\s/.test(this.currentChar)) {
        this.handleWhiteSpace();
      } else if (this.currentChar === "{") {
        this.addToken(TokenType.OPEN_BLOCK);
      } else if (this.currentChar === "}") {
        this.addToken(TokenType.CLOSE_BLOCK);
      } else if (this.currentChar === "$") {
        this.addToken(TokenType.EOP);
      } else if (/[a-z]/.test(this.currentChar)) {
        this.tokenizeIdentifier();
      } else if (/\d/.test(this.currentChar)) {
        this.addToken(TokenType.DIGIT);
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

  private handleWhiteSpace(): void {
    if (this.currentChar === "\n") {
      this.line++;
      this.column = 0;
    }
    this.advance();
  }
  private addToken(type: TokenType): void {
    this.tokens.push(new Token(type, this.currentChar, this.line, this.column));
    this.advance();
  }
  // for immediate reporting / storing for output at completion
  private reportError(message: string): void {
    logError(message, this.line, this.column);
    this.errors.push({message, line: this.line, column: this.column})
  }
}
