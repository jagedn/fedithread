export const calculateMastodonLength = (text: string): number => {
    // Regex sencilla para detectar URLs (http/https)
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];

    // 1. Quitamos las URLs del texto original para contar el resto
    let lengthWithoutUrls = text.replace(urlRegex, '').length;

    // 2. Cada URL en Mastodon suma exactamente 23 caracteres
    const totalUrlsLength = urls.length * 23;

    return lengthWithoutUrls + totalUrlsLength;
};