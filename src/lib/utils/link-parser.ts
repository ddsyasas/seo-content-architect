/**
 * Parse HTML content and extract all links
 * Returns array of { href, anchorText } objects
 */
export function parseLinksFromHtml(html: string): { href: string; anchorText: string }[] {
    if (!html) return [];

    // Use DOMParser if available (client-side)
    if (typeof window !== 'undefined' && window.DOMParser) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const anchors = doc.querySelectorAll('a');

            return Array.from(anchors).map(a => ({
                href: a.getAttribute('href') || '',
                anchorText: a.textContent || '' // Use textContent to get plain text inside
            })).filter(link => link.href && link.anchorText.trim());
        } catch (e) {
            console.error('DOMParser error:', e);
        }
    }

    // Fallback regex (improved to allow content tags) for server-side or if DOMParser fails
    const links: { href: string; anchorText: string }[] = [];
    // Match href and capture content until closing </a>
    // [\s\S]*? matches any character including newlines (non-greedy)
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
        const href = match[1];
        // Remove HTML tags from anchor text for potential label use
        const anchorHtml = match[2];
        const anchorText = anchorHtml.replace(/<[^>]+>/g, '').trim();

        if (href && anchorText) {
            links.push({ href, anchorText });
        }
    }

    return links;
}

/**
 * Check if a URL is an internal link for the given domain
 * Returns the matching slug if internal, null otherwise
 */
export function isInternalLink(url: string, domain: string): string | null {
    if (!url || !domain) return null;

    // Normalize domain (remove protocol, www, trailing slash)
    const normalizedDomain = domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
        .toLowerCase();

    // Normalize URL for comparison
    let normalizedUrl = url.toLowerCase();

    try {
        // Handle absolute URLs with protocol
        if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) {
            const urlObj = new URL(normalizedUrl);
            const urlDomain = urlObj.hostname.replace(/^www\./, '').toLowerCase();

            // Check if domain matches
            if (urlDomain === normalizedDomain) {
                // Return the path as slug (without leading/trailing slash)
                return urlObj.pathname.replace(/^\//, '').replace(/\/$/, '');
            }
        }

        // Handle relative URLs (starting with /)
        if (normalizedUrl.startsWith('/')) {
            return normalizedUrl.replace(/^\//, '').replace(/\/$/, '');
        }

        // Handle URLs that start with the domain (e.g., "domain.com/slug")
        const urlWithoutWww = normalizedUrl.replace(/^www\./, '');
        if (urlWithoutWww.startsWith(normalizedDomain + '/')) {
            const slug = urlWithoutWww.substring(normalizedDomain.length + 1).replace(/\/$/, '');
            return slug;
        }

        // Handle bare domain with path (e.g., "example.com/article")
        if (!normalizedUrl.includes('://') && !normalizedUrl.startsWith('#') && !normalizedUrl.startsWith('mailto:')) {
            // Check if it looks like domain/path format
            const slashIndex = normalizedUrl.indexOf('/');
            if (slashIndex > 0) {
                const potentialDomain = normalizedUrl.substring(0, slashIndex);
                // If the part before slash looks like a domain and matches our domain
                if (potentialDomain.includes('.') && potentialDomain === normalizedDomain) {
                    return normalizedUrl.substring(slashIndex + 1).replace(/\/$/, '');
                }
            }
            // Otherwise treat as relative path
            return normalizedUrl.replace(/\/$/, '');
        }
    } catch (e) {
        console.error('Error parsing URL:', url, e);
    }

    return null;
}

/**
 * Extract internal links from HTML content
 * Returns array of { slug, anchorText } for internal links only
 */
export function extractInternalLinks(
    html: string,
    domain: string
): { slug: string; anchorText: string }[] {
    const allLinks = parseLinksFromHtml(html);
    const internalLinks: { slug: string; anchorText: string }[] = [];

    for (const link of allLinks) {
        const slug = isInternalLink(link.href, domain);
        if (slug) {
            internalLinks.push({ slug, anchorText: link.anchorText });
        }
    }

    return internalLinks;
}

/**
 * Extract external links from HTML content
 * Returns array of { href, anchorText } for external links only
 */
export function extractExternalLinks(
    html: string,
    domain: string
): { href: string; anchorText: string }[] {
    const allLinks = parseLinksFromHtml(html);
    const externalLinks: { href: string; anchorText: string }[] = [];

    for (const link of allLinks) {
        // Skip empty links, mailto, tel, or anchor links
        if (!link.href ||
            link.href.startsWith('mailto:') ||
            link.href.startsWith('tel:') ||
            link.href.startsWith('#')) {
            continue;
        }

        const slug = isInternalLink(link.href, domain);
        // If it's NOT an internal link (slug is null), consider it external
        if (!slug) {
            externalLinks.push({ href: link.href, anchorText: link.anchorText });
        }
    }

    return externalLinks;
}

export function removeLinkBySlug(html: string, domain: string, targetSlug: string): string {
    if (!html || !domain || !targetSlug) return html;

    // Match <a> tags and check if they link to the target slug
    // Use [\s\S]*? to match content including newlines and nested tags
    const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

    let modified = false;
    const result = html.replace(linkRegex, (match, href, anchorText) => {
        const linkSlug = isInternalLink(href, domain);
        if (linkSlug === targetSlug) {
            // Remove the link, keep formatting
            console.log(`[Link-Remove] Removed link to ${targetSlug}, kept content: "${anchorText}"`);
            modified = true;
            return anchorText;
        }
        return match; // Keep the link unchanged
    });

    if (modified) return result;
    return html;
}

export function removeExternalLink(html: string, targetDomain: string): string {
    if (!html || !targetDomain) return html;

    // Match <a> tags and check if they link to the target domain
    // Use [\s\S]*? to match content including newlines and nested tags
    const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

    let modified = false;
    const result = html.replace(linkRegex, (match, href, anchorText) => {
        try {
            const urlObj = new URL(href.startsWith('http') ? href : `https://${href}`);
            const domain = urlObj.hostname.replace(/^www\./, '');

            console.log(`[Link-Remove-Check] Checking ${domain} vs ${targetDomain}`);

            if (domain === targetDomain) {
                // Remove the link, keep formatting
                console.log(`[Link-Remove] Removed external link to ${targetDomain}, kept content: "${anchorText}"`);
                modified = true;
                return anchorText;
            }
        } catch (e) {
            // Invalid URL, ignore
        }
        return match;
    });

    if (modified) return result;
    return html;
}
