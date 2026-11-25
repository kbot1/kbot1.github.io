import type { APIContext } from 'astro';
import { veilleRss } from '../../lib-rss';
export const GET = (context: APIContext) => veilleRss(context, 'en');
