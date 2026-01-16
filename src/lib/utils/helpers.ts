import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date) {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return formatDate(date);
}

/**
 * Normalizes a string into a URL-friendly slug
 * - Converts to lowercase
 * - Removes special characters: & ? = % # @ ! + / \ , . ' "
 * - Replaces spaces with hyphens
 * - Collapses multiple hyphens into single hyphen
 * - Removes leading/trailing hyphens
 *
 * Example: "Keyword New Pillar article 888" → "keyword-new-pillar-article-888"
 */
export function normalizeSlug(input: string): string {
    if (!input) return '';

    return input
        .toLowerCase()
        .trim()
        .replace(/[&?=%#@!+/\\,.'"`]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
