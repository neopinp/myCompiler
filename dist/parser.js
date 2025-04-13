import { CST } from "./cst.js";
import { logDebug, logInfo } from "./utils.js";
import { logError, logWarning } from "./utils.js";
import { ASTBuilder } from "./astBuilder.js";
export class Parser {
    tokens;
    currentIndex = 0;
    currentToken;
    programID;
    cst;
    errors = [];
    warnings = [];
    constructor(tokens, programID) {
        this.tokens = tokens;
        this.currentToken = tokens[0];
        this.programID = programID;
        this.cst = new CST();
    }
    match(expectedType) {
        if (this.currentToken.type === expectedType) {
            logDebug(`Matched [${expectedType}] with value [${this.currentToken.value}]`, "Parser");
            this.cst.addLeafNode(this.currentToken);
            this.advance();
            return true;
        }
        else {
            this.reportError(`Expected [${expectedType}] but found [${this.currentToken.type}] with value [${this.currentToken.value}]`, "Parser");
            this.advance();
            return false;
        }
    }
    advance() {
        this.currentIndex++;
        if (this.currentIndex < this.tokens.length) {
            this.currentToken = this.tokens[this.currentIndex];
        }
    }
    parse() {
        logInfo(`Parsing Program ${this.programID}`, "Parser");
        logInfo(`parse()`, "Parser");
        this.parseProgram();
        logInfo(`Parsing Complete with: ${this.errors.length} errors`, "Parser");
        if (this.errors.length === 0) {
            logInfo(`Displaying CST for Program ${this.programID}`, "Parser");
            this.cst.display();
            // 🎯 Build and display the AST here
            logInfo(`AST - Building AST for Program ${this.programID}`, "Parser");
            const astBuilder = new ASTBuilder();
            const ast = astBuilder.build(this.cst.getRoot());
            logInfo(`AST - Displaying AST for Program ${this.programID}`, "Parser");
            ast.display();
            return this.cst;
        }
        else {
            logInfo(`CST Terminated\n`, "Parser");
            return null;
        }
    }
    parseProgram() {
        logInfo(`parseProgram()`, "Parser");
        this.parseBlock();
        this.match("EOP"); // edit
    }
    parseBlock() {
        logInfo(`parseBlock()`, "Parser");
        this.cst.startNonLeafNode("Block");
        if (this.match("L-BRACE")) {
            this.parseStatementList();
            this.match("R-BRACE");
        }
        else {
            this.reportError("Expected [{] at start of block", "Parser");
        }
        this.cst.endNonLeafNode();
    }
    isStatement(token) {
        const typesOfStatements = [
            "PRINT",
            "ID",
            "VAR_TYPE",
            "WHILE",
            "IF",
            "L-BRACE",
        ];
        return typesOfStatements.includes(token.type);
    }
    parseStatementList() {
        logInfo(`parseStatementList()`, "Parser");
        this.cst.startNonLeafNode("StatementList");
        if (this.isStatement(this.currentToken)) {
            this.parseStatement();
            this.parseStatementList();
        }
        this.cst.endNonLeafNode();
    }
    parseStatement() {
        logInfo(`parseStatement()`, "Parser");
        const tokenType = this.currentToken.type;
        if (tokenType === "PRINT") {
            this.parsePrintStatement();
        }
        else if (tokenType === "IF") {
            this.parseIfStatement();
        }
        else if (tokenType === "WHILE") {
            this.parseWhileStatement();
        }
        else if (tokenType === "ID") {
            this.parseAssignmentStatement(); // start with ID
        }
        else if (tokenType === "VAR_TYPE") {
            this.parseVarDecl(); // start with VAR_TYPE
        }
        else if (tokenType === "L-BRACE") {
            this.parseBlock();
        }
        else {
            this.reportError(`Unexpected Token [${this.currentToken.value}] in statement`, "Parser");
            this.advance();
        }
    }
    parsePrintStatement() {
        this.cst.startNonLeafNode("PrintStatement");
        logInfo(`parsePrintStatemnt()`, "Parser");
        if (this.match("PRINT")) {
            if (this.match("LPAREN")) {
                this.parseExpr();
                if (!this.match("RPAREN")) {
                    this.reportError(`Expected [RPAREN] to close print()`, "Parser");
                }
            }
            else {
                this.reportError(`Expected [LPAREN] after print`, "Parser");
            }
        }
        else {
            this.reportError(`Expected [PRINT] Keyword`, "Parser");
        }
        this.cst.endNonLeafNode();
    }
    parseExpr() {
        this.cst.startNonLeafNode("Expr");
        logInfo(`parseExpr()`, "Parser");
        const tokenType = this.currentToken.type;
        if (tokenType === "LPAREN") {
            this.match("LPAREN");
            this.parseExpr();
            if (this.currentToken.type === "BOOL_OP") {
                this.match("BOOL_OP");
                this.parseExpr();
            }
            // ✅ Safely match closing RPAREN — let match() handle any mismatch
            if (!this.match("RPAREN")) {
                this.reportError("Expected [RPAREN] to close parenthesis", "Parser");
            }
        }
        else if (tokenType === "DIGIT") {
            this.parseIntExpr();
        }
        else if (tokenType === "CHAR_LIST") {
            this.parseStringExpr();
        }
        else if (tokenType === "BOOLEAN_LITERAL") {
            this.match("BOOLEAN_LITERAL");
            if (this.currentToken.type === "BOOL_OP") {
                this.match("BOOL_OP");
                this.parseExpr();
            }
        }
        else if (tokenType === "ID") {
            this.parseID();
            if (this.currentToken.type === "BOOL_OP") {
                this.match("BOOL_OP");
                this.parseExpr();
            }
        }
        else {
            this.reportError(`Unexpected Token [${this.currentToken.value}] in expression`, "Parser");
            this.advance();
        }
        this.cst.endNonLeafNode();
    }
    parseIntExpr() {
        this.cst.startNonLeafNode("IntExpr");
        if (this.match("DIGIT")) {
            if (this.currentToken.type === "INT_OP") {
                this.match("INT_OP");
                this.parseExpr();
            }
        }
        else {
            this.reportError("Expected digit at start of IntExpr", "Parser");
        }
        this.cst.endNonLeafNode();
    }
    parseStringExpr() {
        this.cst.startNonLeafNode("StringExpr");
        logInfo("parseStringExpr()", "Parser");
        if (this.match("CHAR_LIST")) {
            while (["CHAR", "SPACE"].includes(this.currentToken.type)) {
                this.match(this.currentToken.type);
            }
            if (!this.match("CHAR_LIST")) {
                this.reportError(`Expected closing ["] for string`, "Parser");
            }
        }
        this.cst.endNonLeafNode();
    }
    parseBooleanExpr() {
        this.cst.startNonLeafNode("BooleanExpr");
        if (this.currentToken.type === "LPAREN") {
            this.match("LPAREN");
            this.parseExpr();
            this.match("BOOL_OP");
            this.parseExpr();
            this.match("RPAREN");
        }
        else if (this.currentToken.type === "BOOLEAN_LITERAL") {
            this.match("BOOLEAN_LITERAL");
        }
        else {
            this.reportError(`Invalid BooleanExpr`, "Parser");
        }
        this.cst.endNonLeafNode();
    }
    parseID() {
        this.cst.startNonLeafNode("ID");
        if (!this.match("ID")) {
            this.reportError("Expected an Identifier", "Parser");
        }
        this.cst.endNonLeafNode();
    }
    parseIfStatement() {
        this.cst.startNonLeafNode("IfStatement");
        logInfo(`parseIfStatement()`, "Parser");
        if (this.match("IF")) {
            if (this.match("LPAREN")) {
                this.parseExpr();
                this.parseBlock();
            }
            else {
                this.reportError("Expected [LPAREN] after IF", "Parser");
            }
        }
        this.cst.endNonLeafNode();
    }
    parseWhileStatement() {
        this.cst.startNonLeafNode("WhileStatement");
        logInfo(`parseWhileStatement()`, "Parser");
        if (this.match("WHILE")) {
            if (this.match("LPAREN")) {
                this.parseExpr();
                if (!this.match("RPAREN")) {
                    this.reportError("Expected [RPAREN] to close WHILE condition", "Parser");
                }
                this.parseBlock();
            }
            else {
                this.reportError("Expected [LPAREN] after WHILE", "Parser");
            }
        }
        this.cst.endNonLeafNode();
    }
    parseAssignmentStatement() {
        this.cst.startNonLeafNode("AssignmentStatement");
        logInfo(`parseAssignmentStatement()`, "Parser");
        if (this.match("ID")) {
            if (this.match("ASSIGN_OP")) {
                this.parseExpr();
            }
            else {
                this.reportError("Expected ASSIGN (=) after ID in AssignmentStatement", "Parser");
            }
        }
        else {
            this.reportError("Expected ID at start of AssignmentStatement", "Parser");
        }
        this.cst.endNonLeafNode();
    }
    parseVarDecl() {
        this.cst.startNonLeafNode("VarDecl");
        logInfo(`parseVarDecl()`, "Parser");
        if (this.match("VAR_TYPE")) {
            if (this.match("ID")) {
                if (this.currentToken.type === "ASSIGN_OP") {
                    this.match("ASSIGN_OP");
                    this.parseExpr();
                }
            }
            else {
                this.reportError("Expected identifier after VAR_TYPE", "Parser");
            }
        }
        else {
            this.reportError("Expected VAR_TYPE at start of VarDecl", "Parser");
        }
        this.cst.endNonLeafNode();
    }
    reportError(message, source = "Lexer") {
        logError(message, 0, 0, source);
        this.errors.push({ message, line: 0, column: 0 });
    }
    reportWarning(message, source = "Lexer") {
        logWarning(message, 0, 0, source);
        this.warnings.push({ message, line: 0, column: 0 });
    }
}
//# sourceMappingURL=parser.js.map