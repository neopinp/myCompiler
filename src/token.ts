export class Token {
  constructor(
    public type: TokenType,
    public value: string,
    public line: number,
    public column: number
  ) {}

  toString(): string {
    return `[${this.type}] '${this.value}' at (${this.line}:${this.column})`;
  }
}

export enum TokenType {
  OPENBLOCK = "OPEN_BLOCK",       // {
  CLOSE_BLOCK = "CLOSE_BLOCK",    // }
  PRINT = "PRINT",              
  WHILE = "WHILE",              
  IF = "IF",                    
  INT_TYPE = "INT_TYPE",          // int
  STRING_TYPE = "STRING_TYPE",    // string
  BOOLEAN_TYPE = "BOOEAL_TYPE",   // boolean
  BOOLEAN_LITERAL = "BOOLEAN_LITERAL", // true | false
  IDENTIFIER = "IDENTIFIER",      // a-z 
  DIGIT = "DIGIT",                // 0-9
  STRINg = "STRING",              
  ASSIGN_OP = "ASSIGN_OP",        // =
  INT_OP = "INT_OP",              // +
  BOOL_OP = "BOOL_OP",            // == | !=
  LPAREN = "OPAREN",              // (
  RPAREN = "CPAREN",              // )
  EOP = "EOP",                    // $ - end of program
  COMMENT = "COMMENT",            
  INVALID = "INVALID"             // unkown token 
}
