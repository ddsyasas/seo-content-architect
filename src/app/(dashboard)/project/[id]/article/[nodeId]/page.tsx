import { ArticleEditor } from '@/components/editor/article-editor';

interface ArticlePageProps {
    params: Promise<{ id: string; nodeId: string }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
    const { id, nodeId } = await params;

    return <ArticleEditor projectId={id} nodeId={nodeId} />;
}
