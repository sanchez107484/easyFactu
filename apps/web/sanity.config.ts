import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemas } from './src/sanity/schemas';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  title: 'Blog NovaFactura',
  schema: {
    types: schemas,
  },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Contenido')
          .items([
            S.listItem()
              .title('Artículos')
              .child(
                S.documentList()
                  .title('Artículos')
                  .filter('_type == "post"')
                  .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }]),
              ),
            S.listItem()
              .title('Autores')
              .child(S.documentList().title('Autores').filter('_type == "author"')),
            S.listItem()
              .title('Categorías')
              .child(S.documentList().title('Categorías').filter('_type == "category"')),
          ]),
    }),
  ],
});
