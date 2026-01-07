import { ProjectPageClient } from '@/components/project/project-page-client';

interface ProjectPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { id } = await params;

    return <ProjectPageClient projectId={id} />;
}
