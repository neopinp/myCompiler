import { AST, ASTNode } from "./ast.js";
export class ASTBuilder {
    ast;
    constructor() {
        this.ast = new AST();
    }
    build(cstRoot) {
        const programNode = new ASTNode("Program");
        this.ast.setRoot(programNode);
        for (const child of cstRoot.children) {
            const result = this.walk(child);
            if (result) {
                programNode.children.push(result);
            }
        }
        return this.ast;
    }
    walk(cstNode) {
        switch (cstNode.name) {
            case "Program": {
                const program = new ASTNode("Program");
                for (const child of cstNode.children) {
                    const result = this.walk(child);
                    if (result)
                        program.children.push(result);
                }
                return program;
            }
            case "Block": {
                const block = new ASTNode("Block");
                for (const child of cstNode.children) {
                    const stmt = this.walk(child);
                    if (stmt)
                        block.children.push(stmt);
                }
                return block;
            }
            case "PrintStatement": {
                const exprCST = cstNode.children.find((child) => child.name === "Expr");
                const exprAST = exprCST ? this.walk(exprCST) : null;
                if (exprAST) {
                    const printNode = new ASTNode("Print");
                    printNode.children.push(exprAST);
                    return printNode;
                }
                return null;
            }
            case "Expr": {
                const child = cstNode.children[0];
                if (child.name.startsWith("[BOOLEAN_LITERAL]")) {
                    return new ASTNode("BooleanExpr");
                }
                if (child.name.startsWith("[DIGIT]")) {
                    return new ASTNode("IntExpr");
                }
                if (child.name.startsWith("[ID]")) {
                    return new ASTNode("Identifier", child.name.split("] ")[1]);
                }
                if (child.name === "StringExpr") {
                    return this.walk(child);
                }
                return null;
            }
            case "StringExpr": {
                let value = "";
                for (const c of cstNode.children) {
                    if (c.name.startsWith("[CHAR]")) {
                        value += c.name.slice(7);
                    }
                }
                return new ASTNode("StringExpr", value);
            }
            case "[BOOLEAN_LITERAL] true":
            case "[BOOLEAN_LITERAL] false":
            case "[ID] a":
            case "[DIGIT] 1":
            case "[DIGIT] 0":
                return new ASTNode(cstNode.name.split("] ")[1]);
            case "VarDecl": {
                const [typeCST, idCST] = cstNode.children;
                const varNode = new ASTNode("VarDecl");
                varNode.children.push(new ASTNode(typeCST.name)); // "int", "string", etc.
                varNode.children.push(new ASTNode("Identifier", idCST.name.split("] ")[1]));
                return varNode;
            }
            case "AssignmentStatement": {
                const [idCST, assignOpCST, exprCST] = cstNode.children;
                const assignNode = new ASTNode("Assignment");
                assignNode.children.push(new ASTNode("Identifier", idCST.name.split("] ")[1]));
                const exprAST = this.walk(exprCST);
                if (exprAST)
                    assignNode.children.push(exprAST);
                return assignNode;
            }
            case "StatementList": {
                const nodes = [];
                for (const child of cstNode.children) {
                    const astNode = this.walk(child);
                    if (astNode)
                        nodes.push(astNode);
                }
                if (nodes.length === 1)
                    return nodes[0];
                if (nodes.length > 1) {
                    const wrapper = new ASTNode("Statements");
                    wrapper.children.push(...nodes);
                    return wrapper;
                }
                return null;
            }
            default:
                return null;
        }
    }
}
//# sourceMappingURL=astBuilder.js.map