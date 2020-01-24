import os from 'os';
import fs from 'fs';
import path from 'path';

import { Helper } from './interfaces';

const lineBreak = os.EOL + '';

export default (): Helper => async (config): Promise<string> => {
	const customScript = config.customScriptPath ? await fs.promises.readFile(path.resolve(config.customScriptPath), 'utf8') : null;
	const customStyle = config.customStylePath ? await fs.promises.readFile(path.resolve(config.customStylePath), 'utf8') : null;
	const scripts = createScripts(customScript);
	const styles = createStyles(customStyle);
	return [
		...scripts,
		...styles,
	].join(os.EOL);
};

function createScripts(customScript: string | null): ReadonlyArray<string> {
	const scripts = [
		'<script src="https://www.youtube.com/iframe_api"></script>',
`<script type="text/javascript">
    window.YouTubeIframeAPIReadyCallbacks = [];
    window.YouTubePlayers = {};
    function onYouTubeIframeAPIReady() {
        window.YouTubeIframeAPIReadyCallbacks.forEach((fn) => fn());
    }
</script>`];
	if (customScript) {
		scripts.push(`<script type="text/javascript">
    ${customScript}
</script>`);
	}
	return scripts;
}

function createStyles(customStyle: string | null): ReadonlyArray<string> {
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
