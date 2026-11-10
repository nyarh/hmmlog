import {getCollection, type CollectionEntry} from 'astro:content';
export type Post = CollectionEntry<'posts'>;
export const posts = async () => (await getCollection('posts')).sort((a,b) => +b.data.date - +a.data.date || a.id.localeCompare(b.id));
export const postUrl = (post:Post) => '/posts/' + post.id + '/';
export const dateText = (date:Date) => date.toISOString().slice(0,10).replaceAll('-','.');
export const categoryUrl = (name:string) => '/categories/' + encodeURIComponent(name) + '/';
export const groups = (items:Post[]) => [...new Set(items.map(p => p.data.category))].sort();
export const email = 'me@hmmlog.com';
