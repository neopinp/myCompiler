// sa.ts
import { logInfo } from "./utils";
class SemanticAnalyzer {
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
    // TYPE SCOPE CHECKING
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
            case "Identifier":
                const varName = node.name;
                const varType = this.symbolTable.get(varName);
                if (!varType) {
                    this.errors.push(`Undeclared Identifier '${varName}'.`);
                    return varType ?? "undefined";
                }
            default:
                node.children.forEach((child) => this.visit(child));
                break;
        }
    }
    handleVarDecl(node) {
        const [typeNode, idNode] = node.children;
        const varType = typeNode.name;
        const varName = idNode.name;
        if (this.symbolTable.has(varName)) {
            this.errors.push(`Variable '${varName}' already declared`);
        }
        else {
            this.symbolTable.set(varName, varType);
        }
    }
    handleAssignment(node) {
        const [idNode, exprNode] = node.children;
        const varName = idNode.name;
        if (!this.symbolTable.has(varName)) {
            this.errors.push(`Assignment to undeclared variable '${varName}`);
        }
        const expectedType = this.symbolTable.get(varName);
        const actualType = this.visit(exprNode);
        if (actualType && expectedType !== actualType) {
            this.errors.push(`Type mismatch: Canot assign ${actualType} to ${expectedType}`);
        }
    }
    handlePrint(node) {
        const exprType = this.visit(node.children[0]);
        if (exprType) {
            this.errors.push("Print statement has invalid or undeclared expression");
        }
    }
    reportErrors() {
        if (this.errors.length > 0) {
            this.errors.forEach((err) => reportError(`Semantic Error: ${err}`));
        }
        else {
            logInfo(`Semantic Anaylsis: No Errors`, "Parser");
        }
    }
}
//# sourceMappingURL=sa.js.map