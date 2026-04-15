const API_KEY = process.env.EXPO_PUBLIC_NEWS_DATA_API_KEY;
const BASE_URL = 'https://newsdata.io/api/1';

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

/**
 * Fetches the latest F1 news from NewsData.io.
 * Supports pagination via the `page` argument.
 */
export async function fetchF1News(page: string | null = null): Promise<NewsResponse> {
    if (!API_KEY) {
        throw new Error('API Key for newsdata.io is missing. Check your .env file.');
    }

    // Simplification de la requête pour plus de fiabilité
    const query = encodeURIComponent('Formula 1');
    let url = `${BASE_URL}/news?apikey=${API_KEY}&q=${query}&size=3`;

    if (page) {
        url += `&page=${page}`;
    }

    try {
        console.log(`[NewsAPI] Fetching: ${url.replace(API_KEY, 'HIDDEN')}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn(`[NewsAPI] Request failed with status ${response.status}`);
            return { status: 'error', totalResults: 0, results: [], nextPage: null };
        }

        const data: NewsResponse = await response.json();
        return data;
    } catch (error: any) {
        console.error('Failed to fetch F1 news:', error.message);
        throw error;
    }
}
