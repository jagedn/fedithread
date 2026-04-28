export const saveAuth = (data: any) => localStorage.setItem('mastodon_auth', JSON.stringify(data));
export const getAuth = () => JSON.parse(localStorage.getItem('mastodon_auth') || 'null');
export const clearAuth = () => localStorage.removeItem('mastodon_auth');