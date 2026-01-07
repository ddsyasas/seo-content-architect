'use client';

import { useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EDGE_TYPE_LABELS } from '@/lib/utils/constants';
import type { EdgeType } from '@/lib/types';

interface EdgeStyleOptions {
    lineWidth: number;
    arrowSize: number;
    lineStyle: 'solid' | 'dashed' | 'dotted';
}

interface EdgeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { edgeType: EdgeType; keyword: string; styleOptions: EdgeStyleOptions }) => void;
    isEdit?: boolean;
    initialData?: { edgeType: EdgeType; keyword: string; styleOptions?: EdgeStyleOptions };
}

const defaultStyles: Record<EdgeType, EdgeStyleOptions> = {
    hierarchy: { lineWidth: 3, arrowSize: 20, lineStyle: 'solid' },
    sibling: { lineWidth: 2, arrowSize: 16, lineStyle: 'solid' },
    cross_cluster: { lineWidth: 2, arrowSize: 16, lineStyle: 'dashed' },
    outbound: { lineWidth: 2, arrowSize: 14, lineStyle: 'dotted' },
    backlink: { lineWidth: 2, arrowSize: 14, lineStyle: 'dotted' },
};

export function EdgeModal({ isOpen, onClose, onSubmit, isEdit, initialData }: EdgeModalProps) {
    const [edgeType, setEdgeType] = useState<EdgeType>(initialData?.edgeType || 'hierarchy');
    const [keyword, setKeyword] = useState(initialData?.keyword || '');
    const [styleOptions, setStyleOptions] = useState<EdgeStyleOptions>(
        initialData?.styleOptions || defaultStyles.hierarchy
    );
    const [showAdvanced, setShowAdvanced] = useState(true);
    const [error, setError] = useState('');

    const handleEdgeTypeChange = (type: EdgeType) => {
        setEdgeType(type);
        // Apply default styles for the selected type
        setStyleOptions(defaultStyles[type]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!keyword.trim()) {
            setError('Anchor text / keyword is required');
            return;
        }

        onSubmit({ edgeType, keyword: keyword.trim(), styleOptions });
        handleClose();
    };

    const handleClose = () => {
        setKeyword('');
        setEdgeType('hierarchy');
        setStyleOptions(defaultStyles.hierarchy);
        setShowAdvanced(false);
        setError('');
        onClose();
    };

    const edgeTypes: { type: EdgeType; description: string }[] = [
        { type: 'hierarchy', description: 'Parent ↔ Child relationship' },
        { type: 'sibling', description: 'Same-level articles' },
        { type: 'cross_cluster', description: 'Different topic clusters' },
        { type: 'outbound', description: 'Link to external site' },
        { type: 'backlink', description: 'Link from external site' },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isEdit ? 'Edit Connection' : 'Create Connection'}
            size="md"
        >
            <form onSubmit={handleSubmit}>
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Edge Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Link Type
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {edgeTypes.map(({ type, description }) => (
                                <label
                                    key={type}
                                    className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${edgeType === type
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="edgeType"
                                        value={type}
                                        checked={edgeType === type}
                                        onChange={() => handleEdgeTypeChange(type)}
                                        className="text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div className="flex-1">
                                        <span className="font-medium text-gray-900 text-sm">
                                            {EDGE_TYPE_LABELS[type]}
                                        </span>
                                        <p className="text-xs text-gray-500">{description}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Keyword Input */}
                    <Input
                        label="Anchor Text / Keyword"
                        placeholder="e.g., 'coffee brewing guide'"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        helperText="The clickable text used in the link"
                        required
                        autoFocus
                    />

                    {/* Advanced Styling Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        {showAdvanced ? '− Hide' : '+ Show'} Line Styling Options
                    </button>

                    {/* Advanced Styling Options */}
                    {showAdvanced && (
                        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                            <h4 className="text-sm font-medium text-gray-700">Line Styling</h4>

                            {/* Line Width */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Line Width: {styleOptions.lineWidth}px
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="6"
                                    value={styleOptions.lineWidth}
                                    onChange={(e) => setStyleOptions({
                                        ...styleOptions,
                                        lineWidth: parseInt(e.target.value)
                                    })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Arrow Size */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Arrow Size: {styleOptions.arrowSize}px
                                </label>
                                <input
                                    type="range"
                                    min="10"
                                    max="30"
                                    value={styleOptions.arrowSize}
                                    onChange={(e) => setStyleOptions({
                                        ...styleOptions,
                                        arrowSize: parseInt(e.target.value)
                                    })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Line Style */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                    Line Style
                                </label>
                                <div className="flex gap-2">
                                    {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                                        <button
                                            key={style}
                                            type="button"
                                            onClick={() => setStyleOptions({ ...styleOptions, lineStyle: style })}
                                            className={`flex-1 py-2 px-3 rounded border text-xs font-medium capitalize ${styleOptions.lineStyle === style
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="pt-2">
                                <label className="block text-xs font-medium text-gray-600 mb-2">Preview</label>
                                <svg width="100%" height="30" className="bg-white rounded border border-gray-200">
                                    <defs>
                                        <marker
                                            id="preview-arrow"
                                            viewBox="0 0 10 10"
                                            refX="5"
                                            refY="5"
                                            markerWidth={styleOptions.arrowSize / 4}
                                            markerHeight={styleOptions.arrowSize / 4}
                                            orient="auto-start-reverse"
                                        >
                                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6" />
                                        </marker>
                                    </defs>
                                    <line
                                        x1="20"
                                        y1="15"
                                        x2="280"
                                        y2="15"
                                        stroke="#3B82F6"
                                        strokeWidth={styleOptions.lineWidth}
                                        strokeDasharray={
                                            styleOptions.lineStyle === 'dashed' ? '8,4' :
                                                styleOptions.lineStyle === 'dotted' ? '2,4' : 'none'
                                        }
                                        markerEnd="url(#preview-arrow)"
                                    />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>

                <ModalFooter>
                    <Button type="button" variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        {isEdit ? 'Save Changes' : 'Create Link'}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
