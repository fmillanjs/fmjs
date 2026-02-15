import { ClientProjectPage } from './client-page';

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string; projectId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { teamId, projectId } = await params;
  const filters = await searchParams;

  return <ClientProjectPage teamId={teamId} projectId={projectId} searchParams={filters} />;
}
