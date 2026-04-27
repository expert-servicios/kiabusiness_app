import { notFound } from 'next/navigation';
import { categories } from '@/lib/utils/catalog';

export default async function CategoriaPage({ params }: { params: Promise<{ categoria: string }> }) {
  const { categoria } = await params;
  const category = categories.find((item) => item.slug === categoria);
  if (!category) return notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-serif text-4xl">{category.name}</h1>
      <p className="mt-4 text-brand-slate">{category.description}</p>
    </main>
  );
}
