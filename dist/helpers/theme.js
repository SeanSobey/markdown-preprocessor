"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const lineBreak = os_1.default.EOL + '';
exports.default = () => async (config) => {
    const customScript = config.customScriptPath ? await fs_1.default.promises.readFile(path_1.default.resolve(config.customScriptPath), 'utf8') : null;
    const customStyle = config.customStylePath ? await fs_1.default.promises.readFile(path_1.default.resolve(config.customStylePath), 'utf8') : null;
    const scripts = createScripts(customScript);
    const styles = createStyles(customStyle);
    return [
        ...scripts,
        ...styles,
    ].join(os_1.default.EOL);
};
function createScripts(customScript) {
    const scripts = [
        '<script src="https://www.youtube.com/iframe_api"></script>',
        `<script type="text/javascript">
    window.YouTubeIframeAPIReadyCallbacks = [];
    window.YouTubePlayers = {};
    function onYouTubeIframeAPIReady() {
        window.YouTubeIframeAPIReadyCallbacks.forEach((fn) => fn());
    }
</script>`
    ];
    if (customScript) {
        scripts.push(`<script type="text/javascript">
    ${customScript}
</script>`);
    }
    return scripts;
}
function createStyles(customStyle) {
    const styles = [
        `<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.2/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous">${lineBreak}
<style>
    details {
        margin-bottom: 20px;
    }
</style>`,
    ];
    if (customStyle) {
        styles.push(`<style>
    ${customStyle}
</style>`);
    }
    return styles;
}
//# sourceMappingURL=theme.js.map