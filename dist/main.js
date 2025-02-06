// Import necessary modules
import { runCompiler } from "./gui";
// Ensure DOM is fully loaded before attaching event listeners
document.addEventListener("DOMContentLoaded", () => {
    const runButton = document.getElementById("run-button");
    if (runButton) {
        runButton.addEventListener("click", runCompiler);
    }
});
//# sourceMappingURL=main.js.map