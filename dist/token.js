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
    TokenType["OPEN_BLOCK"] = "OPEN_BLOCK";
    TokenType["CLOSE_BLOCK"] = "CLOSE_BLOCK";
    TokenType["PRINT"] = "PRINT";
    TokenType["WHILE"] = "WHILE";
    TokenType["IF"] = "IF";
    TokenType["INT_TYPE"] = "INT_TYPE";
    TokenType["STRING_TYPE"] = "STRING_TYPE";
    TokenType["BOOLEAN_TYPE"] = "BOOEAL_TYPE";
    TokenType["BOOLEAN_LITERAL"] = "BOOLEAN_LITERAL";
    TokenType["IDENTIFIER"] = "IDENTIFIER";
    TokenType["DIGIT"] = "DIGIT";
    TokenType["STRING"] = "STRING";
    TokenType["ASSIGN_OP"] = "ASSIGN_OP";
    TokenType["INT_OP"] = "INT_OP";
    TokenType["BOOL_OP"] = "BOOL_OP";
    TokenType["LPAREN"] = "OPAREN";
    TokenType["RPAREN"] = "CPAREN";
    TokenType["EOP"] = "EOP";
    TokenType["COMMENT"] = "COMMENT";
    TokenType["INVALID"] = "INVALID"; // unkown token 
})(TokenType || (TokenType = {}));
//# sourceMappingURL=token.js.map