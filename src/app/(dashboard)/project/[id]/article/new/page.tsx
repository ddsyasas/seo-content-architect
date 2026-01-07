import { NewArticlePage } from '@/components/editor/new-article-page';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function NewArticle({ params }: PageProps) {
    const { id } = await params;

    return <NewArticlePage projectId={id} />;
}
