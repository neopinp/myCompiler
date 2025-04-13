export class ASTNode {
    name;
    children;
    value;
    constructor(name, value) {
        this.name = name;
        this.children = [];
        this.value = value;
    }
}
export class AST {
    root = null;
    setRoot(node) {
        this.root = node;
    }
    getRoot() {
        return this.root;
    }
    display() {
        const outputElement = document.getElementById("output");
        if (!outputElement)
            return;
        const label = document.createElement("h3");
        label.textContent = "Syntax Tree (AST)";
        label.style.marginTop = "20px";
        const container = document.createElement("ul");
        container.appendChild(this.generateHTML(this.root));
        outputElement.appendChild(label);
        outputElement.appendChild(container);
    }
    generateHTML(node) {
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
//# sourceMappingURL=ast.js.map