import { Token, TokenType } from "./token.js";
import { CST } from "./cst.js";
import { logDebug, logInfo } from "./utils.js";
import { logError, logWarning } from "./utils.js";
import { ASTBuilder } from "./astBuilder.js";
import { AST, ASTNode } from "./ast.js";
import { SemanticAnalyzer } from "./semanticAnalyzer.js";
import { CodeGenerator } from "./codegenerator.js";

export class Parser {
  private tokens: Token[];
  private currentIndex: number = 0;
  private currentToken: Token;
  private programID: number;

  private cst: CST;
  public errors: { message: string; line: number; column: number }[] = [];
  public warnings: { message: string; line: number; column: number }[] = [];

  constructor(tokens: Token[], programID: number) {
    this.tokens = tokens;
    this.currentToken = tokens[0];
    this.programID = programID;

    this.cst = new CST();
  }

  private match(expectedType: string): boolean {
    if (this.currentToken.type === expectedType) {
      logDebug(
        `Matched [${expectedType}] with value [${this.currentToken.value}]`,
        "Parser"
      );
      this.cst.addLeafNode(this.currentToken);

      this.advance();
      return true;
    } else {
      this.reportError(
        `Expected [${expectedType}] but found [${this.currentToken.type}] with value [${this.currentToken.value}]`,
        "Parser"
      );

      this.advance();
      return false;
    }
  }
  private advance(): void {
    this.currentIndex++;

    if (this.currentIndex < this.tokens.length) {
      this.currentToken = this.tokens[this.currentIndex];
    }
  }

  public parse(): ASTNode | null {
    logInfo(`Parsing Program ${this.programID}`, "Parser");
    this.parseProgram();
    logInfo(`Parsing Complete with: ${this.errors.length} errors`, "Parser");

    this.cst.display();

    const astBuilder = new ASTBuilder();
    const ast: AST = astBuilder.build(this.cst.getRoot());

    ast.display();

    const root = ast.getRoot();
    console.log("getRoot() returned:", root);

    if (root) {
      const analyzer = new SemanticAnalyzer(root);
      analyzer.analyze();

      if (this.errors.length === 0) {
        const generator = new CodeGenerator(root, this.programID);
        generator.generate();
      } else {
        this.reportError(
          `Semantic Analyzer Failed with [${this.errors.length}] Errors`
        );
      }
      console.log("Returning AST from parser");
      return root;
    } else {
      logError("AST root was null", 0, 0, "Parser");
      return null;
    }
  }

  private parseProgram(): void {
    logInfo(`parseProgram()`, "Parser");

    this.parseBlock();

    this.match("EOP"); // edit
  }
  private parseBlock(): void {
    logInfo(`parseBlock()`, "Parser");
    this.cst.startNonLeafNode("Block");

    if (this.match("L-BRACE")) {
      this.parseStatementList();
      this.match("R-BRACE");
    } else {
      this.reportError("Expected [{] at start of block", "Parser");
    }
    this.cst.endNonLeafNode();
  }

