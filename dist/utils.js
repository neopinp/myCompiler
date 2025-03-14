export function logInfo(message, source = "Lexer") {
    logToScreen("INFO -> ", message, source);
}
export function logDebug(message, source = "Lexer") {
    logToScreen("DEBUG - ", message, source);
}
export function logError(message, line, column, source = "Lexer") {
    const formattedMessage = `${message} | (${line}:${column})`;
    logToScreen("ERROR - ", formattedMessage, source);
    logToErrors("ERROR - ", formattedMessage, source);
}
export function logWarning(message, line, column, source = "Lexer") {
    const formattedMessage = `${message} | (${line}:${column})`;
    logToScreen("WARNING -", formattedMessage, source);
    logToErrors("WARNING -", formattedMessage, source);
}
export function logToScreen(level, message, source = "Lexer") {
    const outputElement = document.getElementById("output");
    if (outputElement) {
        const cssClass = `${level.trim().toLowerCase()} ${source.toLowerCase()}`;
        outputElement.innerHTML += `<span class="${cssClass}">${level} ${source} - ${message}</span><br>`;
    }
}
export function logToErrors(level, message, source = "Lexer") {
    const outputElement = document.getElementById("output2");
    if (outputElement) {
        const baseClass = level.includes("ERROR") ? "error" : "warning";
        const cssClass = `${baseClass} ${source.toLowerCase()}`;
        outputElement.innerHTML += `<span class="${cssClass}">${level} ${source} - ${message}</span><br>`;
    }
}
//# sourceMappingURL=utils.js.map