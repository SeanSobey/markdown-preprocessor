//@ts-check
'use-strict';

/**
 * @return {import("./interfaces").Helper}
 */
module.exports = () => {

	return (config) => {

		/**@type {Array<string>}*/
		const size = (config.size || '').split('x'); // 800x600
		/**@type {string | null}*/
		const width = config.width || size[0] || null; // 800
		/**@type {string | null}*/
		const height = config.height || size[1] || null; // 600
		/**@type {string | null}*/
		const url = config.url || null; // https://search.chow.com/thumbnail/640/0/www.chowstatic.com/assets/2014/12/10836_creamy_tomato_soup_original_3000_2.jpg
		/**@type {string | null}*/
		const link = config.link || null; // https://www.chowhound.com/recipes/creamy-tomato-soup-10836
		/**@type {string}*/
		const alt = config.alt || ''; // Tomato Soup

		const style = [
			// 'max-width:100',
			// width ? `width:${width}` : null,
			// height ? `height:${height}` : null,
			// //'height:auto',
			'display: block',
			'margin-left: auto',
			'margin-right: auto',
			'width: 50%',
		].filter(s => !!s).join(';');
		const img = `<img src="${url}" alt="${alt}" style="${style}">`;
		if (!link) {
			return img;
		}
		return (
`<a href="${link}">
    ${img}
</a>`);
	}
}