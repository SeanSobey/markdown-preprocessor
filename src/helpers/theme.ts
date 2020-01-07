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
	];
}

function createStyles(): ReadonlyArray<string> {

	return [
		`<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.2/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous">${lineBreak}`,
	];
}
