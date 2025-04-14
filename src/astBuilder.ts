import { CSTNode } from "./cst.js";
import { AST, ASTNode } from "./ast.js";

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
          const result = this.walk(child);
          if (result) {
            if (result.name === "Flat") {
              block.children.push(...result.children);
            } else {
              block.children.push(result);
            }
          }
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

        // If Expr → IntExpr → [DIGIT] 1
        if (
          child.name === "IntExpr" ||
          child.name === "BooleanExpr" ||
          child.name === "StringExpr"
        ) {
          return this.walk(child); 
        }

        if (child.name.startsWith("[DIGIT]")) {
          const value = child.name.split("] ")[1];
          return new ASTNode("IntExpr", value);
        }

        if (child.name.startsWith("[BOOLEAN_LITERAL]")) {
          const value = child.name.split("] ")[1];
          return new ASTNode("BooleanExpr", value);
        }

        if (child.name === "ID") {
          const token = child.children.find((c) => c.name.startsWith("[ID]"));
          const value = token ? token.name.split("] ")[1] : "???";
          return new ASTNode("Identifier", value);
        }

        if (child.name.startsWith("[ID]")) {
          return new ASTNode("Identifier", child.name.split("] ")[1]);
        }

        if (child.name === "StringExpr") {
          return this.walk(child);
        }

        return null;
      }

      case "IntExpr": {
        const digitNode = cstNode.children.find((c) =>
          c.name.startsWith("[DIGIT]")
        );
        if (digitNode) {
          const value = digitNode.name.split("] ")[1];
          return new ASTNode("IntExpr", value);
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

      case "VarDecl": {
        const [typeCST, idCST] = cstNode.children;
        const type = typeCST.name.split("] ")[1];
        const id = idCST.name.split("] ")[1];
        const varNode = new ASTNode("VarDecl");
        varNode.children.push(new ASTNode(type));
        varNode.children.push(new ASTNode("Identifier", id));
        return varNode;
      }

      case "AssignmentStatement": {
        const [idCST, , exprCST] = cstNode.children; // skip ASSIGN_OP
        const id = idCST.name.split("] ")[1];

        const assignNode = new ASTNode("Assignment");
        assignNode.children.push(new ASTNode("Identifier", id));

        const exprAST = this.walk(exprCST); // ❗️This must not return null

        if (exprAST) {
          assignNode.children.push(exprAST);
        } else {
          console.warn("ASTBuilder: exprAST is null in AssignmentStatement");
        }

        return assignNode;
      }

      case "StatementList": {
        const nodes: ASTNode[] = [];
        for (const child of cstNode.children) {
          const astNode = this.walk(child);
          if (astNode) nodes.push(astNode);
        }
        if (nodes.length === 1) return nodes[0];
        if (nodes.length > 1) {
          const flat = new ASTNode("Flat");
          flat.children.push(...nodes);
          return flat;
        }
        return null;
      }

      default:
        return null;
    }
  }
}
