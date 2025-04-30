import { logInfo, logError } from "./utils.js";
import { ASTNode } from "./ast.js";
import { appendPhaseSeparator } from "./utils.js"; // make sure you import it!


interface SymbolInfo {
  name: string;
  type: string;
  line: number;
  column: number;
  scopeLevel: number;

}

export class SemanticAnalyzer {
  symbolTableStack: Map<string, SymbolInfo>[];
  errors: string[];
  symbols: SymbolInfo[]; 

  constructor(private ast: ASTNode) {
    this.symbolTableStack = [new Map()];
    this.errors = [];
    this.symbols = [];
  }

  analyze() {
    this.visit(this.ast);
    this.reportErrors();
    this.displaySymbolTable();
  }

  visit(node: ASTNode): string | void {
    if (!node) {
      this.reportError("Tried to visit an undefined node.");
      return;
    }
    switch (node.name) {
      case "Block":
        this.enterScope();
        node.children.forEach((child) => this.visit(child));
        this.exitScope();
        break;
      case "VarDecl":
        this.handleVarDecl(node);
        break;
      case "Assignment":
        this.handleAssignment(node);
        break;
      case "Print":
        this.handlePrint(node);
        break;
      case "IntExpr":
        return "int";
      case "BooleanExpr":
        return "boolean";
      case "StringExpr":
        return "string";
      case "Identifier": {
        const varName = node.value ?? node.name;
        const symbol = this.lookupVariable(varName);
        if (!symbol) {
          this.reportError(`Undeclared Identifier '${varName}'.`);
          return "undefined";
        }
        return symbol.type;
      }

      case "If":
      case "While": {
        this.handleWhile(node); 
        break;
      }

      case "If":
      case "While": {
        this.handleWhile(node);
      }
      default:
        node.children.forEach((child) => this.visit(child));
        break;
    }
  }

  handleVarDecl(node: ASTNode) {
    const [typeNode, idNode] = node.children;
    const varType = typeNode.name;
    const varName = idNode.value ?? idNode.name;
    const { line, column } = idNode;

    if (!this.declareVariable(varName, varType, line, column)) {
      this.reportError(
        `Variable '${varName}' already declared in this scope.`,
        line,
        column
      );
    }
  }

  handleAssignment(node: ASTNode) {
    const [idNode, exprNode] = node.children;
    const varName = idNode?.value ?? idNode?.name ?? "???";

    if (!exprNode) {
      this.reportError(
        `Assignment to '${varName}' is missing an expression.`,
        node.line,
        node.column
      );
      return;
    }

    const expectedType = this.lookupVariable(varName);
    const actualType = this.visit(exprNode);

    if (!expectedType) {
      this.reportError(
        `Assignment to undeclared variable '${varName}'. `,
        node.line,
        node.column
      );
      return;
    }

    if (actualType && expectedType?.type !== actualType) {
      this.reportError(
        `Type mismatch: Cannot assign ${actualType} to ${expectedType} variable '${varName}'.`,
        node.line,
        node.column
      );
    }
  }

  handlePrint(node: ASTNode) {
    const exprType = this.visit(node.children[0]);
    if (!exprType) {
      this.reportError(
        "Print statement has invalid or undeclared expression.",
        node.line,
        node.column
      );
    }
  }
  handleWhile(node: ASTNode) {
    const condExpr = node.children[0];
    const bodyBlock = node.children[1];

    if (!condExpr || !bodyBlock) {
      this.reportError("Bad While Loop.", node.line, node.column);
      return;
    }

    const condType = this.visit(condExpr);
    if (condType !== "boolean") {
      this.reportError(
        "While condition must evaluate to a boolean.",
        condExpr.line,
        condExpr.column
      );
    }

    this.enterScope();
    this.visit(bodyBlock);
    this.exitScope();
  }

  reportError(message: string, line = 0, column = 0) {
    logError(message, line, column, "SemanticAnalyzer");
    this.errors.push(message);
  }

  reportErrors() {
    if (this.errors.length === 0) {
      logInfo("Semantic Analysis: No Errors", "SemanticAnalyzer");
    }
  }

  // SCOPE CHECKING FUNCTIONS
  enterScope() {
    this.symbolTableStack.push(new Map());
  }

  exitScope() {
    this.symbolTableStack.pop();
  }

  // VARIABLE HELPERS
  declareVariable(
    name: string,
    type: string,
    line: number,
    column: number
  ): boolean {
    const currentScope =
      this.symbolTableStack[this.symbolTableStack.length - 1];
    if (currentScope.has(name)) return false;

    const info: SymbolInfo = {
      name,
      type,
      line,
      column,
      scopeLevel: this.symbolTableStack.length - 1,
    };

    currentScope.set(name, info);
    this.symbols.push(info);
    return true;
  }
  lookupVariable(name: string): SymbolInfo | undefined {
    for (let i = this.symbolTableStack.length - 1; i >= 0; i--) {
      const scope = this.symbolTableStack[i];
      if (scope.has(name)) {
        return scope.get(name);
      }
    }
    return undefined;
  }

  displaySymbolTable() {
    const output = document.getElementById("output");
    var programID = 0;
    if (!output) return;
    

    const label = document.createElement("h3");
    label.textContent = "Symbol Table";
    label.style.marginTop = "20px";

    const table = document.createElement("table");
    table.innerHTML = `
      <thead><tr><th>Name</th><th>Type</th><th>Line</th><th>Column</th><th>Scope Level</th></tr></thead>
      <tbody>
        ${this.symbols
          .map(
            (sym) => `
          <tr>
            <td>${sym.name}</td>
            <td>${sym.type}</td>
            <td>${sym.line}</td>
            <td>${sym.column}</td>
            <td>${sym.scopeLevel}</td>
          </tr>`
          )
          .join("")}
      </tbody>`;

    table.classList.add("table", "table-striped", "table-bordered");
    output.appendChild(label);
    output.appendChild(table);
    appendPhaseSeparator();

  }
}
