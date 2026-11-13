import type {APIRoute} from 'astro';
import {posts,postUrl,siteName} from '../lib/blog';
import {escapeXml,xmlResponse} from '../lib/xml';
export const GET:APIRoute=async({site})=>xmlResponse(`<rss version="2.0"><channel><title>${escapeXml(siteName)}</title><link>${site}</link><description>${escapeXml(siteName)} 개발 블로그</description><language>ko</language>${(await posts()).map(p=>{const url=escapeXml(new URL(postUrl(p),site).href);return `<item><title>${escapeXml(p.data.title)}</title><link>${url}</link><guid>${url}</guid><description>${escapeXml(p.data.description)}</description><pubDate>${p.data.date.toUTCString()}</pubDate></item>`}).join('')}</channel></rss>`);
