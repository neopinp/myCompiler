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
  OPEN_BLOCK = "OPEN_BLOCK",       // {
  CLOSE_BLOCK = "CLOSE_BLOCK",    // }
  PRINT = "PRINT",              
  WHILE = "WHILE",              
  IF = "IF",                    
  VAR_TYPE = "VAR_TYPE",          // int
  BOOLEAN_LITERAL = "BOOLEAN_LITERAL", // true | false
  IDENTIFIER = "IDENTIFIER",      // a-z 
  DIGIT = "DIGIT",                // 0-9
  CHAR_LIST = "CHAR_LIST",        // char(s) in quotes
  CHAR = "CHAR",              
  ASSIGN_OP = "ASSIGN_OP",        // =
  INT_OP = "INT_OP",              // +
  BOOL_OP = "BOOL_OP",            // == | !=
  LPAREN = "L-PAREN",              // (
  RPAREN = "R-PAREN",              // )
  EOP = "EOP",                    // $ - end of program
  COMMENT = "COMMENT",            
  INVALID = "INVALID"             // unkown token 
}
