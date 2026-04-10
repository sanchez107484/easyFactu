import { defineField, defineType } from 'sanity';

export const authorSchema = defineType({
  name: 'author',
  title: 'Autor',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Foto del autor',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'bio',
      title: 'Biografía',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: { title: 'name', media: 'image' },
  },
});
