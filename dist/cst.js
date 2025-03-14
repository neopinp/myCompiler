class CSTNode {
    name;
    children;
    constructor(name) {
        this.name = name;
        this.children = [];
    }
}
export class CST {
    root;
    currentNode;
    constructor() {
        this.root = new CSTNode("Root");
        this.currentNode = this.root;
    }
    startNonLeafNode(name) { }
    endNoneLeafNode() { }
    addLeafNode(token) { }
    display() {
    }
}
//# sourceMappingURL=cst.js.map