  private isStatement(token: Token): boolean {
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

  private parseStatementList(): void {
    logInfo(`parseStatementList()`, "Parser");
    this.cst.startNonLeafNode("StatementList");

    if (this.isStatement(this.currentToken)) {
      this.parseStatement();
      this.parseStatementList();
    }

    this.cst.endNonLeafNode();
  }

  private parseStatement(): void {
    logInfo(`parseStatement()`, "Parser");

    const tokenType = this.currentToken.type;

    if (tokenType === "PRINT") {
      this.parsePrintStatement();
    } else if (tokenType === "IF") {
      this.parseIfStatement();
    } else if (tokenType === "WHILE") {
      this.parseWhileStatement();
    } else if (tokenType === "ID") {
      this.parseAssignmentStatement(); // start with ID
    } else if (tokenType === "VAR_TYPE") {
      this.parseVarDecl(); // start with VAR_TYPE
    } else if (tokenType === "L-BRACE") {
      this.parseBlock();
    } else {
      this.reportError(
        `Unexpected Token [${this.currentToken.value}] in statement`,
        "Parser"
      );
      this.advance();
    }
  }

  private parsePrintStatement(): void {
    this.cst.startNonLeafNode("PrintStatement");
    logInfo(`parsePrintStatemnt()`, "Parser");

    if (this.match("PRINT")) {
      if (this.match("LPAREN")) {
        this.parseExpr();

        if (!this.match("RPAREN")) {
          this.reportError(`Expected [RPAREN] to close print()`, "Parser");
        }
      } else {
        this.reportError(`Expected [LPAREN] after print`, "Parser");
      }
    } else {
      this.reportError(`Expected [PRINT] Keyword`, "Parser");
    }

    this.cst.endNonLeafNode();
  }

  private parseExpr(): void {
    this.cst.startNonLeafNode("Expr");
    logInfo(`parseExpr()`, "Parser");

    const tokenType = this.currentToken.type;

    if (tokenType === "LPAREN") {

      if (
        this.tokens[this.currentIndex + 2] &&
        this.tokens[this.currentIndex + 2].type === "BOOL_OP"
      ) {
        this.parseBooleanExpr();
      } else {
        this.match("LPAREN");
        this.parseExpr();
      }

      if (!this.match("RPAREN")) {
        this.reportError("Expected [RPAREN] to close parenthesis", "Parser");
      }
    } else if (tokenType === "DIGIT") {
      this.parseIntExpr();
    } else if (tokenType === "CHAR_LIST") {
      this.parseStringExpr();
    } else if (tokenType === "BOOLEAN_LITERAL") {
      this.match("BOOLEAN_LITERAL");
      if (this.currentToken.type === "BOOL_OP") {
        this.match("BOOL_OP");
        this.parseExpr();
      }
    } else if (tokenType === "ID") {
      this.parseID();
      if (this.currentToken.type === "BOOL_OP") {
        this.match("BOOL_OP");
        this.parseExpr();
      }
    } else {
      this.reportError(
        `Unexpected Token [${this.currentToken.value}] in expression`,
        "Parser"
      );
      this.advance();
    }

    this.cst.endNonLeafNode();
  }

  private parseIntExpr(): void {
    this.cst.startNonLeafNode("IntExpr");

    if (this.match("DIGIT")) {
      if (this.currentToken.type === "INT_OP") {
        this.match("INT_OP");
        this.parseExpr();
      }
    } else {
      this.reportError("Expected digit at start of IntExpr", "Parser");
    }
    this.cst.endNonLeafNode();
  }
  private parseStringExpr(): void {
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

  private parseBooleanExpr(): void {
    this.cst.startNonLeafNode("BooleanExpr");

    if (this.currentToken.type === "LPAREN") {
      this.match("LPAREN");
      this.parseExpr();
      this.match("BOOL_OP");
      this.parseExpr();
      this.match("RPAREN");
    } else if (this.currentToken.type === "BOOLEAN_LITERAL") {
      this.match("BOOLEAN_LITERAL");
    } else {
      this.reportError(`Invalid BooleanExpr`, "Parser");
    }

    this.cst.endNonLeafNode();
  }

  private parseID(): void {
    this.cst.startNonLeafNode("ID");

    if (!this.match("ID")) {
      this.reportError("Expected an Identifier", "Parser");
    }
    this.cst.endNonLeafNode();
  }
  private parseIfStatement(): void {
    this.cst.startNonLeafNode("IfStatement");
    logInfo(`parseIfStatement()`, "Parser");

    if (this.match("IF")) {
      if (this.match("LPAREN")) {
        this.parseExpr();
        this.match(TokenType.RPAREN);
        this.parseBlock();
      } else {
        this.reportError("Expected [LPAREN] after IF", "Parser");
      }
    }

    this.cst.endNonLeafNode();
  }

  private parseWhileStatement(): void {
    this.cst.startNonLeafNode("WhileStatement");
    logInfo(`parseWhileStatement()`, "Parser");

    if (this.match("WHILE")) {
      if (this.match("LPAREN")) {
        this.parseExpr();

        if (!this.match("RPAREN")) {
          this.reportError(
            "Expected [RPAREN] to close WHILE condition",
            "Parser"
          );
        }

        this.parseBlock();
      } else {
        this.reportError("Expected [LPAREN] after WHILE", "Parser");
      }
    }

    this.cst.endNonLeafNode();
  }

  private parseAssignmentStatement(): void {
    this.cst.startNonLeafNode("AssignmentStatement");
    logInfo(`parseAssignmentStatement()`, "Parser");

    if (this.match("ID")) {
      if (this.match("ASSIGN_OP")) {
        this.parseExpr();
      } else {
        this.reportError(
          "Expected ASSIGN (=) after ID in AssignmentStatement",
          "Parser"
        );
      }
    } else {
      this.reportError("Expected ID at start of AssignmentStatement", "Parser");
    }

    this.cst.endNonLeafNode();
  }

  private parseVarDecl(): void {
    this.cst.startNonLeafNode("VarDecl");
    logInfo(`parseVarDecl()`, "Parser");

    if (this.match("VAR_TYPE")) {
      if (this.match("ID")) {
        if (this.currentToken.type === "ASSIGN_OP") {
          this.match("ASSIGN_OP");
          this.parseExpr();
        }
      } else {
        this.reportError("Expected identifier after VAR_TYPE", "Parser");
      }
    } else {
      this.reportError("Expected VAR_TYPE at start of VarDecl", "Parser");
    }

    this.cst.endNonLeafNode();
  }

  public reportError(message: string, source: string = "Lexer"): void {
    logError(message, 0, 0, source);
    this.errors.push({ message, line: 0, column: 0 });
  }
  public reportWarning(message: string, source: string = "Lexer"): void {
    logWarning(message, 0, 0, source);
    this.warnings.push({ message, line: 0, column: 0 });
  }
}
