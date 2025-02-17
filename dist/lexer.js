/*
PROVIDE ERRORS AND WARNINGS WITH DETAILED MESSAGES
VERBOSE OUTPUT MODE (DEBUG AND INFO LOGS)
TESTING
 */
import { Token, TokenType } from "./token.js";
import { logInfo, logError } from "./utils.js";
export class Lexer {
    source = "";
    tokens = [];
    currentChar = ""; // different than value?
    line = 1;
    column = 0;
    position = 0;
    errors = [];
    constructor(source) {
        this.source = source;
        this.tokens = [];
        this.currentChar = "";
        this.line = 1;
        this.column = 0;
        this.position = 0;
        this.errors = [];
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
        }
    }
    addToken(type) {
        this.tokens.push(new Token(type, this.currentChar, this.line, this.column));
        this.advance();
    }
    // Start token rules from most specific to least specific 
    // continue to read characters until you hit a $EOP or whitespace 
    tokenize() {
        logInfo("Starting Lexical Analysis...");
        while (this.currentChar != "\0") {
            if (/\s/.test(this.currentChar)) {
                this.handleWhiteSpace();
            }
            else if (this.currentChar === "{") {
                this.addToken(TokenType.OPEN_BLOCK);
            }
            else if (this.currentChar === "}") {
                this.addToken(TokenType.CLOSE_BLOCK);
            }
            else if (this.currentChar === "$") {
                this.addToken(TokenType.EOP);
            }
            else if (/[a-z]/.test(this.currentChar)) {
                this.tokenizeIdentifier();
            }
            else if (/\d/.test(this.currentChar)) {
                this.addToken(TokenType.DIGIT);
            }
            else {
                this.reportError(`Unrecognized character '${this.currentChar}'`);
                this.advance();
            }
        }
        logInfo("Lexical analysis complete.");
        return this.tokens;
    }
    // KEYWORDS & IDENTIFIERS
    tokenizeIdentifier() {
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
        const keywords = {
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
    handleWhiteSpace() {
        if (this.currentChar === "\n") {
            this.line++;
            this.column = 0;
        }
        this.advance();
    }
    // for immediate reporting / storing for output at completion
    reportError(message) {
        logError(message, this.line, this.column);
        this.errors.push({ message, line: this.line, column: this.column });
    }
}
//# sourceMappingURL=lexer.js.map