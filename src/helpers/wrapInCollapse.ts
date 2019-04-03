import os from 'os';

export default (lines: ReadonlyArray<string>, summary: string, cite: string): ReadonlyArray<string> => {
	return [
`<details>
    <summary>${summary}</summary>
    <blockquote cite="${cite}" style="padding-top:2px;padding-bottom:2px;">
        ${lines.join(os.EOL)}
    </blockquote>
</details>`
	];
};
