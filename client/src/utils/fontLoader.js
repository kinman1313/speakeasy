import WebFont from 'webfontloader';

export const loadFonts = () => {
    WebFont.load({
        google: {
            families: ['Roboto:300,400,500,700', 'Material Icons']
        },
        custom: {
            families: ['Your-Custom-Font'],
            urls: ['/fonts/custom-font.css']
        },
        timeout: 2000
    });
}; 