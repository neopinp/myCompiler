import { AST, ASTNode } from "./ast.js";
import { CSTNode } from "./cst.js";

export class ASTBuilder {
  private ast: AST;

  constructor() {
    this.ast = new AST();
  }

  public build(cstRoot: CSTNode): AST {
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

  private walk(cstNode: CSTNode): ASTNode | null {
    switch (cstNode.name) {
      case "Program": {
        const program = new ASTNode("Program");
        for (const child of cstNode.children) {
          const result = this.walk(child);
          if (result) program.children.push(result);
        }
        return program;
      }

      case "Block": {
        const block = new ASTNode("Block");
        for (const child of cstNode.children) {
          const stmt = this.walk(child);
          if (stmt) block.children.push(stmt);
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
        const child = cstNode.children.find((c) =>
          ["BOOLEAN_LITERAL", "ID", "DIGIT", "StringExpr"].some((type) =>
            c.name.includes(type)
          )
        );
        return child ? this.walk(child) : null;
      }

      case "StringExpr": {
        let value = "";
        for (const c of cstNode.children) {
          if (c.name.startsWith("[CHAR]")) {
            value += c.name.slice(7);
          }
        }
        return new ASTNode(`"${value}"`);
      }

      case "[BOOLEAN_LITERAL] true":
      case "[BOOLEAN_LITERAL] false":
      case "[ID] a":
      case "[DIGIT] 1":
      case "[DIGIT] 0":
        return new ASTNode(cstNode.name.split("] ")[1]);

      case "StatementList": {
        const nodes: ASTNode[] = [];
        for (const child of cstNode.children) {
          const astNode = this.walk(child);
          if (astNode) nodes.push(astNode);
        }
        if (nodes.length === 1) return nodes[0];
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
