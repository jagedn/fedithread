export interface Attachment {
    id: string;
    previewUrl: string;
    status: 'uploading' | 'success' | 'error';
}

export interface Toot {
    id: string; // ID local para manejo de la lista
    content: string;
    attachments: Attachment[];
    inReplyToId?: string; // Para la API de Mastodon
}

export interface Account {
    username: string;
    display_name: string;
    avatar: string;
    url: string;
}

export interface AuthData {
    instance: string;
    token: string;
}