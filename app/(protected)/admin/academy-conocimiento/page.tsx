import { fetchWithCookies } from '@/lib/utils/server-fetch';
import { AcademyKnowledgeStatusAdmin, type KnowledgeStatusRow } from '@/components/admin/AcademyKnowledgeStatusAdmin';

async function getData() {
  const data = await fetchWithCookies<{ articles: KnowledgeStatusRow[] }>('/api/admin/academy/knowledge-status');
  return data?.articles ?? [];
}

export default async function AdminAcademyKnowledgeStatusPage() {
  const articles = await getData();
  return <AcademyKnowledgeStatusAdmin initialArticles={articles} />;
}
