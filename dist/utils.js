export function logInfo(message) {
    console.log(`INFO: ${message}`);
    logToScreen("INFO -> ", message);
}
export function logDebug(message) {
    console.log(`DEBUG: ${message}`);
    logToScreen("DEBUG -", message);
}
export function logError(message, line, column) {
    const formattedMessage = `(${line}:${column}): ${message}`;
    console.error(`ERROR - (${line}:${column}): ${message}`);
    logToScreen("ERROR -", formattedMessage);
}
export function logToScreen(level, message) {
    const outputElement = document.getElementById("output");
    if (outputElement) {
        outputElement.innerHTML += `<span class="${level.toLowerCase()}">${level} Lexer - ${message}</span><br>`;
    }
}
//# sourceMappingURL=utils.js.map