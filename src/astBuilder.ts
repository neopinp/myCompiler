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
      case "ID": {
        const token = cstNode.children.find((c) => c.name.startsWith("[ID]"));
        if (token) {
          const value = token.name.split("] ")[1];
          return new ASTNode("Identifier", value);
        }
        reportError("ASTBuilder: Missing [ID] token in ID node");
        return new ASTNode("Identifier", "MISSING_ID");
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
      case "IfStatement": {
        const exprCST = cstNode.children.find((c) => c.name === "Expr");
        const blockCST = cstNode.children.find((c) => c.name === "Block");

        const ifNode = new ASTNode("If");

        const condition = exprCST ? this.walk(exprCST) : null;
        const block = blockCST ? this.walk(blockCST) : null;

        if (condition) ifNode.children.push(condition);
        if (block) ifNode.children.push(block);

        return ifNode;
      }

      case "WhileStatement": {
        const exprCST = cstNode.children.find((c) => c.name === "Expr");
        const blockCST = cstNode.children.find((c) => c.name === "Block");

        const condAST = exprCST ? this.walk(exprCST) : null;
        const blockAST = blockCST ? this.walk(blockCST) : null;

        const whileNode = new ASTNode("While", undefined);

        if (condAST) whileNode.children.push(condAST);
        if (blockAST) whileNode.children.push(blockAST);

        return whileNode;
      }
      case "Expr": {
        // Boolean expressions (already handled)
        if (
          cstNode.children.length === 3 &&
          cstNode.children[1].name.startsWith("[BOOL_OP]")
        ) {
          const left = this.walk(cstNode.children[0]);
          const op = cstNode.children[1].name.split("] ")[1];
          const right = this.walk(cstNode.children[2]);

          const boolExpr = new ASTNode("BooleanExpr", op);
          if (left) boolExpr.children.push(left);
          if (right) boolExpr.children.push(right);
          return boolExpr;
        }

        // NEW: Arithmetic expressions (like a + 1)
        if (
          cstNode.children.length === 3 &&
          cstNode.children[1].name.startsWith("[INT_OP]")
        ) {
          const left = this.walk(cstNode.children[0]);
          const op = cstNode.children[1].name.split("] ")[1];
          const right = this.walk(cstNode.children[2]);

          const intExpr = new ASTNode("IntExpr", op);
          if (left) intExpr.children.push(left);
          if (right) intExpr.children.push(right);
          return intExpr;
        }

        // Simple expressions (already handled)
        if (cstNode.children.length === 1) {
          const child = cstNode.children[0];
          return this.walk(child);
        }

        // Default error
        reportError(
          `ASTBuilder: Unrecognized Expr structure (children: ${cstNode.children
            .map((c) => c.name)
            .join(", ")})`
        );
        return null;
      }

      case "[BOOLEAN_LITERAL] true":
      case "[BOOLEAN_LITERAL] false": {
        const value = cstNode.name.split("] ")[1];
        return new ASTNode("BooleanLiteral", value);
      }

      case "IntExpr": {
        const digitNode = cstNode.children.find((c) =>
          c.name.startsWith("[DIGIT]")
        );
        if (digitNode) {
          const value = digitNode.name.split("] ")[1];
          return new ASTNode("IntExpr", value);
        }

        const idNode = cstNode.children.find((c) => c.name.startsWith("[ID]"));
        if (idNode) {
          const value = idNode.name.split("] ")[1];
          return new ASTNode("Identifier", value);
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

        const exprAST = this.walk(exprCST);

        if (exprAST) {
          assignNode.children.push(exprAST);
        } else {
          reportError("ASTBuilder: exprAST is null in AssignmentStatement");
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
