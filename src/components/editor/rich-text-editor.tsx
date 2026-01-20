'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { useCallback, useState, useRef, useEffect } from 'react';
import {
    Bold, Italic, Strikethrough, Code, List, ListOrdered,
    Quote, Heading1, Heading2, Heading3, Link as LinkIcon, Unlink2, Undo, Redo, X, Check, ImageIcon, Loader2, Type, ChevronDown, ExternalLink, Pencil,
    AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react';
import { cn } from '@/lib/utils/helpers';
import { createClient } from '@/lib/supabase/client';

// Available fonts for the dropdown
const FONTS = [
    { name: 'Default', value: '' },
    { name: 'Inter', value: 'Inter' },
    { name: 'Arial', value: 'Arial' },
    { name: 'Georgia', value: 'Georgia' },
    { name: 'Times New Roman', value: 'Times New Roman' },
    { name: 'Verdana', value: 'Verdana' },
    { name: 'Roboto', value: 'Roboto' },
    { name: 'Open Sans', value: 'Open Sans' },
    { name: 'Lato', value: 'Lato' },
    { name: 'Montserrat', value: 'Montserrat' },
];

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    onWordCountChange?: (count: number) => void;
    placeholder?: string;
    availableNodes?: { id: string; title: string; slug: string }[];
    projectDomain?: string;
    readOnly?: boolean;
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
                'p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300',
                isActive && 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
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
    readOnly = false,
}: RichTextEditorProps) {
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [filteredNodes, setFilteredNodes] = useState(availableNodes);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Image alt text editing state
    const [showAltInput, setShowAltInput] = useState(false);
    const [imageAlt, setImageAlt] = useState('');

    // Link popup state (appears when clicking a link)
    const [showLinkPopup, setShowLinkPopup] = useState(false);
    const [popupLinkUrl, setPopupLinkUrl] = useState('');
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

    // Image popup state (appears when clicking an image)
    const [showImagePopup, setShowImagePopup] = useState(false);
    const [popupImageAlt, setPopupImageAlt] = useState('');
    const [imagePopupPosition, setImagePopupPosition] = useState({ top: 0, left: 0 });
    const [selectedImageSrc, setSelectedImageSrc] = useState<string>(''); // Track which image is selected

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
            TextStyle,
            FontFamily.configure({
                types: ['textStyle'],
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'border-collapse w-full my-4',
                },
            }),
            TableRow,
            TableCell,
            TableHeader,
            Link.configure({
                openOnClick: false,
                autolink: false,
                linkOnPaste: true,
                HTMLAttributes: {
                    class: 'text-indigo-600 underline',
                },
            }),
            Image.configure({
                allowBase64: true,
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full h-auto my-4 cursor-pointer transition-all hover:ring-2 hover:ring-indigo-300',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right', 'justify'],
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        editable: !readOnly,
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
                class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
            },
            // Handle clicks on links and images
            handleClick(view, pos, event) {
                const target = event.target as HTMLElement;
                const link = target.closest('a');
                const img = target.closest('img');

                // Handle link clicks
                if (link && link.href) {
                    event.preventDefault();
                    event.stopPropagation();

                    // Dispatch custom event to handle in React
                    const customEvent = new CustomEvent('editor-link-click', {
                        detail: {
                            href: link.href,
                            rect: link.getBoundingClientRect(),
                        }
                    });
                    view.dom.dispatchEvent(customEvent);

                    return true; // Prevent default ProseMirror handling
                }

                // Handle image clicks
                if (img) {
                    event.preventDefault();
                    event.stopPropagation();

                    // Dispatch custom event to handle in React
                    const customEvent = new CustomEvent('editor-image-click', {
                        detail: {
                            src: img.src,
                            alt: img.alt || '',
                            rect: img.getBoundingClientRect(),
                        }
                    });
                    view.dom.dispatchEvent(customEvent);

                    return true;
                }

                return false;
            },
            // Clean up pasted HTML from Google Docs and other sources
            transformPastedHTML(html: string) {
                // Create a temporary DOM element to parse the HTML
                const doc = new DOMParser().parseFromString(html, 'text/html');

                // Remove all style attributes (except from images)
                doc.querySelectorAll('[style]').forEach(el => {
                    if (el.tagName !== 'IMG') {
                        el.removeAttribute('style');
                    }
                });

                // Remove all class attributes (except from images)
                doc.querySelectorAll('[class]').forEach(el => {
                    if (el.tagName !== 'IMG') {
                        el.removeAttribute('class');
                    }
                });

                // Process images - keep them and add our styling classes
                doc.querySelectorAll('img').forEach(img => {
                    // Add our styling classes to images
                    img.setAttribute('class', 'rounded-lg max-w-full h-auto my-4');
                    // Remove any width/height constraints that might be inline
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                });

                // Remove ALL bold tags - Google Docs wraps everything in nested <b> tags
                // Users can re-select and bold specific words after pasting
                doc.querySelectorAll('b, strong').forEach(bold => {
                    bold.replaceWith(...bold.childNodes);
                });

                // Remove ALL spans (Google Docs uses them excessively)
                doc.querySelectorAll('span').forEach(span => {
                    span.replaceWith(...span.childNodes);
                });

                // Clean up empty elements (but not images)
                doc.querySelectorAll('b:empty, strong:empty, i:empty, em:empty, span:empty').forEach(el => el.remove());

                return doc.body.innerHTML
                    // Normalize whitespace
                    .replace(/&nbsp;/gi, ' ');
            },
            // Handle paste events for clipboard images
            handlePaste(view, event) {
                const items = event.clipboardData?.items;
                const htmlData = event.clipboardData?.getData('text/html');
                if (!items) return false;

                // First, check if clipboard contains image files directly (screenshots, copied images)
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    if (item.type.indexOf('image') !== -1 && item.kind === 'file') {
                        const file = item.getAsFile();
                        if (file) {
                            event.preventDefault();

                            // Convert image file to base64 and insert
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const base64 = e.target?.result as string;
                                if (base64) {
                                    const { state, dispatch } = view;
                                    const node = state.schema.nodes.image.create({
                                        src: base64,
                                        alt: file.name || 'Pasted image',
                                    });
                                    const tr = state.tr.replaceSelectionWith(node);
                                    dispatch(tr);
                                }
                            };
                            reader.readAsDataURL(file);
                            return true;
                        }
                    }
                }

                // If HTML contains images but no direct image file, 
                // process the HTML and try to load the images
                if (htmlData && htmlData.includes('<img')) {
                    event.preventDefault();

                    const doc = new window.DOMParser().parseFromString(htmlData, 'text/html');
                    const images = doc.querySelectorAll('img');

                    // Process images - try to fetch and convert to base64
                    const imagePromises: Promise<void>[] = [];

                    images.forEach(img => {
                        const src = img.getAttribute('src') || '';

                        // If already base64, keep it
                        if (src.startsWith('data:')) {
                            img.setAttribute('class', 'rounded-lg max-w-full h-auto my-4');
                            return;
                        }

                        // For external URLs, try to fetch via canvas
                        if (src.startsWith('http') || src.startsWith('blob:')) {
                            const promise = new Promise<void>((resolve) => {
                                const imgEl = new window.Image();
                                imgEl.crossOrigin = 'anonymous';
                                imgEl.onload = () => {
                                    try {
                                        const canvas = document.createElement('canvas');
                                        canvas.width = imgEl.naturalWidth;
                                        canvas.height = imgEl.naturalHeight;
                                        const ctx = canvas.getContext('2d');
                                        ctx?.drawImage(imgEl, 0, 0);
                                        const dataUrl = canvas.toDataURL('image/png');
                                        img.setAttribute('src', dataUrl);
                                        img.setAttribute('class', 'rounded-lg max-w-full h-auto my-4');
                                    } catch {
                                        console.warn('[Paste] Canvas tainted, using placeholder');
                                        img.setAttribute('alt', 'Image could not be loaded - please re-upload');
                                        img.setAttribute('src', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"%3E%3Crect fill="%23fef3c7" width="200" height="100" rx="8"/%3E%3Ctext fill="%23d97706" font-family="sans-serif" font-size="11" x="50%25" y="50%25" text-anchor="middle"%3EImage not loaded - re-upload%3C/text%3E%3C/svg%3E');
                                    }
                                    resolve();
                                };
                                imgEl.onerror = () => {
                                    console.warn('[Paste] Could not load image:', src.substring(0, 50));
                                    img.setAttribute('alt', 'Image could not be loaded - please re-upload');
                                    img.setAttribute('src', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"%3E%3Crect fill="%23fef3c7" width="200" height="100" rx="8"/%3E%3Ctext fill="%23d97706" font-family="sans-serif" font-size="11" x="50%25" y="50%25" text-anchor="middle"%3EImage not loaded - re-upload%3C/text%3E%3C/svg%3E');
                                    resolve();
                                };
                                imgEl.src = src;
                            });
                            imagePromises.push(promise);
                        }
                    });

                    // Wait for all images to be processed, then insert content
                    Promise.all(imagePromises).then(() => {
                        // Clean up the HTML
                        doc.querySelectorAll('[style]').forEach(el => {
                            if (el.tagName !== 'IMG') el.removeAttribute('style');
                        });
                        doc.querySelectorAll('[class]').forEach(el => {
                            if (el.tagName !== 'IMG') el.removeAttribute('class');
                        });
                        // Remove bold/span tags
                        doc.querySelectorAll('b, strong').forEach(el => el.replaceWith(...el.childNodes));
                        doc.querySelectorAll('span').forEach(el => el.replaceWith(...el.childNodes));

                        const cleanedHtml = doc.body.innerHTML.replace(/&nbsp;/gi, ' ');

                        // Insert the cleaned HTML using the editor's setContent
                        const { state, dispatch } = view;
                        const parser = view.state.schema;
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = cleanedHtml;

                        // Insert at current cursor position
                        const { $from } = state.selection;
                        let tr = state.tr;

                        // Use insertContent method to paste
                        const content = tempDiv.innerHTML;
                        const fragment = new window.DOMParser().parseFromString(content, 'text/html').body;

                        // Insert each child node
                        Array.from(fragment.childNodes).forEach(child => {
                            if (child.nodeType === Node.ELEMENT_NODE || child.nodeType === Node.TEXT_NODE) {
                                const element = child as Element;
                                if (element.tagName === 'IMG') {
                                    const node = state.schema.nodes.image.create({
                                        src: element.getAttribute('src') || '',
                                        alt: element.getAttribute('alt') || 'Pasted image',
                                    });
                                    tr = tr.insert(tr.selection.$from.pos, node);
                                }
                            }
                        });

                        dispatch(tr);
                    });

                    return true;
                }

                // Let default handling process text paste
                return false;
            },
        },
    });

    // Handle link clicks to show popup instead of navigating
    useEffect(() => {
        if (!editor) return;

        const handleLinkClick = (event: Event) => {
            const customEvent = event as CustomEvent<{ href: string; rect: DOMRect }>;
            const { href, rect } = customEvent.detail;

            const editorContainer = editor.view.dom.parentElement;
            const containerRect = editorContainer?.getBoundingClientRect();

            setPopupLinkUrl(href);
            setPopupPosition({
                top: rect.bottom - (containerRect?.top || 0) + 8,
                left: rect.left - (containerRect?.left || 0),
            });
            setShowLinkPopup(true);
        };

        const editorElement = editor.view.dom;
        editorElement.addEventListener('editor-link-click', handleLinkClick);

        return () => {
            editorElement.removeEventListener('editor-link-click', handleLinkClick);
        };
    }, [editor]);

    // Handle image clicks to show popup
    useEffect(() => {
        if (!editor) return;

        const handleImageClick = (event: Event) => {
            const customEvent = event as CustomEvent<{ src: string; alt: string; rect: DOMRect }>;
            const { src, alt, rect } = customEvent.detail;

            const editorContainer = editor.view.dom.parentElement;
            const containerRect = editorContainer?.getBoundingClientRect();

            setSelectedImageSrc(src); // Store which image was clicked
            setPopupImageAlt(alt);
            setImagePopupPosition({
                top: rect.bottom - (containerRect?.top || 0) + 8,
                left: rect.left - (containerRect?.left || 0),
            });
            setShowImagePopup(true);
            setShowLinkPopup(false); // Close link popup if open
        };

        const editorElement = editor.view.dom;
        editorElement.addEventListener('editor-image-click', handleImageClick);

        return () => {
            editorElement.removeEventListener('editor-image-click', handleImageClick);
        };
    }, [editor]);

    // Close link popup when clicking outside
    useEffect(() => {
        if (!showLinkPopup) return;

        const handleClickOutside = (e: MouseEvent) => {
            const popup = document.getElementById('link-popup');
            if (popup && !popup.contains(e.target as Node)) {
                setShowLinkPopup(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showLinkPopup]);

    // Close image popup when clicking outside
    useEffect(() => {
        if (!showImagePopup) return;

        const handleClickOutside = (e: MouseEvent) => {
            const popup = document.getElementById('image-popup');
            if (popup && !popup.contains(e.target as Node)) {
                setShowImagePopup(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showImagePopup]);

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

            // Insert image into editor with empty alt (user can edit later)
            editor.chain().focus().setImage({ src: publicUrl, alt: '' }).run();
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

    // Open alt text input for current image
    const openAltInput = useCallback(() => {
        if (!editor) return;
        const currentAlt = editor.getAttributes('image').alt || '';
        setImageAlt(currentAlt);
        setShowAltInput(true);
    }, [editor]);

    // Apply alt text to current image
    const applyAlt = useCallback(() => {
        if (!editor) return;
        editor.chain().focus().updateAttributes('image', { alt: imageAlt }).run();
        setShowAltInput(false);
        setImageAlt('');
    }, [editor, imageAlt]);

    // Cancel alt text editing
    const cancelAlt = useCallback(() => {
        setShowAltInput(false);
        setImageAlt('');
        editor?.chain().focus().run();
    }, [editor]);

    if (!editor) {
        return (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 animate-pulse h-[500px]" />
        );
    }

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 flex flex-col h-full min-h-[500px]">
            {/* Toolbar - Fixed at top (hidden in readOnly mode) */}
            {!readOnly && (
            <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-wrap shrink-0">
                {/* Font Family Dropdown */}
                <select
                    value={editor.getAttributes('textStyle').fontFamily || ''}
                    onChange={(e) => {
                        if (e.target.value) {
                            editor.chain().focus().setFontFamily(e.target.value).run();
                        } else {
                            editor.chain().focus().unsetFontFamily().run();
                        }
                    }}
                    className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[120px]"
                    title="Font Family"
                >
                    {FONTS.map((font) => (
                        <option key={font.value} value={font.value} style={{ fontFamily: font.value || 'inherit' }}>
                            {font.name}
                        </option>
                    ))}
                </select>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

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

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

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

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

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

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Text Alignment */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    isActive={editor.isActive({ textAlign: 'left' })}
                    title="Align Left"
                >
                    <AlignLeft className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    isActive={editor.isActive({ textAlign: 'center' })}
                    title="Align Center"
                >
                    <AlignCenter className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    isActive={editor.isActive({ textAlign: 'right' })}
                    title="Align Right"
                >
                    <AlignRight className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    isActive={editor.isActive({ textAlign: 'justify' })}
                    title="Justify"
                >
                    <AlignJustify className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

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

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

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

                {/* Edit Alt Text button - only shows when image is selected */}
                {editor.isActive('image') && (
                    <button
                        type="button"
                        onClick={openAltInput}
                        title="Edit Alt Text (for SEO & Accessibility)"
                        className={cn(
                            'px-2 py-1 rounded text-xs font-bold transition-colors border',
                            showAltInput
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 hover:border-green-300 dark:hover:border-green-700'
                        )}
                    >
                        ALT
                    </button>
                )}

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
            )}

            {/* Link Input Bar */}
            {!readOnly && showLinkInput && (
                <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-950">
                    <LinkIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={linkUrl}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            placeholder="Enter URL or search article..."
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                            <div className="absolute top-full left-0 mt-1 w-full md:w-96 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
                                {filteredNodes.map((node) => (
                                    <button
                                        key={node.id}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col"
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
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{node.title}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{node.slug}</span>
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
                            className="p-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            title="Cancel"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Alt Text Input Bar */}
            {!readOnly && showAltInput && (
                <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-950">
                    <Type className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <input
                        type="text"
                        value={imageAlt}
                        onChange={(e) => setImageAlt(e.target.value)}
                        placeholder="Enter alt text for image (improves SEO & accessibility)"
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                applyAlt();
                            } else if (e.key === 'Escape') {
                                cancelAlt();
                            }
                        }}
                    />
                    <button
                        onClick={applyAlt}
                        className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        title="Apply Alt Text"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                    <button
                        onClick={cancelAlt}
                        className="p-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        title="Cancel"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Editor Content - Scrollable */}
            <div className="flex-1 overflow-y-auto relative">
                <EditorContent editor={editor} />

                {/* Link Popup - appears when clicking on a link */}
                {showLinkPopup && (
                    <div
                        id="link-popup"
                        className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 flex items-center gap-2 max-w-md"
                        style={{
                            top: popupPosition.top,
                            left: popupPosition.left,
                        }}
                    >
                        <a
                            href={popupLinkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 truncate max-w-[250px]"
                            title={popupLinkUrl}
                        >
                            <ExternalLink className="w-4 h-4 shrink-0" />
                            <span className="truncate">{popupLinkUrl}</span>
                        </a>
                        <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />
                        <button
                            onClick={() => {
                                setShowLinkPopup(false);
                                openLinkInput();
                            }}
                            className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Edit Link"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                editor?.chain().focus().unsetLink().run();
                                setShowLinkPopup(false);
                            }}
                            className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Remove Link"
                        >
                            <Unlink2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowLinkPopup(false)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Image Popup - appears when clicking on an image */}
                {showImagePopup && (
                    <div
                        id="image-popup"
                        className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 w-72"
                        style={{
                            top: imagePopupPosition.top,
                            left: imagePopupPosition.left,
                        }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <ImageIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Image Alt Text</span>
                        </div>
                        <input
                            type="text"
                            value={popupImageAlt}
                            onChange={(e) => setPopupImageAlt(e.target.value)}
                            placeholder="Describe this image for SEO & accessibility"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    // Find the image by src and update its alt text
                                    if (editor && selectedImageSrc) {
                                        const currentContent = editor.getHTML();
                                        // Create a regex to find the image and update its alt
                                        const imgRegex = new RegExp(`(<img[^>]*src=["']${selectedImageSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*)alt=["'][^"']*["']`, 'g');
                                        let newContent = currentContent.replace(imgRegex, `$1alt="${popupImageAlt}"`);
                                        // If image didn't have alt attribute, add it
                                        if (newContent === currentContent) {
                                            const addAltRegex = new RegExp(`(<img[^>]*src=["']${selectedImageSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'])([^>]*>)`, 'g');
                                            newContent = currentContent.replace(addAltRegex, `$1 alt="${popupImageAlt}"$2`);
                                        }
                                        editor.commands.setContent(newContent);
                                    }
                                    setShowImagePopup(false);
                                } else if (e.key === 'Escape') {
                                    setShowImagePopup(false);
                                }
                            }}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowImagePopup(false)}
                                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    // Find the image by src and update its alt text
                                    if (editor && selectedImageSrc) {
                                        const currentContent = editor.getHTML();
                                        // Create a regex to find the image and update its alt
                                        const imgRegex = new RegExp(`(<img[^>]*src=["']${selectedImageSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*)alt=["'][^"']*["']`, 'g');
                                        let newContent = currentContent.replace(imgRegex, `$1alt="${popupImageAlt}"`);
                                        // If image didn't have alt attribute, add it
                                        if (newContent === currentContent) {
                                            const addAltRegex = new RegExp(`(<img[^>]*src=["']${selectedImageSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'])([^>]*>)`, 'g');
                                            newContent = currentContent.replace(addAltRegex, `$1 alt="${popupImageAlt}"$2`);
                                        }
                                        editor.commands.setContent(newContent);
                                    }
                                    setShowImagePopup(false);
                                }}
                                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                                Save Alt Text
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
