import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
const posts = defineCollection({
  loader: glob({pattern: '**/*.md', base: './src/content/posts'}),
  schema: z.object({
    title: z.string(), description: z.string(), date: z.coerce.date(),
    category: z.string().default('미분류')
      .transform(value => value.split('/').map(part => part.trim()).filter(Boolean).join('/') || '미분류')
      .refine(path => !path.split('/').some(part => part === '.' || part === '..'), '유효한 카테고리 이름을 입력하세요.'),
    art: z.enum(['stack','tree','code','blocks']).default('stack'),
  }),
});
export const collections = { posts };
