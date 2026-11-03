import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { notes } from '@/content/research';
import { pageMeta } from '@/lib/meta';

export const dynamicParams = false;
export const generateStaticParams = () => notes.map((n) => ({ slug: n.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const n = notes.find((x) => x.slug === slug);
  return n ? pageMeta(n.title, n.summary) : {};
}

export default async function NotePage({ params }: Props) {
  const { slug } = await params;
  const n = notes.find((x) => x.slug === slug);
  if (!n) notFound();
  return (
    <article className="sec doc">
      <Link className="crumb mono" href="/research">← Research</Link>
      <span className="mono">{n.kind} · {n.date}</span>
      <h1>{n.title}</h1>
      <div className="prose">{n.body}</div>
    </article>
  );
}
