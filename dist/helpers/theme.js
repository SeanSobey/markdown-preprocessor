"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const lineBreak = os_1.default.EOL + '';
exports.default = () => () => {
    const scripts = createScripts();
    const styles = createStyles();
    return [
        ...scripts,
        ...styles,
    ].join(os_1.default.EOL);
};
function createScripts() {
    return [
        '<script src="https://www.youtube.com/iframe_api"></script>',
        `<script type="text/javascript">
    window.YouTubeIframeAPIReadyCallbacks = [];
    window.YouTubePlayers = {};
    function onYouTubeIframeAPIReady() {
        window.YouTubeIframeAPIReadyCallbacks.forEach((fn) => fn());
    }
</script>`
    ];
}
function createStyles() {
    // TODO: these styles are site specific!
    return [
        `<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.2/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous">${lineBreak}
<style>
    details {
        margin-bottom: 20px;
    }
</style>`,
    ];
}
//# sourceMappingURL=theme.js.map