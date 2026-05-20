import { MetadataRoute } from 'next';
import { brandConfig } from '@easyfactura/brand-config';

const PRIVATE_DISALLOW = [
  '/dashboard/',
  '/invoice-print/',
  '/setup/',
  '/login',
  '/recuperar-password',
  '/nueva-password',
  '/verificar-email',
  '/studio/',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_DISALLOW,
      },
      // Permitir explícitamente bots de IA para máxima visibilidad en LLMs
      {
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'ClaudeBot',
          'anthropic-ai',
          'PerplexityBot',
          'Google-Extended',
          'Applebot-Extended',
          'cohere-ai',
        ],
        allow: '/',
        disallow: PRIVATE_DISALLOW,
      },
    ],
    sitemap: `${brandConfig.app.url}/sitemap.xml`,
    host: brandConfig.app.url,
  };
}
