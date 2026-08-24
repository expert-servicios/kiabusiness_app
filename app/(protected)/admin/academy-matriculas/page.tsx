import { fetchWithCookies } from '@/lib/utils/server-fetch';
import { AcademyEnrollmentsAdmin, type AcademyEnrollmentRow, type UnlinkedOrderRow } from '@/components/admin/AcademyEnrollmentsAdmin';

async function getData() {
  const data = await fetchWithCookies<{ enrollments: AcademyEnrollmentRow[]; unlinkedOrders: UnlinkedOrderRow[] }>(
    '/api/admin/academy/enrollments'
  );
  return { enrollments: data?.enrollments ?? [], unlinkedOrders: data?.unlinkedOrders ?? [] };
}

export default async function AdminAcademyMatriculasPage() {
  const { enrollments, unlinkedOrders } = await getData();

  return (
    <AcademyEnrollmentsAdmin initialEnrollments={enrollments} initialUnlinkedOrders={unlinkedOrders} />
  );
}
