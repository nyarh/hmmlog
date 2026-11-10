import type {APIRoute} from 'astro';
import {posts,allCategories,categoryTree,postUrl,categoryUrl} from '../lib/blog';
import {escapeXml,xmlResponse} from '../lib/xml';
export const GET:APIRoute=async({site})=>{const items=await posts();const paths=['/','/categories/',...allCategories(categoryTree(items)).map(node => categoryUrl(node.path)),...items.map(postUrl)];return xmlResponse(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path=>`<url><loc>${escapeXml(new URL(path,site).href)}</loc></url>`).join('')}</urlset>`)};
