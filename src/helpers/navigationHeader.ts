import os from 'os';

import { Helper } from './interfaces';

const lineBreak = os.EOL + '';

export default (fileName: string, removeLinkFileExtension: boolean, homeUrl: string): Helper => (config): string => {

	const addUp: boolean | null = config.up;
	const addBack: boolean | null = config.back;
	const addHome: boolean | null = config.home;

	const header = [
		'<span id="header"></span>',
		`# ${fileName}${lineBreak}`,
	];
	if (addUp) {
		header.push(`[<i class="fas fa-arrow-circle-up"></i> Up](../index${removeLinkFileExtension ? '' : '.md'})`);
	}
	if (addBack) {
		header.push(`[<i class="fas fa-arrow-circle-left"></i> Back](index${removeLinkFileExtension ? '' : '.md'})`);
	}
	if (addHome) {
		header.push(`[<i class="fas fa-home"></i> Home](${homeUrl}index${removeLinkFileExtension ? '' : '.md'})`);
	}
	header.push('<a href="#footer"><i class="fas fa-asterisk"></i> Bottom</a>');
	// if (addUp || addBack || addHome) {
	header.push('', '---');
	// }
	return header.join(os.EOL);
};
