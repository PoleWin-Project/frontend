const RSS_TO_JSON = 'https://api.rss2json.com/v1/api.json';

const RSS_FEEDS = [
    { url: 'https://fr.motorsport.com/rss/f1/news/', source: 'motorsport.com' },
    { url: 'https://www.f1only.fr/feed/', source: 'f1only.fr' },
    { url: 'https://www.nextgen-auto.com/formule-1/feed', source: 'nextgen-auto.com' },
];

export interface NewsArticle {
    article_id: string;
    title: string;
    link: string;
    description: string;
    content: string | null;
    pubDate: string;
    image_url: string | null;
    source_id: string;
}

export interface NewsResponse {
    status: string;
    totalResults: number;
    results: NewsArticle[];
    nextPage: string | null;
}

interface RssItem {
    title: string;
    pubDate: string;
    link: string;
    description: string;
    content: string;
    thumbnail: string;
    enclosure: { link?: string; type?: string };
    author: string;
}

function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
}

async function fetchFeed(feedUrl: string, sourceName: string): Promise<NewsArticle[]> {
    try {
        const url = `${RSS_TO_JSON}?rss_url=${encodeURIComponent(feedUrl)}&count=10`;
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        if (data.status !== 'ok' || !Array.isArray(data.items)) return [];

        return data.items.map((item: RssItem): NewsArticle => ({
            article_id: encodeURIComponent(item.link),
            title: stripHtml(item.title || ''),
            link: item.link,
            description: stripHtml(item.description || ''),
            content: item.content ? stripHtml(item.content) : null,
            pubDate: item.pubDate,
            image_url: item.thumbnail || item.enclosure?.link || null,
            source_id: sourceName,
        }));
    } catch {
        return [];
    }
}

export async function fetchF1News(_page: string | null = null): Promise<NewsResponse> {
    const settled = await Promise.allSettled(
        RSS_FEEDS.map(feed => fetchFeed(feed.url, feed.source))
    );

    const seenLinks = new Set<string>();
    const allArticles: NewsArticle[] = [];

    for (const result of settled) {
        if (result.status === 'fulfilled') {
            for (const article of result.value) {
                if (!seenLinks.has(article.link)) {
                    seenLinks.add(article.link);
                    allArticles.push(article);
                }
            }
        }
    }

    allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return {
        status: 'ok',
        totalResults: allArticles.length,
        results: allArticles,
        nextPage: null,
    };
}
