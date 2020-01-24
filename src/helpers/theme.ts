import os from 'os';

import { Helper } from './interfaces';

const lineBreak = os.EOL + '';

export default (): Helper => (): string => {
	const scripts = createScripts();
	const styles = createStyles();
	return [
		...scripts,
		...styles,
	].join(os.EOL);
};

function createScripts(): ReadonlyArray<string> {

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

function createStyles(): ReadonlyArray<string> {

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
