export class Token {
    type;
    value;
    line;
    column;
    constructor(type, value, line, column) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }
    toString() {
        return `[${this.type}] '${this.value}' at (${this.line}:${this.column})`;
    }
}
export var TokenType;
(function (TokenType) {
    TokenType["LBRACE"] = "L-BRACE";
    TokenType["RBRACE"] = "R-BRACE";
    TokenType["PRINT"] = "PRINT";
    TokenType["WHILE"] = "WHILE";
    TokenType["IF"] = "IF";
    TokenType["VAR_TYPE"] = "VAR_TYPE";
    TokenType["BOOLEAN_LITERAL"] = "BOOLEAN_LITERAL";
    TokenType["IDENTIFIER"] = "ID";
    TokenType["DIGIT"] = "DIGIT";
    TokenType["CHAR_LIST"] = "CHAR_LIST";
    TokenType["CHAR"] = "CHAR";
    TokenType["ASSIGN_OP"] = "ASSIGN_OP";
    TokenType["INT_OP"] = "INT_OP";
    TokenType["BOOL_OP"] = "BOOL_OP";
    TokenType["LPAREN"] = "L-PAREN";
    TokenType["RPAREN"] = "R-PAREN";
    TokenType["EOP"] = "EOP";
    TokenType["COMMENT"] = "COMMENT";
    TokenType["INVALID"] = "INVALID";
    TokenType["SPACE"] = "SPACE";
})(TokenType || (TokenType = {}));
//# sourceMappingURL=token.js.map