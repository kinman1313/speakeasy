import WebFont from 'webfontloader';

export const loadFonts = () => {
    WebFont.load({
        google: {
            families: [
                'Roboto:300,400,500,700',
                'Material Icons',
                'Inter:300,400,500,600,700'
            ]
        },
        timeout: 2000,
        active: () => {
            document.documentElement.style.visibility = 'visible';
        },
        inactive: () => {
            document.documentElement.style.visibility = 'visible';
        },
        loading: () => {
            document.documentElement.style.visibility = 'hidden';
        }
    });
}; 