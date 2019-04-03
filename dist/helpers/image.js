"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => (config) => {
    const size = (config.size || '').split('x'); // 800x600
    const width = config.width || size[0] || '100%'; // 800
    const height = config.height || size[1] || 'auto'; // 600
    const url = config.url; // https://search.chow.com/thumbnail/640/0/www.chowstatic.com/assets/2014/12/10836_creamy_tomato_soup_original_3000_2.jpg
    const link = config.link || null; // https://www.chowhound.com/recipes/creamy-tomato-soup-10836
    const alt = config.alt || ''; // Tomato Soup
    const center = (config.center || 'true').toLowerCase() === 'true'; // 600
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
    return (`<a href="${link}">
${img}
</a>`);
};
//# sourceMappingURL=image.js.map