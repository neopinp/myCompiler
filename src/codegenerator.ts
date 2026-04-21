// codegenerator.ts

import { ASTNode } from "./ast.js";
import { logDebug, logInfo, logWarning } from "./utils.js";

interface SymbolInfo {
  name: string;
  type: string;
  line: number;
  column: number;
  scopeLevel: number;
}

export class CodeGenerator {
  private code: string[] = Array(256).fill("00");
  private codePtr = 0;
  private heapPtr: number = 0xff;
  private heapTable: { [stringValue: string]: number } = {};
  private staticTable: Map<string, number> = new Map();
  private staticLocations: Map<string, number[]> = new Map();
  private jumpTable: Map<string, number[]> = new Map();
  private tempVarCounter = 0;
  private jumpCounter = 0;
  private labelCounter: number = 0;
  private labelAddresses: Map<string, number> = new Map();
  private scopeStack: number[] = [];
  private scopeDepth: number = 0;

  constructor(
    private ast: ASTNode,
    private pid: number,
    private symbols: SymbolInfo[]
  ) {}

  enterScope(scopeID: number) {
    this.scopeStack.push(scopeID);
    logDebug(`Entered scope ${scopeID}`, "CodeGen");
  }

  exitScope() {
    const popped = this.scopeStack.pop();
    logDebug(`Exited scope ${popped}`, "CodeGen");
  }

  currentScope(): number {
    return this.scopeStack[this.scopeStack.length - 1];
  }

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
        const newScope = this.scopeStack.length; // new scope ID
        this.enterScope(newScope);
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
    const rawName = node.children[1].value;
    if (!rawName) throw new Error("Expected identifier name but got undefined");

    const scopeLevel = this.currentScope();
    const mangled = `_S${scopeLevel}_T${rawName}`;

