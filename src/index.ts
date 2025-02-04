import * as fs from "fs"; 
import { Lexer } from "./lexer"; 

const input = fs.readFileSync("input.txt", "utf-8"); // Read the source code from a file
const lexer = new Lexer(input); 
const tokens = lexer.tokenize(); 

console.log("Tokens:", tokens);