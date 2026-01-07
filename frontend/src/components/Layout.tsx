import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, Play, Home, Truck, Brain } from 'lucide-react';
import { cn } from './ui';

export function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();

    const nav = [
        { label: 'Home', path: '/', icon: Home },
        { label: 'Configure Inputs', path: '/inputs', icon: Settings },
        { label: 'AI Output (Planner)', path: '/output', icon: Play },
        { label: 'Collector Dashboard', path: '/collector', icon: Truck },
        { label: 'AI Insights', path: '/ai-insights', icon: Brain },
    ];

    return (
        <div className="flex h-screen bg-slate-50">
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <Link to="/" className="flex items-center gap-2">
                        <LayoutDashboard className="text-blue-500" />
                        <h1 className="text-xl font-bold text-white">
                            Decision Engine
                        </h1>
                    </Link>
                    <p className="text-xs text-slate-500 mt-1 ml-8">Admin Console (v0.2)</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {nav.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
                                location.pathname === item.path
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>
            <main className="flex-1 overflow-auto p-8">
                <div className="max-w-5xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
