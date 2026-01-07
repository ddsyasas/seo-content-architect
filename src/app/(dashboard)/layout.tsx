'use client';

import { type ReactNode, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Network,
    LayoutDashboard,
    FolderKanban,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    User
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/helpers';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [user, setUser] = useState<{ email: string; full_name?: string } | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUser({
                    email: data.user.email!,
                    full_name: data.user.user_metadata?.full_name,
                });
            }
        });
    }, []);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Projects', href: '/dashboard', icon: FolderKanban },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar backdrop */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Desktop (always visible, collapsible) */}
            <aside className={cn(
                'hidden lg:flex fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 flex-col transition-all duration-200',
                isCollapsed ? 'w-16' : 'w-64'
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className={cn(
                        'flex items-center p-4 border-b border-gray-200',
                        isCollapsed ? 'justify-center' : 'gap-2'
                    )}>
                        <Link href="/dashboard" className="flex items-center gap-2 text-indigo-600">
                            <Network className="w-7 h-7 shrink-0" />
                            {!isCollapsed && <span className="font-bold text-lg">SEO Architect</span>}
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-2 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    title={isCollapsed ? item.name : undefined}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                        isCollapsed && 'justify-center px-2',
                                        isActive
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    )}
                                >
                                    <item.icon className="w-5 h-5 shrink-0" />
                                    {!isCollapsed && item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Collapse toggle button */}
                    <div className="p-2 border-t border-gray-200">
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {isCollapsed ? (
                                <ChevronRight className="w-5 h-5" />
                            ) : (
                                <>
                                    <ChevronLeft className="w-5 h-5" />
                                    <span>Collapse</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* User menu */}
                    <div className="p-2 border-t border-gray-200">
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors',
                                    isCollapsed && 'justify-center px-2'
                                )}
                                title={isCollapsed ? (user?.full_name || user?.email || 'User') : undefined}
                            >
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-indigo-600" />
                                </div>
                                {!isCollapsed && (
                                    <>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {user?.full_name || 'User'}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                        </div>
                                        <ChevronDown className={cn(
                                            'w-4 h-4 text-gray-400 transition-transform shrink-0',
                                            isProfileOpen && 'rotate-180'
                                        )} />
                                    </>
                                )}
                            </button>

                            {isProfileOpen && (
                                <div className={cn(
                                    'absolute bottom-full mb-2 py-1 bg-white border border-gray-200 rounded-lg shadow-lg',
                                    isCollapsed ? 'left-full ml-2 w-40' : 'left-0 right-0'
                                )}>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Sidebar - Mobile (slide in/out) */}
            <aside className={cn(
                'lg:hidden fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-200',
                isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <Link href="/dashboard" className="flex items-center gap-2 text-indigo-600">
                            <Network className="w-7 h-7" />
                            <span className="font-bold text-lg">SEO Architect</span>
                        </Link>
                        <button
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="p-1 rounded-lg hover:bg-gray-100 text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileSidebarOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User menu */}
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user?.full_name || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className={cn(
                'transition-all duration-200',
                isCollapsed ? 'lg:pl-16' : 'lg:pl-64'
            )}>
                {/* Top header - Mobile only */}
                <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200">
                    <div className="flex items-center px-4 py-3">
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
