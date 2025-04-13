import { logInfo, logError } from "./utils.js";
export class SemanticAnalyzer {
    ast;
    symbolTable;
    errors;
    constructor(ast) {
        this.ast = ast;
        this.symbolTable = new Map();
        this.errors = [];
    }
    analyze() {
        this.visit(this.ast);
        this.reportErrors();
    }
    visit(node) {
        switch (node.name) {
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
                const varType = this.symbolTable.get(varName);
                if (!varType) {
                    this.reportError(`Undeclared Identifier '${varName}'.`);
                    return "undefined";
                }
                return varType;
            }
            default:
                node.children.forEach((child) => this.visit(child));
                break;
        }
    }
    handleVarDecl(node) {
        const [typeNode, idNode] = node.children;
        const varType = typeNode.name;
        const varName = idNode.value ?? idNode.name;
        if (this.symbolTable.has(varName)) {
            this.reportError(`Variable '${varName}' already declared.`);
        }
        else {
            this.symbolTable.set(varName, varType);
        }
    }
    handleAssignment(node) {
        const [idNode, exprNode] = node.children;
        const varName = idNode?.value ?? idNode?.name ?? "???";
        if (!this.symbolTable.has(varName)) {
            this.reportError(`Assignment to undeclared variable '${varName}'.`);
            return;
        }
        if (!exprNode) {
            this.reportError(`Assignment to '${varName}' is missing an expression.`);
            return;
        }
        const expectedType = this.symbolTable.get(varName);
        const actualType = this.visit(exprNode);
        if (actualType && expectedType !== actualType) {
            this.reportError(`Type mismatch: Cannot assign ${actualType} to ${expectedType} variable '${varName}'.`);
        }
    }
    handlePrint(node) {
        const exprType = this.visit(node.children[0]);
        if (!exprType) {
            this.reportError("Print statement has invalid or undeclared expression.");
        }
    }
    reportError(message) {
        logError(message, 0, 0, "SemanticAnalyzer");
        this.errors.push(message);
    }
    reportErrors() {
        if (this.errors.length === 0) {
            logInfo("Semantic Analysis: No Errors", "SemanticAnalyzer");
        }
    }
}
//# sourceMappingURL=semanticAnalyzer.js.map