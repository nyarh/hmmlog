import {getCollection, type CollectionEntry} from 'astro:content';
export type Post = CollectionEntry<'posts'>;
export const posts = async () => (await getCollection('posts')).sort((a,b) => +b.data.date - +a.data.date || a.id.localeCompare(b.id));
export const postUrl = (post:Post) => '/posts/' + post.id + '/';
export const dateText = (date:Date) => date.toISOString().slice(0,10).replaceAll('-','.');
export const categoryUrl = (name:string) => '/categories/' + name.split('/').map(encodeURIComponent).join('/') + '/';
export interface CategoryNode {
  name: string;
  path: string;
  children: CategoryNode[];
  items: Post[];
}

// Each ancestor lists all posts in its subtree, in the original date order.
export function categoryTree(items: Post[]): CategoryNode[] {
  const roots: CategoryNode[] = [];
  const index = new Map<string, CategoryNode>();
  for (const post of items) {
    let siblings = roots;
    let path = '';
    for (const name of post.data.category.split('/')) {
      path = path ? path + '/' + name : name;
      let node = index.get(path);
      if (!node) {
        node = {name, path, children: [], items: []};
        index.set(path, node);
        siblings.push(node);
      }
      node.items.push(post);
      siblings = node.children;
    }
  }
  const sort = (siblings: CategoryNode[]) => {
    siblings.sort((a,b) => a.name.localeCompare(b.name, 'ko'));
    siblings.forEach(node => sort(node.children));
  };
  sort(roots);
  return roots;
}
export function allCategories(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap(node => [node, ...allCategories(node.children)]);
}
export const email = 'me@hmmlog.com';
