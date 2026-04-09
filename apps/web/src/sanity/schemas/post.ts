import { defineField, defineType } from 'sanity';

export const postSchema = defineType({
  name: 'post',
  title: 'Artículo',
  type: 'document',
  groups: [
    { name: 'content', title: 'Contenido', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required().min(10).max(100),
    }),
    defineField({
      name: 'slug',
      title: 'URL del artículo',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Fecha de publicación',
      type: 'datetime',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Autor',
      type: 'reference',
      group: 'content',
      to: [{ type: 'author' }],
    }),
    defineField({
      name: 'categories',
      title: 'Categorías',
      type: 'array',
      group: 'content',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
    }),
    defineField({
      name: 'featuredImage',
      title: 'Imagen destacada',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Texto alternativo',
          description: 'Describe la imagen para accesibilidad y SEO (obligatorio)',
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Resumen',
      type: 'text',
      rows: 3,
      group: 'content',
      description:
        'Breve descripción del artículo (máx. 200 caracteres). Aparece en listados y en Google.',
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: 'body',
      title: 'Contenido del artículo',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Párrafo', value: 'normal' },
            { title: 'Título H2', value: 'h2' },
            { title: 'Título H3', value: 'h3' },
            { title: 'Título H4', value: 'h4' },
            { title: 'Cita destacada', value: 'blockquote' },
          ],
          lists: [
            { title: 'Lista con viñetas', value: 'bullet' },
            { title: 'Lista numerada', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Negrita', value: 'strong' },
              { title: 'Cursiva', value: 'em' },
              { title: 'Subrayado', value: 'underline' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Enlace',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: (Rule) => Rule.required().uri({ allowRelative: true }),
                  },
                  {
                    name: 'blank',
                    type: 'boolean',
                    title: 'Abrir en nueva pestaña',
                  },
                ],
              },
            ],
          },
        },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Texto alternativo',
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Pie de foto',
            },
          ],
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'seoTitle',
      title: 'Título SEO',
      type: 'string',
      group: 'seo',
      description: 'Deja vacío para usar el título del artículo. Máx. 60 caracteres.',
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Descripción SEO',
      type: 'text',
      rows: 2,
      group: 'seo',
      description: 'Deja vacío para usar el resumen. Máx. 160 caracteres.',
      validation: (Rule) => Rule.max(160),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'featuredImage',
    },
    prepare(selection) {
      const { author } = selection;
      return {
        ...selection,
        subtitle: author ? `por ${author}` : 'Sin autor',
      };
    },
  },
  orderings: [
    {
      title: 'Fecha de publicación (más reciente)',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
});
