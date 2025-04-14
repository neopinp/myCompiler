import { logInfo, logError } from "./utils.js";
import { ASTNode } from "./ast.js";

export class SemanticAnalyzer {
  symbolTableStack: Map<string, string>[];
  errors: string[];

  constructor(private ast: ASTNode) {
    this.symbolTableStack = [new Map()];
    this.errors = [];
  }

  analyze() {
    this.visit(this.ast);
    this.reportErrors();
  }

  visit(node: ASTNode): string | void {
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
        const varType = this.lookupVariable(varName);
        if (!varType) {
          this.reportError(`Undeclared Identifier '${varName}'.`);
          return "undefined";
        }
        return varType;
      }
      case "If":
      case "While": {
        const [condition, block] = node.children;
        const condType = this.visit(condition);
        if (condType !== "boolean") {
          this.reportError(
            `${node.name} condition must be boolean, got '${condType}' instead.`,
            condition.line,
            condition.column
          );
        }
        this.visit(block); // Block already triggers enter/exitScope
        break;
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

    if (!this.declareVariable(varName, varType)) {
      this.reportError(
        `Variable '${varName}' already declared in this scope.`,
        node.line,
        node.column
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

    if (actualType && expectedType !== actualType) {
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
  declareVariable(name: string, type: string): boolean {
    const currentScope =
      this.symbolTableStack[this.symbolTableStack.length - 1];
    if (currentScope.has(name)) return false;
    currentScope.set(name, type);
    return true;
  }
  lookupVariable(name: string): string | undefined {
    for (let i = this.symbolTableStack.length - 1; i >= 0; i--) {
      const scope = this.symbolTableStack[i];
      if (scope.has(name)) return scope.get(name);
    }
    return undefined;
  }
}
