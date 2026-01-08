'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'syncSEOPreferences';

export default function PreferencesSettingsPage() {
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [preferences, setPreferences] = useState({
        // Email notifications
        weeklyUsageSummary: true,
        teamInvitations: true,
        productUpdates: true,

        // Editor preferences
        autoSaveInterval: '60',
        defaultContentType: 'cluster',

        // Canvas preferences
        snapToGrid: false,
        showMinimap: true,
        defaultZoom: '100',
    });

    // Load preferences from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setPreferences(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error('Failed to parse saved preferences:', e);
            }
        }
        setIsLoading(false);
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        // Simulate save delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));

        setMessage({ type: 'success', text: 'Preferences saved successfully!' });
        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Preferences</h2>
                <p className="text-gray-500">Customize your SyncSEO experience</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
                {/* Email Notifications */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                            <div>
                                <span className="font-medium text-gray-900">Weekly usage summary</span>
                                <p className="text-sm text-gray-500">Get a weekly report of your project activity</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.weeklyUsageSummary}
                                onChange={(e) => setPreferences(p => ({ ...p, weeklyUsageSummary: e.target.checked }))}
                                className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                            <div>
                                <span className="font-medium text-gray-900">Team invitation notifications</span>
                                <p className="text-sm text-gray-500">Get notified when someone invites you to a project</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.teamInvitations}
                                onChange={(e) => setPreferences(p => ({ ...p, teamInvitations: e.target.checked }))}
                                className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                            <div>
                                <span className="font-medium text-gray-900">Product updates and tips</span>
                                <p className="text-sm text-gray-500">Receive news about new features and best practices</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.productUpdates}
                                onChange={(e) => setPreferences(p => ({ ...p, productUpdates: e.target.checked }))}
                                className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                        </label>
                    </div>
                </div>

                {/* Editor Preferences */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Editor Preferences</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Auto-save interval
                            </label>
                            <select
                                value={preferences.autoSaveInterval}
                                onChange={(e) => setPreferences(p => ({ ...p, autoSaveInterval: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="30">Every 30 seconds</option>
                                <option value="60">Every 1 minute</option>
                                <option value="120">Every 2 minutes</option>
                                <option value="300">Every 5 minutes</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Default content type for new articles
                            </label>
                            <select
                                value={preferences.defaultContentType}
                                onChange={(e) => setPreferences(p => ({ ...p, defaultContentType: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="pillar">Pillar Content</option>
                                <option value="cluster">Cluster Content</option>
                                <option value="supporting">Supporting Content</option>
                                <option value="planned">Planned Content</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Canvas Preferences */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Canvas Preferences</h3>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                            <div>
                                <span className="font-medium text-gray-900">Snap to grid</span>
                                <p className="text-sm text-gray-500">Align nodes to a grid when moving them</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.snapToGrid}
                                onChange={(e) => setPreferences(p => ({ ...p, snapToGrid: e.target.checked }))}
                                className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                            <div>
                                <span className="font-medium text-gray-900">Show minimap</span>
                                <p className="text-sm text-gray-500">Display a minimap for easier navigation</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.showMinimap}
                                onChange={(e) => setPreferences(p => ({ ...p, showMinimap: e.target.checked }))}
                                className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                        </label>

                        <div className="max-w-xs">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Default zoom level
                            </label>
                            <select
                                value={preferences.defaultZoom}
                                onChange={(e) => setPreferences(p => ({ ...p, defaultZoom: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="50">50%</option>
                                <option value="75">75%</option>
                                <option value="100">100%</option>
                                <option value="125">125%</option>
                                <option value="150">150%</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Save Preferences
                </button>
            </form>
        </div>
    );
}
