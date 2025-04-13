export class ASTNode {
  name: string;
  children: ASTNode[];

  constructor(name: string) {
    this.name = name;
    this.children = [];
  }
}

export class AST {
  private root: ASTNode | null = null;

  public setRoot(node: ASTNode): void {
    this.root = node;
  }

  public getRoot(): ASTNode | null {
    return this.root;
  }

  public display(): void {
    const outputElement = document.getElementById("output");
    if (!outputElement) return;

    const label = document.createElement("h3");
    label.textContent = "Abstract Syntax Tree (AST)";
    label.style.marginTop = "20px";

    const container = document.createElement("ul");
    container.appendChild(this.generateHTML(this.root!));

    outputElement.appendChild(label);
    outputElement.appendChild(container);
  }

  private generateHTML(node: ASTNode): HTMLElement {
    const li = document.createElement("li");
    li.textContent = node.name;

    if (node.children.length > 0) {
      const ul = document.createElement("ul");
      node.children.forEach((child) => ul.appendChild(this.generateHTML(child)));
      li.appendChild(ul);
    }

    return li;
  }
}
