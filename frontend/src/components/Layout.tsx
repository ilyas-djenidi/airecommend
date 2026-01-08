import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    BrainCircuit,
    Truck,
    Menu,
    Plus
} from 'lucide-react';
import { cn } from './ui';

const NavSection = ({ label }: { label: string }) => (
    <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 mt-6">
        {label}
    </p>
);

const NavLink = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
    <Link
        to={to}
        className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium",
            active
                ? "bg-[#ECFDF5] text-[#047857]"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
        )}
    >
        <Icon size={18} strokeWidth={active ? 2.5 : 2} />
        {label}
    </Link>
);

export function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();

    return (
        <div className="flex min-h-screen bg-white text-slate-900 font-sans antialiased">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-100 bg-white flex flex-col sticky top-0 h-screen shrink-0 z-50">
                <div className="p-6 pb-2">
                    {/* Logo Section */}
                    <Link to="/" className="flex items-center gap-3 mb-10 px-2 transition-opacity hover:opacity-80">
                        <div className="w-10 h-10 bg-[#047857] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#047857]/20">
                            <span className="font-black text-lg">ER</span>
                        </div>
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">
                            EcoRecycle
                        </h1>
                    </Link>

                    <nav className="space-y-1">
                        <NavLink to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />

                        <NavSection label="Configuration" />
                        <NavLink to="/inputs" icon={Settings} label="System Settings" active={location.pathname === '/inputs'} />

                        <NavSection label="Intelligence" />
                        <NavLink to="/output" icon={BrainCircuit} label="AI Simulations" active={location.pathname === '/output'} />

                        <NavSection label="Resources" />
                        <NavLink to="/collectors" icon={Truck} label="Manage Collectors" active={location.pathname === '/collectors'} />
                    </nav>
                </div>

                {/* Bottom Profile Section */}
                <div className="mt-auto p-4 border-t border-slate-50">
                    <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 overflow-hidden shadow-inner">
                                <span className="font-bold text-xs">SM</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-slate-900 group-hover:text-[#047857] transition-colors">State of M'sila</span>
                                <span className="text-[10px] text-[#047857] font-semibold">Verified Partner</span>
                            </div>
                        </div>
                        <Plus size={16} className="text-slate-300 group-hover:text-[#047857]" />
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#F9FAFB]/30">
                {/* Header Section */}
                <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-slate-50 sticky top-0 z-40">
                    <div className="flex items-center gap-6">
                        <button className="text-slate-300 hover:text-slate-900 transition-colors p-2 -ml-2">
                            <Menu size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-[#ECFDF5] border border-[#d1fae5] flex items-center justify-center text-[#047857] font-black text-xs shadow-sm">
                            M
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8 lg:p-12">
                    <div className="max-w-[1400px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
