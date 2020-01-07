import os from 'os';

import { Helper } from './interfaces';

export default (removeLinkFileExtension: boolean, homeUrl: string): Helper => (config): string => {

	const addUp: boolean | null = config.up;
	const addBack: boolean | null = config.back;
	const addHome: boolean | null = config.home;

	const footer = [
		'',
		'---',
		'<span id="footer"></span>',
	];
	if (addUp) {
		footer.push(`[<i class="fas fa-arrow-circle-up"></i> Up](../index${removeLinkFileExtension ? '' : '.md'})`);
	}
	if (addBack) {
		footer.push(`[<i class="fas fa-arrow-circle-left"></i> Back](index${removeLinkFileExtension ? '' : '.md'})`);
	}
	if (addHome) {
		footer.push(`[<i class="fas fa-home"></i> Home](${homeUrl}index${removeLinkFileExtension ? '' : '.md'})`);
	}
	footer.push('<a href="#header"><i class="fas fa-asterisk"></i> Top</a>');
	return footer.join(os.EOL);
};
