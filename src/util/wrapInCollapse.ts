import os from 'os';

export default (lines: ReadonlyArray<string>, summary: string, cite: string): ReadonlyArray<string> => [
	// eslint-disable-next-line arrow-body-style
`<details>
    <summary>${summary}</summary>
    <blockquote cite="${cite}">
        ${lines.join(os.EOL)}
    </blockquote>
</details>`
];
