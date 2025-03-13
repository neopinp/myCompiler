
export function logInfo(message: string): void {
  logToScreen("INFO ->  ", message);
}

export function logDebug(message: string): void {
  logToScreen("DEBUG -  ", message);
}

export function logError(message: string, line: number, column: number): void {
  const formattedMessage = `${message} | (${line}:${column})`;
  logToScreen("ERROR -  ", formattedMessage);
  logToErrors("ERROR -  ", formattedMessage);
}

export function logWarning(
  message: string,
  line: number,
  column: number
): void {
  const formattedMessage = `${message} | (${line}:${column})`;
  logToScreen("WARNING -", formattedMessage);
  logToErrors("WARNING -", formattedMessage);
}

// SEPARATE WARNINGS AND ERROR MESSAGES
export function logToErrors(level: string, message: string): void {
  const outputElement = document.getElementById("output2") as HTMLElement;
  if (outputElement) {
    const colorClass = level.includes("ERROR") ? "error" : "warning";
    outputElement.innerHTML += `<span class="${colorClass}">${level} Lexer - ${message}</span><br>`;
  }
}

// PROGRAM OUTPUT
export function logToScreen(level: string, message: string): void {
  const outputElement = document.getElementById("output") as HTMLElement;
  if (outputElement) {
    outputElement.innerHTML += `<span class="${level.toLowerCase()}">${level} Lexer - ${message}</span><br>`;
  }
}
