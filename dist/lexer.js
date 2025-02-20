/*
PROVIDE ERRORS AND WARNINGS WITH DETAILED MESSAGES
VERBOSE OUTPUT MODE (DEBUG AND INFO LOGS)
TESTING
 */
import { reportWarningsandErrors } from "./gui.js";
import { Token, TokenType } from "./token.js";
import { logInfo, logError, logDebug, logWarning } from "./utils.js";
export class Lexer {
    source = "";
    programID = 1;
    tokens = [];
    currentChar = "";
    line = 1;
    column = 0;
    position = 0;
    errors = [];
    warnings = [];
    endOfFileReached = false;
    foundEOP = false;
    constructor(source) {
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
    advance() {
        if (this.position < this.source.length) {
            this.currentChar = this.source[this.position];
            this.column++;
            this.position++;
        }
        else {
            this.currentChar = "\0"; // END OF FILE MARKER
            this.endOfFileReached = true;
            this.foundEOP = true;
        }
    }
    addToken(type, startColumn) {
        const newTokens = new Token(type, this.currentChar, this.line, startColumn);
        this.tokens.push(newTokens);
        logDebug(`${newTokens.type} [${newTokens.value}] found at (${newTokens.line}: ${newTokens.column})`);
        this.advance();
    }
    // Start token rules from most specific to least specific
    // continue to read characters until you hit a $EOP or whitespace
    tokenize() {
        logInfo(`Lexing Program ${this.programID}`);
        this.foundEOP = false;
        while (this.currentChar !== "\0") {
            if (/\s/.test(this.currentChar)) {
                this.handleWhiteSpace();
            }
            else if (this.currentChar === "{") {
                this.addToken(TokenType.OPEN_BLOCK, this.column);
            }
            else if (this.currentChar === "}") {
                this.addToken(TokenType.CLOSE_BLOCK, this.column);
            }
            else if (this.currentChar === "(") {
                this.addToken(TokenType.LPAREN, this.column);
            }
            else if (this.currentChar === ")") {
                this.addToken(TokenType.RPAREN, this.column);
            }
            else if (this.currentChar === "+") {
                this.addToken(TokenType.INT_OP, this.column);
            }
            else if (this.currentChar === '"') {
                this.tokenizeString();
            }
            else if (/[a-z]/.test(this.currentChar)) {
                this.tokenizeIdentifier();
            }
            else if (/\d/.test(this.currentChar)) {
                this.tokenizeNumber();
            }
            else if (this.currentChar === "=") {
                this.tokenizeEquals();
            }
            else if (this.currentChar === "!") {
                this.tokenizeNotEquals();
            }
            else if (this.currentChar === "$") {
                this.tokenizeEOP();
                this.foundEOP = true;
            }
            else {
                this.reportError(`Unrecognized character '${this.currentChar}'`); // add errors as you get them
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
    tokenizeIdentifier() {
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
            this.advance();
        }
        // Determine keyword or identifier
        const keywords = {
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
        logDebug(`${tokenType} [${identifier}] found at (${this.line}:${startColumn})`);
    }
    /* STRINGS - " "
    Capture all characters AND SPACES until you reach a closing quote
    Contains [a-z] and spaces
    */
    tokenizeString() {
        let startColumn = this.column; // Capture starting column of the quote
        // Opening quote
        if (this.currentChar === '"') {
            this.addToken(TokenType.CHAR_LIST, startColumn);
            this.advance();
        }
        else {
            this.reportError(`Unterminated string literal starting at ${this.line}:${startColumn}`);
            return;
        }
        // Process each character inside the string
        while (this.currentChar !== '"' && this.currentChar !== "\0") {
            if (/[a-z]/.test(this.currentChar)) {
                // Assuming only lowercase characters are valid
                this.addToken(TokenType.CHAR, this.column);
                this.advance();
            }
            else {
                this.reportError(`Invalid character ${this.currentChar} in string.`);
                this.advance();
            }
        }
        // Closing quote
        if (this.currentChar === '"') {
            this.addToken(TokenType.CHAR_LIST, startColumn);
            this.advance();
        }
        else {
            this.reportError(`Missing closing quote for string starting at ${this.line}:${startColumn}`);
        }
    }
    // Longest Match First - Check if there is a following '=' for "=="
    tokenizeEquals() {
        let startColumn = this.column;
        this.advance();
        if (this.currentChar === "=") {
            this.advance();
            this.tokens.push(new Token(TokenType.BOOL_OP, "==", this.line, startColumn));
            logDebug(`${TokenType.BOOL_OP} [==] found at (${this.line}: ${this.column})`);
        }
        else {
            this.tokens.push(new Token(TokenType.ASSIGN_OP, "=", this.line, startColumn));
            logDebug(`${TokenType.ASSIGN_OP} [=] found at (${this.line}: ${this.column})`);
        }
    }
    tokenizeNotEquals() {
        let startColumn = this.column;
        this.advance();
        if (this.currentChar === "=") {
            this.advance();
            this.tokens.push(new Token(TokenType.BOOL_OP, "!=", this.line, startColumn));
        }
        else {
            this.reportError("Unrecognized token");
        }
    }
    tokenizeNumber() {
        let startColumn = this.column;
        let number = "";
        while (/\d/.test(this.currentChar)) {
            number += this.currentChar;
            this.advance();
        }
        this.tokens.push(new Token(TokenType.DIGIT, number, this.line, startColumn));
        logDebug(`${TokenType.DIGIT} [${number}] found at (${this.line}:${startColumn})`);
    }
    tokenizeEOP() {
        this.addToken(TokenType.EOP, this.column);
        reportWarningsandErrors(this);
        this.programID++;
        this.skipWhiteSpace();
        if (!this.endOfFileReached && this.currentChar !== "\0") {
            this.foundEOP = false;
            logInfo(`Lexing Program ${this.programID}`);
        }
    }
    handleWhiteSpace() {
        if (this.currentChar === "\n") {
            this.line++;
            this.column = 0;
        }
        this.advance();
    }
    skipWhiteSpace() {
        while (/\s/.test(this.currentChar)) {
            this.advance();
        }
    }
    // for immediate reporting / storing for output at completion - move to gui.ts
    reportError(message) {
        logError(message, this.line, this.column);
        this.errors.push({ message, line: this.line, column: this.column });
    }
    reportWarning(message) {
        logWarning(message, this.line, this.column);
        this.warnings.push({ message, line: this.line, column: this.column });
    }
}
//# sourceMappingURL=lexer.js.map