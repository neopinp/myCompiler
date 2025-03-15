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
        let cssClass = "";
        if (level.includes("DEBUG")) {
            cssClass = "debug"; // Always gray for debug
        }
        else if (level.includes("INFO")) {
            cssClass = `info ${source.toLowerCase()}`; // Color depends on source (Lexer, Parser)
        }
        else if (level.includes("ERROR")) {
            cssClass = "error"; // Optional redundancy, already handled elsewhere
        }
        else if (level.includes("WARNING")) {
            cssClass = "warning"; // Optional redundancy
        }
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