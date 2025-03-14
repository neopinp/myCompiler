import { Token } from "./token.js";
class CSTNode {
  public name: string;
  public children: CSTNode[];

  constructor(name: string) {
    this.name = name;
    this.children = [];
  }
}
export class CST {
  private root: CSTNode;
  private currentNode: CSTNode;

  constructor() {
    this.root = new CSTNode("Root");
    this.currentNode = this.root;
  }

  public startNonLeafNode(name: string): void {}

  public endNoneLeafNode(): void {}

  public addLeafNode(token: Token): void {}

  public display(): void {
    
  }
}
