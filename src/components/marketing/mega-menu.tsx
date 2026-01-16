'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Users, Target, Briefcase, Building2, ShoppingCart, Building, BookOpen, Video, Youtube, HelpCircle, Sparkles, FileQuestion, FileText, Link2, BarChart3 } from 'lucide-react';

interface MenuItemProps {
    href: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick?: () => void;
}

function MenuItem({ href, icon, title, description, onClick }: MenuItemProps) {
    return (
        <Link
            href={href}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
            onClick={onClick}
        >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors shrink-0">
                {icon}
            </div>
            <div>
                <div className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {title}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    {description}
                </div>
            </div>
        </Link>
    );
}

interface MegaMenuProps {
    label: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

export function MegaMenu({ label, children, isOpen, onToggle, onClose }: MegaMenuProps) {
    return (
        <div className="relative">
            <button
                onClick={onToggle}
                className={`flex items-center gap-1 font-medium transition-colors ${isOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                    }`}
            >
                {label}
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={onClose}
                    />
                    {/* Menu */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {children}
                    </div>
                </>
            )}
        </div>
    );
}

interface SolutionsMenuProps {
    onClose: () => void;
}

export function SolutionsMenu({ onClose }: SolutionsMenuProps) {
    return (
        <div className="w-[720px] p-6">
            <div className="grid grid-cols-3 gap-6">
                {/* By Role */}
                <div>
                    <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                        By Role
                    </div>
                    <div className="space-y-1">
                        <MenuItem
                            href="/solutions/marketing-managers"
                            icon={<Users className="w-5 h-5" />}
                            title="Marketing Managers"
                            description="Plan content strategies"
                            onClick={onClose}
                        />
                        <MenuItem
                            href="/solutions/seo-specialists"
                            icon={<Target className="w-5 h-5" />}
                            title="SEO Specialists"
                            description="Build topical authority"
                            onClick={onClose}
                        />
                        <MenuItem
                            href="/solutions/content-managers"
                            icon={<Briefcase className="w-5 h-5" />}
                            title="Content Managers"
                            description="Organize writers"
                            onClick={onClose}
                        />
                    </div>
                </div>

                {/* By Team */}
                <div>
                    <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                        By Team
                    </div>
                    <div className="space-y-1">
                        <MenuItem
                            href="/solutions/agencies"
                            icon={<Building2 className="w-5 h-5" />}
                            title="Agencies"
                            description="Multi-client SEO"
                            onClick={onClose}
                        />
                        <MenuItem
                            href="/solutions/in-house-teams"
                            icon={<Users className="w-5 h-5" />}
                            title="In-house Teams"
                            description="Scale your content"
                            onClick={onClose}
                        />
                    </div>
                </div>

                {/* By Industry */}
                <div>
                    <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                        By Industry
                    </div>
                    <div className="space-y-1">
                        <MenuItem
                            href="/solutions/ecommerce"
                            icon={<ShoppingCart className="w-5 h-5" />}
                            title="eCommerce"
                            description="Product pages"
                            onClick={onClose}
                        />
                        <MenuItem
                            href="/solutions/enterprise"
                            icon={<Building className="w-5 h-5" />}
                            title="Enterprise"
                            description="Large teams"
                            onClick={onClose}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

interface ResourcesMenuProps {
    onClose: () => void;
}

export function ResourcesMenu({ onClose }: ResourcesMenuProps) {
    return (
        <div className="w-[720px] p-6">
            <div className="grid grid-cols-3 gap-6">
                {/* Learn */}
                <div>
                    <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                        Learn
                    </div>
                    <div className="space-y-1">
                        <MenuItem
                            href="/resources/blog"
                            icon={<BookOpen className="w-5 h-5" />}
                            title="Blog"
                            description="SEO tips & strategies"
                            onClick={onClose}
                        />
                        <MenuItem
                            href="/resources/webinars"
                            icon={<Video className="w-5 h-5" />}
                            title="Webinars"
                            description="Live & recorded sessions"
                            onClick={onClose}
                        />
                        <MenuItem
                            href="/resources/youtube"
                            icon={<Youtube className="w-5 h-5" />}
                            title="YouTube"
                            description="Video tutorials"
                            onClick={onClose}
                        />
                    </div>
                </div>

                {/* Explore */}
                <div>
                    <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                        Explore
                    </div>
                    <div className="space-y-1">
                        <MenuItem
                            href="/resources/knowledge-base"
                            icon={<HelpCircle className="w-5 h-5" />}
                            title="Knowledge Base"
                            description="Help articles & guides"
                            onClick={onClose}
                        />
                        <MenuItem
                            href="/resources/product-updates"
                            icon={<Sparkles className="w-5 h-5" />}
                            title="Product Updates"
                            description="What's new"
                            onClick={onClose}
                        />
                        <MenuItem
                            href="/resources/why-syncseo"
                            icon={<FileQuestion className="w-5 h-5" />}
                            title="Why SyncSEO"
                            description="Our approach"
                            onClick={onClose}
                        />
                    </div>
                </div>

                {/* Free Resources */}
                <div>
                    <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                        Free Resources
                    </div>
                    <div className="space-y-1">
                        <MenuItem
                            href="/resources/content-architecture-template"
                            icon={<FileText className="w-5 h-5" />}
                            title="Content Architecture Template"
                            description="Plan your structure"
                            onClick={onClose}
                        />
                        <MenuItem
                            href="/resources/internal-linking-checklist"
                            icon={<Link2 className="w-5 h-5" />}
                            title="Internal Linking Checklist"
                            description="Optimize your links"
                            onClick={onClose}
                        />
                        <MenuItem
                            href="/resources/seo-score-guide"
                            icon={<BarChart3 className="w-5 h-5" />}
                            title="SEO Score Guide"
                            description="Improve your score"
                            onClick={onClose}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