    if (!this.staticTable.has(mangled)) {
      const addr = this.getNextStaticAddress();
      this.staticTable.set(mangled, addr);
    }
  }

  private handleAssignment(node: ASTNode) {
    const rawName = node.children[0].value;
    if (!rawName) throw new Error("Expected identifier name but got undefined");
    const resolved = this.lookupMangledVariable(rawName);

    if (!resolved)
      throw new Error(`Variable ${rawName} not found in symbol table`);
    const { mangled } = resolved;
    if (!this.staticTable.has(mangled)) {
      const addr = this.getNextStaticAddress();
      this.staticTable.set(mangled, addr);
    }

    this.visit(node.children[1]);
    this.emit("8D");
    this.emitAddressPlaceholder(mangled);
  }

  private handlePrint(node: ASTNode) {
    logInfo("Handling Print", "CodeGen");
    const child = node.children[0];
    const type = child.name;

    if (type === "Identifier") {
      const rawName = child.value;
      if (rawName === undefined) {
        throw new Error("Expected identifier name but got undefined");
      }

      const resolved = this.lookupMangledVariable(rawName);

      if (!resolved) {
        logWarning(`Variable ${rawName} not declared`, 0, 0, "CodeGen");
        return;
      }
      const { mangled } = resolved;

      this.emit("AC");
      this.emitAddressPlaceholder(mangled);

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
    } else if (type === "StringExpr") {
      const stringValue = node.children[0].value ?? "";
      const strAddr = this.allocateStringInHeap(stringValue);

      const loopLabel = this.makeLabel();
      const endLabel = this.makeLabel();

      // Load start address into X
      this.emit("A2");
      this.emitByte(strAddr);

      this.emitLabel(loopLabel);

      this.emit("BD");
      this.emitAddress(strAddr);

      // Compare to 0
      this.emit("C9");
      this.emitByte(0x00); // CMP #00
      this.emit("F0");
      this.emitJump(endLabel); // BEQ endLabel

      // Print char
      this.emit("A2");
      this.emitByte(0x01);
      this.emit("FF");

      // Increment X
      this.emit("E8");
      this.emit("4C");
      this.emitJump(loopLabel);

      // Label: loop end
      this.emitLabel(endLabel);
    } else {
      logWarning(`Print of unsupported type: ${type}`, 0, 0, "CodeGen");
    }
  }

  private handleIf(node: ASTNode) {
    this.handleBooleanExpr(node.children[0]);
    const jumpLabel = this.makeLabel();

    this.emit("D0");
    this.emitJumpPlaceholder(jumpLabel);

    this.visit(node.children[1]);

    this.labelAddresses.set(jumpLabel, this.codePtr);
  }

  private handleWhile(node: ASTNode) {
    const loopStart = this.codePtr;

    this.handleBooleanExpr(node.children[0]);
    const jumpLabel = this.makeLabel();

    this.emit("D0");
    this.emitJumpPlaceholder(jumpLabel);

    this.visit(node.children[1]);

    const backDistance = 256 - (this.codePtr + 2 - loopStart);
    this.emit("A2");
    this.emit(this.toHex(backDistance));
    this.emit("EC");

    this.labelAddresses.set(jumpLabel, this.codePtr);
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

    // Load left into X
    if (leftChild.name === "Identifier") {
      if (leftChild.value === undefined) {
        throw new Error("Expected identifier name but got undefined");
      }
      const resolvedLeft = this.lookupMangledVariable(leftChild.value);
      if (!resolvedLeft)
        throw new Error(`Variable ${leftChild.value} not found`);
      const { mangled } = resolvedLeft;

      this.emit("AE"); // LDX absolute

      this.emitAddressPlaceholder(mangled);

      console.log(
        `Pushing patch index ${this.codePtr} for ${mangled} inside [FUNCTION NAME]`
      );
    }

    if (rightChild.name === "Identifier") {
      if (rightChild.value === undefined) {
        throw new Error("Expected identifier name but got undefined");
      }
      const resolvedRight = this.lookupMangledVariable(rightChild.value);
      if (!resolvedRight)
        throw new Error(`Variable ${rightChild.value} not found`);
      const { mangled } = resolvedRight;

      this.emit("EC");
      this.emitAddressPlaceholder(mangled);

      console.log(
        `Pushing patch index ${this.codePtr} for ${mangled} inside [FUNCTION NAME]`
      );
    } else if (rightChild.name === "IntExpr") {
      const tempVar = `_TBOOL${this.tempVarCounter++}`;
      this.staticTable.set(tempVar, this.getNextStaticAddress());

      this.emit("A9"); // LDA #immediate
      this.emit(this.toHex(parseInt(rightChild.value || "0")));
      this.emit("8D"); // STA absolute
      this.emitAddressPlaceholder(tempVar);

      this.emit("EC");
      this.emitAddressPlaceholder(tempVar);
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
    const startAddr = this.heapPtr - str.length;

    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      this.code[this.heapPtr] = charCode.toString(16).padStart(2, "0");
      this.heapPtr--;
    }

    this.code[this.heapPtr] = "00";
    this.heapPtr--;

    const addrHex = this.toHex(startAddr);
    this.emit("A2");
    this.emit(addrHex);

    this.emit("FF");
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
      this.emitAddressPlaceholder(varName);
    }
  }

  /* HELPER FUNCTIONS */

  private emit(byte: string): void {
    logDebug(`Emitting byte | [${byte}]`, "CodeGen");
    this.code[this.codePtr++] = byte.toUpperCase().padStart(2, "0");
  }
  private emitByte(value: number) {
    this.emit(value.toString(16).padStart(2, "0").toUpperCase());
  }

  private emitAddress(addr: number) {
    const lowByte = addr & 0xff;
    const highByte = (addr >> 8) & 0xff;
    this.emitByte(lowByte);
    this.emitByte(highByte);
  }

  private makeLabel(): string {
    return `LBL_${this.labelCounter++}`;
  }

  private emitLabel(label: string) {
    this.labelAddresses.set(label, this.codePtr);
  }

  private emitJump(label: string) {
    const index = this.codePtr;
    this.emitByte(0x00); // low byte placeholder
    this.emitByte(0x00); // high byte placeholder

    const indices = this.jumpTable.get(label) || [];
    indices.push(index);
    this.jumpTable.set(label, indices);
  }

  private backpatchJumpTable() {
    for (const [label, indices] of this.jumpTable) {
      const targetAddr = this.labelAddresses.get(label);
      if (targetAddr === undefined) continue;
      const lowByte = this.toHex(targetAddr & 0xff);
      const highByte = this.toHex((targetAddr >> 8) & 0xff);
      for (const index of indices) {
        this.code[index] = lowByte;
        this.code[index + 1] = highByte;
        console.log(
          ` → Jump patched [${label}] at [${index}] with [${lowByte} ${highByte}]`
        );
      }
    }
  }
  private backpatchStaticTable() {
    for (const [mangled, addr] of this.staticTable) {
      const indices = this.staticLocations.get(mangled) || [];

      const lowByte = this.toHex(addr & 0xff);
      const highByte = this.toHex((addr >> 8) & 0xff);

      console.log(
        `Backpatching ${mangled} at indices [${indices}] with addr 0x${lowByte}${highByte}`
      );

      for (const index of indices) {
        this.code[index] = lowByte;
        this.code[index + 1] = highByte;
        console.log(
          ` → Patched [${index}, ${index + 1}] with [${lowByte} ${highByte}]`
        );
      }
    }
  }

  mangleVarName(node: ASTNode): string {
    const sym = this.symbols.find((s) => s.name === node.value);
    if (!sym)
      throw new Error(`Variable ${node.value} not found in symbol table`);

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
    return `${node.value}`;
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

    output.innerText = "";

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
  private allocateStringInHeap(value: string): number {
    if (this.heapTable[value] !== undefined) {
      return this.heapTable[value];
    }

    const requiredSpace = value.length + 1; // +1 for null terminator
    const startAddr = this.heapPtr - requiredSpace + 1;

    if (startAddr <= this.getNextStaticAddress()) {
      throw new Error(
        `Heap memory (${startAddr}) overlapped static memory (${this.getNextStaticAddress()}).`
      );
    }

    for (let i = 0; i < value.length; i++) {
      const charCode = value.charCodeAt(i);
      this.code[this.heapPtr--] = charCode.toString(16).padStart(2, "0");
    }

    this.code[this.heapPtr--] = "00"; // null terminator

    this.heapTable[value] = startAddr;
    return startAddr;
  }

  private lookupMangledVariable(
    rawName: string
  ): { mangled: string; symbol: SymbolInfo } | null {
    // Check from innermost to outermost
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      const scopeLevel = this.scopeStack[i];
      const sym = this.symbols.find(
        (s) => s.name === rawName && s.scopeLevel === scopeLevel
      );
      if (sym) {
        const mangled = `_S${scopeLevel}_T${sym.name}`;
        return { mangled, symbol: sym };
      }
    }
    console.warn(`Warning: Variable ${rawName} not found in scope stack.`);
    return null;
  }

  private emitJumpPlaceholder(label: string): void {
    const index = this.codePtr;
    this.emit("00"); // Placeholder low byte
    this.emit("00"); // Placeholder high byte

    const indices = this.jumpTable.get(label) || [];
    indices.push(index);
    this.jumpTable.set(label, indices);
  }
  private emitAddressPlaceholder(mangled: string) {
    if (!this.staticTable.has(mangled)) {
      const nextStaticAddr = this.getNextStaticAddress();
      this.staticTable.set(mangled, nextStaticAddr);
    }

    if (!this.staticLocations.has(mangled)) {
      this.staticLocations.set(mangled, []);
    }

    const patchList = this.staticLocations.get(mangled)!;
    patchList.push(this.codePtr); // store the index where we’ll patch later

    // Emit two placeholder bytes (low and high)
    this.emit("XX");
    this.emit("XX");

    console.log(
      ` → Storing placeholder for ${mangled} at [${this.codePtr - 2}]`
    );
    logInfo("Static Table Addresses:", "CodeGen");
    for (const [key, addr] of this.staticTable) {
      logInfo(` → ${key} → 0x${addr.toString(16).padStart(2, "0")}`, "CodeGen");
    }
  }

  private getNextStaticAddress(): number {
    let addr = 0x2d;
    const usedAddresses = new Set([...this.staticTable.values()]);

    while (usedAddresses.has(addr)) {
      addr++;
    }

    if (addr >= this.heapPtr) {
      throw new Error(
        `Static memory (${addr}) overlapped heap memory (${this.heapPtr}).`
      );
    }

    return addr;
  }
}
