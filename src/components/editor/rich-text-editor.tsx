'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useState, useRef } from 'react';
import {
    Bold, Italic, Strikethrough, Code, List, ListOrdered,
    Quote, Heading1, Heading2, Heading3, Link as LinkIcon, Unlink2, Undo, Redo, X, Check, ImageIcon, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils/helpers';
import { createClient } from '@/lib/supabase/client';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    onWordCountChange?: (count: number) => void;
    placeholder?: string;
    availableNodes?: { id: string; title: string; slug: string }[];
    projectDomain?: string;
}

// Toolbar button component
function ToolbarButton({
    onClick,
    isActive,
    disabled,
    children,
    title,
}: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                'p-2 rounded hover:bg-gray-100 transition-colors text-gray-600',
                isActive && 'bg-indigo-100 text-indigo-700',
                disabled && 'opacity-50 cursor-not-allowed'
            )}
        >
            {children}
        </button>
    );
}

export function RichTextEditor({
    content,
    onChange,
    onWordCountChange,
    placeholder = 'Start writing your article...',
    availableNodes = [],
    projectDomain,
}: RichTextEditorProps) {
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [filteredNodes, setFilteredNodes] = useState(availableNodes);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter nodes when typing
    const handleUrlChange = (value: string) => {
        setLinkUrl(value);
        if (value.trim()) {
            const query = value.toLowerCase();
            setFilteredNodes(availableNodes.filter(n => n.title.toLowerCase().includes(query) || n.slug.toLowerCase().includes(query)));
        } else {
            setFilteredNodes(availableNodes);
        }
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Link.configure({
                openOnClick: false,
                autolink: false,
                linkOnPaste: true,
                HTMLAttributes: {
                    class: 'text-indigo-600 underline',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full h-auto my-4',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        immediatelyRender: false, // Fix SSR hydration issue
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html);

            // Calculate word count
            const text = editor.getText();
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            onWordCountChange?.(words);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4 text-gray-900',
            },
        },
    });

    const openLinkInput = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href || '';
        setLinkUrl(previousUrl);
        setShowLinkInput(true);
    }, [editor]);

    const applyLink = useCallback(() => {
        if (!editor) return;

        if (linkUrl === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            // Add https:// if no protocol specified
            let finalUrl = linkUrl;
            if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('/')) {
                finalUrl = 'https://' + finalUrl;
            }
            editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
        }

        setShowLinkInput(false);
        setLinkUrl('');
    }, [editor, linkUrl]);

    const cancelLink = useCallback(() => {
        setShowLinkInput(false);
        setLinkUrl('');
        editor?.chain().focus().run();
    }, [editor]);

    const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !editor) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        setIsUploading(true);
        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('article-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('article-images')
                .getPublicUrl(filePath);

            // Insert image into editor
            editor.chain().focus().setImage({ src: publicUrl }).run();
        } catch (error) {
            console.error('Failed to upload image:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [editor]);

    if (!editor) {
        return (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 animate-pulse h-[500px]" />
        );
    }

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 flex-wrap">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    title="Strikethrough"
                >
                    <Strikethrough className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    isActive={editor.isActive('code')}
                    title="Code"
                >
                    <Code className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive('heading', { level: 3 })}
                    title="Heading 3"
                >
                    <Heading3 className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Numbered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    title="Quote"
                >
                    <Quote className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <ToolbarButton
                    onClick={openLinkInput}
                    isActive={editor.isActive('link') || showLinkInput}
                    title="Add Link"
                >
                    <LinkIcon className="w-4 h-4" />
                </ToolbarButton>
                {editor.isActive('link') && (
                    <ToolbarButton
                        onClick={() => editor.chain().focus().unsetLink().run()}
                        title="Remove Link"
                    >
                        <Unlink2 className="w-4 h-4 text-red-500" />
                    </ToolbarButton>
                )}

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Image Upload */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                />
                <ToolbarButton
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    title="Add Image"
                >
                    {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <ImageIcon className="w-4 h-4" />
                    )}
                </ToolbarButton>

                <div className="flex-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo"
                >
                    <Undo className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo"
                >
                    <Redo className="w-4 h-4" />
                </ToolbarButton>
            </div>

            {/* Link Input Bar */}
            {showLinkInput && (
                <div className="flex items-center gap-2 p-2 border-b border-gray-200 bg-indigo-50">
                    <LinkIcon className="w-4 h-4 text-indigo-600" />
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={linkUrl}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            placeholder="Enter URL or search article..."
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    applyLink();
                                } else if (e.key === 'Escape') {
                                    cancelLink();
                                }
                            }}
                        />

                        {/* Autocomplete Dropdown */}
                        {showLinkInput && filteredNodes.length > 0 && (
                            <div className="absolute top-full left-0 mt-1 w-full md:w-96 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                                {filteredNodes.map((node) => (
                                    <button
                                        key={node.id}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex flex-col"
                                        onClick={() => {
                                            const url = projectDomain ? `https://${projectDomain}/${node.slug}` : `/${node.slug}`;
                                            setLinkUrl(url);
                                            // Auto apply? Or just set? Let's auto apply or just set.
                                            // User might want to edit. Just set for now.
                                            // Or better: set and keep input open?
                                            // Usually autocomplete selection applies properly or fills input.
                                            // I'll fill input.
                                        }}
                                    >
                                        <span className="font-medium text-gray-900">{node.title}</span>
                                        <span className="text-xs text-gray-500">{node.slug}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={applyLink}
                            className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                            title="Apply Link"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button
                            onClick={cancelLink}
                            className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors"
                            title="Cancel"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Editor Content */}
            <EditorContent editor={editor} />
        </div>
    );
}
