// codegenerator.ts

import { ASTNode } from "./ast.js";
import { logDebug, logInfo, logWarning } from "./utils.js";

export class CodeGenerator {
  private code: string[] = Array(256).fill("00");
  private codePtr = 0;
  private heapPtr = 0;

  private staticTable: Map<string, number> = new Map();
  private staticLocations: Map<string, number[]> = new Map();
  private jumpTable: Map<string, number> = new Map();
  private tempVarCounter = 0;
  private jumpCounter = 0;

  constructor(private ast: ASTNode, private pid: number) {}

  public generate(): void {
    logInfo(`generate() | PID [${this.pid}]`, "CodeGen");

    if (!this.ast) {
      logWarning(
        `CodeGenerator: AST is null for Program ${this.pid}`,
        0,
        0,
        "CodeGen"
      );
      return;
    }

    logInfo(`Starting Code Generation | PID [${this.pid}] `, "CodeGen");
    this.visit(this.ast);
    this.emit("00");
    logInfo("Starting Backpatching...", "CodeGen");
    this.backpatchStaticTable();
    this.backpatchJumpTable();
    this.display();
  }

  private visit(node: ASTNode): void {
    logDebug(`Visiting node | [${node.name}] ${node.value ?? ""}`, "CodeGen");

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
      case "While":
        this.handleWhile(node);
        break;
      case "BooleanExpr":
        this.handleBooleanExpr(node);
        break;
      case "IntExpr":
        if (node.children.length === 3 && node.children[1].value === "+") {
          this.handleIntAddition(node);
        } else {
          this.emit("A9");
          this.emit(this.toHex(parseInt(node.value || "0")));
        }
        break;
      case "StringExpr":
        this.handleStringExpr(node);
        break;

      default:
        node.children.forEach((child) => this.visit(child));
    }
  }

  private handleVarDecl(node: ASTNode) {
    logInfo("Handling VarDecl", "CodeGen");
    const varName = this.mangleVarName(node.children[1]);
    const addr = this.getNextStaticAddress();
    this.staticTable.set(varName, addr);

    this.emit("A9"); // LDA #00
    this.emit("00");
    this.emit("8D"); // STA
    this.emit("XX");
    this.emit("XX");

    if (!this.staticLocations.has(varName)) {
      this.staticLocations.set(varName, []);
    }
    this.staticLocations.get(varName)!.push(this.codePtr - 2);
  }

  private handleAssignment(node: ASTNode) {
    logInfo("Handling Assignment", "CodeGen");

    const targetVarNode = node.children[0];
    const expr = node.children[1];
    const varName = this.mangleVarName(targetVarNode);

    this.visit(expr);

    this.emit("8D"); // STA
    this.emit("XX");
    this.emit("XX");

    if (!this.staticLocations.has(varName)) {
      this.staticLocations.set(varName, []);
    }
    this.staticLocations.get(varName)!.push(this.codePtr - 2);
  }

  private handlePrint(node: ASTNode) {
    logInfo("Handling Print", "CodeGen");
    const child = node.children[0];
    const type = child.name;

    if (type === "Identifier") {
      const varName = this.mangleVarName(child);
      this.emit("AC");
      this.emit("XX");
      this.emit("XX");

      if (!this.staticLocations.has(varName)) {
        this.staticLocations.set(varName, []);
      }
      this.staticLocations.get(varName)!.push(this.codePtr - 2);

      this.emit("A2");
      this.emit("01");
      this.emit("FF");
    } else if (type === "BooleanExpr") {
      this.handleBooleanExpr(child);
      this.emit("A2");
      this.emit("01");
      this.emit("FF");
    } else if (type === "BooleanLiteral") {
      this.emit("A9");
      this.emit(child.value === "true" ? "01" : "00");
      this.emit("A2"); 
      this.emit("01");
      this.emit("FF"); 
    } else {
      logWarning(`Print of unsupported type: ${type}`, 0, 0, "CodeGen");
    }
  }

  private handleIf(node: ASTNode) {
    logInfo("Handling If Statement", "CodeGen");
    const condExpr = node.children[0];
    const block = node.children[1];

    this.handleBooleanExpr(condExpr);

    this.emit("D0");
    const jumpTemp = `J${this.jumpCounter++}`;
    this.emit(jumpTemp);

    const jumpStart = this.codePtr;
    this.visit(block);
    const jumpEnd = this.codePtr;
    const distance = jumpEnd - jumpStart;
    this.jumpTable.set(jumpTemp, distance);
  }

  private handleWhile(node: ASTNode) {
    logInfo(`Handling While`, "CodeGen");

    const loopStart = this.codePtr;

    const condExpr = node.children[0];
    const block = node.children[1];

    this.handleBooleanExpr(condExpr);

    // BNE jump if condition is False
    this.emit("D0");
    const jumpTemp = `J${this.jumpCounter++}`;
    this.emit(jumpTemp);

    const jumpStart = this.codePtr;
    this.visit(block);

    // jump back to start of loop
    this.emit("A2");
    const backwardDistance = 256 - (this.codePtr + 2 - loopStart);
    this.emit(this.toHex(backwardDistance));
    this.emit("EC");

    const jumpEnd = this.codePtr;
    const distance = jumpEnd - jumpStart;
    this.jumpTable.set(jumpTemp, distance);
  }

  private handleBooleanExpr(node: ASTNode): void {
    logInfo(`Handling BooleanExpr [${node.value}]`, "CodeGen");

    const op = node.value; // '==' or '!='
    const leftChild = node.children[0];
    const rightChild = node.children[1];

    if (!leftChild || !rightChild) {
      logWarning("BooleanExpr missing operands", 0, 0, "CodeGen");
      return;
    }

    // Load left into X (if identifier)
    if (leftChild.name === "Identifier") {
      const leftVar = this.mangleVarName(leftChild);
      this.emit("AE"); // LDX absolute
      this.emit("XX");
      this.emit("XX");
      if (!this.staticLocations.has(leftVar)) {
        this.staticLocations.set(leftVar, []);
      }
      this.staticLocations.get(leftVar)!.push(this.codePtr - 2);
    } else if (leftChild.name === "IntExpr") {
      this.emit("A2"); // LDX #immediate
      this.emit(this.toHex(parseInt(leftChild.value || "0")));
    }

    if (rightChild.name === "Identifier") {
      const rightVar = this.mangleVarName(rightChild);
      this.emit("EC"); // CPX absolute
      this.emit("XX");
      this.emit("XX");
      if (!this.staticLocations.has(rightVar)) {
        this.staticLocations.set(rightVar, []);
      }
      this.staticLocations.get(rightVar)!.push(this.codePtr - 2);
    } else if (rightChild.name === "IntExpr") {
      const tempVar = `_TBOOL${this.tempVarCounter++}`;
      this.staticTable.set(tempVar, this.getNextStaticAddress());

      this.emit("A9"); // LDA #immediate
      this.emit(this.toHex(parseInt(rightChild.value || "0")));
      this.emit("8D"); // STA absolute
      this.emit("XX");
      this.emit("XX");
      if (!this.staticLocations.has(tempVar)) {
        this.staticLocations.set(tempVar, []);
      }
      this.staticLocations.get(tempVar)!.push(this.codePtr - 2);

      this.emit("EC"); // CPX absolute
      this.emit("XX");
      this.emit("XX");
      if (!this.staticLocations.has(tempVar)) {
        this.staticLocations.set(tempVar, []);
      }
      this.staticLocations.get(tempVar)!.push(this.codePtr - 2);
    }

    if (op === "==") {
      this.emit("D0"); // BNE
    } else if (op === "!=") {
      this.emit("F0"); // BEQ
    } else {
      logWarning(`Unsupported boolean operator: ${op}`, 0, 0, "CodeGen");
    }
  }

  private handleStringExpr(node: ASTNode): void {
    logInfo("Handling StringExpr", "CodeGen");

    const str = node.value || "";
    let heapAddress = 255 - this.heapPtr;

    for (let i = str.length - 1; i >= 0; i--) {
      this.code[heapAddress--] = str
        .charCodeAt(i)
        .toString(16)
        .padStart(2, "0");
      this.heapPtr++;
    }
    this.code[heapAddress--] = "00";

    this.heapPtr++;

    const addrHex = this.toHex(heapAddress + 1);
    this.emit("A2"); // Load X-register with string start
    this.emit(addrHex);

    this.emit("FF"); // Sys call: print string
  }
  private handleIntAddition(node: ASTNode): void {
    const left = node.children[0];
    const right = node.children[1];

    this.visit(left); // load left into accumulator

    if (right.name === "IntExpr") {
      this.emit("69"); // ADC #immediate
      this.emit(this.toHex(parseInt(right.value || "0")));
    } else if (right.name === "Identifier") {
      const varName = this.mangleVarName(right);
      this.emit("6D"); // ADC var address
      this.emit("XX");
      this.emit("XX");

      if (!this.staticLocations.has(varName)) {
        this.staticLocations.set(varName, []);
      }
      this.staticLocations.get(varName)!.push(this.codePtr - 2);
    }
  }

  /* HELPER FUNCTIONS */

  private emit(byte: string): void {
    logDebug(`Emitting byte | [${byte}]`, "CodeGen");
    this.code[this.codePtr++] = byte.toUpperCase().padStart(2, "0");
  }

  private backpatchJumpTable() {
    logInfo("Backpatching Jump Table...", "CodeGen");
    for (const [label, dist] of this.jumpTable) {
      const hex = this.toHex(dist);
      for (let i = 0; i < this.code.length; i++) {
        if (this.code[i] === label) {
          this.code[i] = hex;
        }
      }
    }
  }
  private backpatchStaticTable() {
    logInfo("Backpatching Static Table...", "CodeGen");
    for (const [varName, addr] of this.staticTable) {
      const patchIndices = this.staticLocations.get(varName);
      if (patchIndices) {
        for (const index of patchIndices) {
          this.code[index] = this.toHex(addr);
          this.code[index + 1] = "00";
        }
      }
    }
  }

  private getNextStaticAddress(): number {
    return 0x2d + this.staticTable.size;
  }
  mangleVarName(node: ASTNode): string {
    if (!node) {
      throw new Error("mangleVarName received undefined node!");
    }
    if (node.name !== "Identifier") {
      throw new Error(`mangleVarName expected Identifier, got ${node.name}`);
    }
    if (typeof node.value !== "string") {
      throw new Error(
        `mangleVarName: node.value is not string (got ${node.value})`
      );
    }
    return `_T${node.value}`;
  }

  private toHex(n: number): string {
    return n.toString(16).padStart(2, "0").toUpperCase();
  }
  private display(): void {
    const output = document.getElementById("codeOutput");
    if (!output) {
      logWarning("codeOutput div not found", 0, 0, "CodeGen");
      return;
    }

    output.innerText === "";

    logInfo(`Displaying code for PID: ${this.pid}`, "CodeGen");
    logInfo(`Program ${this.pid} Complete\n`, "CodeGen");

    const section = document.createElement("div");
    section.style.marginTop = "1rem";

    const label = document.createElement("h4");
    label.textContent = `PID[${this.pid}]`;
    section.appendChild(label);

    const pre = document.createElement("pre");
    pre.textContent = this.code.slice(0, this.codePtr).join(" ");
    section.appendChild(pre);

    output.appendChild(section);
  }
}
