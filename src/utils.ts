export function logInfo(message: string): void {
  console.log(`INFO: ${message}`);
  logToScreen("INFO", message);
}

export function logDebug(message: string): void {
  console.log(`DEBUG: ${message}`);
  logToScreen("DEBUG", message);
}

export function logError(message: string, line: number, column: number): void {
  const formattedMessage = `(${line}:${column})`;
  console.error(`ERROR - (${line}:${column}): ${message}`);
  logToScreen("ERROR - ", formattedMessage);
}

function logToScreen(level: string, message: string): void {
  const outputElement = document.getElementById("output") as HTMLElement;
  if (outputElement) {
    outputElement.innerHTML += `<span class="${level.toLowerCase()}">${level} Lexer - ${message}</span><br>`;
  }
}
