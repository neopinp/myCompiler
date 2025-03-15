import { logWarning } from "./utils.js";
class CSTNode {
    name;
    children;
    parent;
    constructor(name, parent = null) {
        this.name = name;
        this.children = [];
        this.parent = parent;
    }
}
export class CST {
    root;
    currentNode;
    constructor() {
        this.root = new CSTNode("Program");
        this.currentNode = this.root;
    }
    startNonLeafNode(name) {
        const newNode = new CSTNode(name, this.currentNode);
        this.currentNode.children.push(newNode);
        this.currentNode = newNode;
    }
    endNonLeafNode() {
        if (this.currentNode.parent) {
            this.currentNode = this.currentNode.parent;
        }
        else {
            logWarning("Attempted to end root note, ignoring...", 0, 0, "Parser");
        }
    }
    addLeafNode(token) {
        const leafName = `[${token.type}] ${token.value}`;
        const leafNode = new CSTNode(leafName, this.currentNode);
        this.currentNode.children.push(leafNode);
    }
    display() {
        const outputElement = document.getElementById("output");
        if (!outputElement) {
            console.error("CST output element not found!");
            return;
        }
        const treeHTML = this.generateHTML(this.root);
        outputElement.appendChild(treeHTML);
    }
    generateHTML(node) {
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
}
//# sourceMappingURL=cst.js.map