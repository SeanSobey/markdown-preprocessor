"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
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
    return [
        `<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.2/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous">${lineBreak}`,
    ];
}
//# sourceMappingURL=theme.js.map