export function logInfo(message: string): void {
  console.log(`INFO: ${message}`);
}

export function logDebug(message: string): void {
  console.log(`DEBGUG: ${message}`);
}

export function logError(message: string, line: number, column: number): void {
  console.error(`ERROR (${line}:${column}): ${message}`);
}
