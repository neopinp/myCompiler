import { ASTNode } from "./ast.js";
import { logDebug, logWarning } from "./utils.js";

export class CodeGenerator {
  private code: string[] = Array(256).fill("00");
  private codePtr = 0;
  private heapPtr = 0;

  private staticTable: Map<string, number> = new Map();
  private jumpTable: Map<string, number> = new Map();
  private tempVarCounter = 0;
  private jumpCounter = 0;

  constructor(private ast: ASTNode, private pid: number) {}

  public generate(): void {
    logDebug(`generate() called for Program ${this.pid}`, "CodeGen");

    if (!this.ast) {
      logWarning(
        `CodeGenerator: AST is null for Program ${this.pid}`,
        0,
        0,
        "CodeGen"
      );
      return;
    }

    logDebug(`Starting Code Generation for Program ${this.pid}`, "CodeGen");
    this.visit(this.ast);
    this.emit("00");
    logDebug("Starting Backpatching...", "CodeGen");
    this.backpatchStaticTable();
    this.backpatchJumpTable();
    this.display();
  }

  private visit(node: ASTNode): void {
    logDebug(`Visiting node: ${node.name} ${node.value ?? ""}`, "CodeGen");

    switch (node.name) {
      case "Program":
      case "Block":
        node.children.forEach((child) => this.visit(child));
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

      case "If":
        this.handleIf(node);
        break;

      case "BooleanExpr":
        this.handleBooleanExpr(node);
        break;
      case "IntExpr":
        this.emit("A9");
        this.emit(this.toHex(parseInt(node.value || "0")));
        break;

      default:
        node.children.forEach((child) => this.visit(child));
    }
  }

  private emit(byte: string): void {
    logDebug(`Emitting byte: ${byte}`, "CodeGen");
    this.code[this.codePtr++] = byte.toUpperCase().padStart(2, "0");
  }

  private handleVarDecl(node: ASTNode) {
    logDebug("Handling VarDecl", "CodeGen");
    const varName = this.mangleVarName(node.children[1]);
    const addr = this.getNextStaticAddress();
    this.staticTable.set(varName, addr);

    this.emit("A9"); // LDA #00
    this.emit("00");
    this.emit("8D"); // STA
    this.emit("XX");
    this.emit("XX");
  }

  private handleAssignment(node: ASTNode) {
    logDebug("Handling Assignment", "CodeGen");
    const target = this.mangleVarName(node.children[0]);
    const expr = node.children[1];

    this.visit(expr);
    this.emit("8D");
    this.emit("XX");
    this.emit("XX");
  }

  private handlePrint(node: ASTNode) {
    logDebug("Handling Print", "CodeGen");
    const child = node.children[0];
    const type = child.name;

    if (type === "Identifier") {
      const varName = this.mangleVarName(child);
      this.emit("AC");
      this.emit("XX");
      this.emit("XX");
      this.emit("A2");
      this.emit("01");
      this.emit("FF");
    } else if (type === "BooleanExpr") {
      this.handleBooleanExpr(child);
      this.emit("A2");
      this.emit("01");
      this.emit("FF");
    } else {
      logWarning(`Print of unsupported type: ${type}`, 0, 0, "CodeGen");
    }
  }

  private handleIf(node: ASTNode) {
    logDebug("Handling If Statement", "CodeGen");
    const condExpr = node.children[0];
    const block = node.children[1];

    this.generateBooleanCompare(condExpr);

    this.emit("D0");
    const jumpTemp = `J${this.jumpCounter++}`;
    this.emit(jumpTemp);

    const jumpStart = this.codePtr;
    this.visit(block);
    const jumpEnd = this.codePtr;
    const distance = jumpEnd - jumpStart;
    this.jumpTable.set(jumpTemp, distance);
  }

  private handleBooleanExpr(node: ASTNode): void {
    logDebug(`Handling BooleanExpr: ${node.value}`, "CodeGen");
    if (node.value === "true") {
      this.emit("A9");
      this.emit("01");
    } else if (node.value === "false") {
      this.emit("A9");
      this.emit("00");
    } else {
      logWarning(`Unknown BooleanExpr: ${node}`, 0, 0, "CodeGen");
    }
  }

  private display(): void {
    const output = document.getElementById("codeOutput");
    if (!output) {
      logWarning("codeOutput div not found", 0, 0, "CodeGen");
      return;
    }

    logDebug(`Displaying code for Program ${this.pid}`, "CodeGen");

    const section = document.createElement("div");
    section.style.marginTop = "1rem";

    const label = document.createElement("h4");
    label.textContent = `Program ${this.pid} Machine Code:`;
    section.appendChild(label);

    const pre = document.createElement("pre");
    pre.textContent = this.code.slice(0, this.codePtr).join(" ");
    section.appendChild(pre);

    output.appendChild(section);
  }

  private backpatchStaticTable() {
    logDebug("Backpatching Static Table...", "CodeGen");
    for (const [varName, addr] of this.staticTable) {
      const hexLow = this.toHex(addr);
      const hexHigh = "00";
      for (let i = 0; i < this.code.length - 1; i++) {
        if (this.code[i] === "XX" && this.code[i + 1] === "XX") {
          this.code[i] = hexLow;
          this.code[i + 1] = hexHigh;
          break;
        }
      }
    }
  }

  private backpatchJumpTable() {
    logDebug("Backpatching Jump Table...", "CodeGen");
    for (const [label, dist] of this.jumpTable) {
      const hex = this.toHex(dist);
      for (let i = 0; i < this.code.length; i++) {
        if (this.code[i] === label) {
          this.code[i] = hex;
          break;
        }
      }
    }
  }

  private generateBooleanCompare(node: ASTNode): void {
    logDebug("Generating boolean comparison...", "CodeGen");
    const left = this.mangleVarName(node.children[0]);
    const right = this.mangleVarName(node.children[1]);

    this.emit("AE");
    this.emit("XX");
    this.emit("XX");
    this.emit("EC");
    this.emit("XX");
    this.emit("XX");
  }

  private getNextStaticAddress(): number {
    return 0x2d + this.staticTable.size;
  }

  private mangleVarName(node: ASTNode): string {
    return `${node.value ?? node.name}@0`;
  }

  private toHex(n: number): string {
    return n.toString(16).padStart(2, "0").toUpperCase();
  }
}
