import { Helper } from './interfaces';

export default (): Helper => (config): string => {

	const size: ReadonlyArray<string> = (config.size || '').split('x'); // 800x600
	const width: string = config.width || size[0] || '100%'; // 800
	const height: string = config.height || size[1] || 'auto'; // 600
	const url: string = config.url; // https://search.chow.com/thumbnail/640/0/www.chowstatic.com/assets/2014/12/10836_creamy_tomato_soup_original_3000_2.jpg
	const link: string | null = config.link || null; // https://www.chowhound.com/recipes/creamy-tomato-soup-10836
	const alt: string = config.alt || ''; // Tomato Soup
	const center: boolean = (config.center || 'true').toLowerCase() === 'true'; // 600

	const styles = [
		`max-width: ${width}`,
		'width: 75%',
		`height: ${height}`,
	];
	if (center) {
		styles.push('display: block', 'margin-left: auto', 'margin-right: auto');
	}
	const style = styles.filter(s => !!s).join(';') + ';';
	const img = `<img src="${url}" alt="${alt}" style="${style}">`;
	if (!link) {
		return img;
	}
	return (
// eslint-disable-next-line @typescript-eslint/indent
`<a href="${link}">
${img}
</a>`);
};
