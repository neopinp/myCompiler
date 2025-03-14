
export function logInfo(message: string, source: string = "Lexer"): void {
  logToScreen("INFO -> ", message, source);
}

export function logDebug(message: string, source: string = "Lexer"): void {
  logToScreen("DEBUG - ", message, source);
}

export function logError(
  message: string,
  line: number,
  column: number,
  source: string = "Lexer"
): void {
  const formattedMessage = `${message} | (${line}:${column})`;
  logToScreen("ERROR - ", formattedMessage, source);
  logToErrors("ERROR - ", formattedMessage, source);
}

export function logWarning(
  message: string,
  line: number,
  column: number,
  source: string = "Lexer"
): void {
  const formattedMessage = `${message} | (${line}:${column})`;
  logToScreen("WARNING -", formattedMessage, source);
  logToErrors("WARNING -", formattedMessage, source);
}



export function logToScreen(
  level: string,
  message: string,
  source: string = "Lexer"
): void {
  const outputElement = document.getElementById("output") as HTMLElement;
  if (outputElement) {
    const cssClass = `${level.trim().toLowerCase()} ${source.toLowerCase()}`;
    outputElement.innerHTML += `<span class="${cssClass}">${level} ${source} - ${message}</span><br>`;
  }
}

export function logToErrors(
  level: string,
  message: string,
  source: string = "Lexer"
): void {
  const outputElement = document.getElementById("output2") as HTMLElement;
  if (outputElement) {
    const baseClass = level.includes("ERROR") ? "error" : "warning";
    const cssClass = `${baseClass} ${source.toLowerCase()}`;
    outputElement.innerHTML += `<span class="${cssClass}">${level} ${source} - ${message}</span><br>`;
  }
}


