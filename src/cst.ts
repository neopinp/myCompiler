import { Token } from "./token.js";
import { logWarning } from "./utils.js";

export class CSTNode {
  public name: string;
  public children: CSTNode[];
  public parent: CSTNode | null;

  constructor(name: string, parent: CSTNode | null = null) {
    this.name = name;
    this.children = [];
    this.parent = parent;
  }
}

export class CST {
  private root: CSTNode;
  private currentNode: CSTNode;

  constructor() {
    this.root = new CSTNode("Program");
    this.currentNode = this.root;
  }

  public startNonLeafNode(name: string): void {
    const newNode = new CSTNode(name, this.currentNode);
    this.currentNode.children.push(newNode);
    this.currentNode = newNode;
  }

  public endNonLeafNode(): void {
    if (this.currentNode.parent) {
      this.currentNode = this.currentNode.parent;
    } else {
      logWarning("Attempted to end root note, ignoring...", 0, 0, "Parser");
    }
  }

  public addLeafNode(token: Token): void {
    const leafName = `[${token.type}] ${token.value}`;
    const leafNode = new CSTNode(leafName, this.currentNode);
    this.currentNode.children.push(leafNode);
  }

  public display(): void {
    const outputElement = document.getElementById("output");
    if (!outputElement) {
      console.error("CST output element not found!");
      return;
    }
  
    const treeHTML = this.generateHTML(this.root);
  
    const cstTitle = document.createElement("h3");
    cstTitle.textContent = "Concrete Syntax Tree (CST)";
    outputElement.appendChild(cstTitle);
    outputElement.appendChild(treeHTML);
  

  }
  
  private generateHTML(node: CSTNode): HTMLElement {
    const li = document.createElement("li");
    li.textContent = node.name;

    if (node.children.length > 0) {
      const ul = document.createElement("ul");
      for (const child of node.children) {
        ul.appendChild(this.generateHTML(child));
      }
      li.appendChild(ul);
    }

    return li;
  }
  public getRoot(): CSTNode {
    return this.root;
  }
}
