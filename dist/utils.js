export function logInfo(message) {
    logToScreen("INFO ->  ", message);
}
export function logDebug(message) {
    logToScreen("DEBUG -  ", message);
}
export function logError(message, line, column) {
    const formattedMessage = `(${message}: ${line}:${column})`;
    logToScreen("ERROR -  ", formattedMessage);
    logToErrors("ERROR -  ", formattedMessage);
}
export function logWarning(message, line, column) {
    const formattedMessage = `(${message}: ${line}:${column})`;
    logToScreen("WARNING -", formattedMessage);
    logToErrors("WARNING -", formattedMessage);
}
// SEPARATE WARNINGS AND ERROR MESSAGES
export function logToErrors(level, message) {
    const outputElement = document.getElementById("output2");
    if (outputElement) {
        outputElement.innerHTML += `${level} Lexer - ${message}\n`;
    }
}
// PROGRAM OUTPUT
export function logToScreen(level, message) {
    const outputElement = document.getElementById("output");
    if (outputElement) {
        outputElement.innerHTML += `<span class="${level.toLowerCase()}">${level} Lexer - ${message}</span><br>`;
    }
}
//# sourceMappingURL=utils.js.map