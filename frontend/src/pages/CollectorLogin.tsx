import React, { useState } from 'react';
import { useStore } from '../store';
import { Button, Input, Card, Label } from '../components/ui';
import { Box, Lock, User, Truck } from 'lucide-react';

export function CollectorLogin() {
    const [collectorId, setCollectorId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // In a real app, this would use an Auth context/provider
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const apiBase = (import.meta as any).env.VITE_API_BASE || '';
            const response = await fetch(`${apiBase}/api/collectors/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collector_id: collectorId, password })
            });

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Server error: ${response.status} ${text.substring(0, 50)}`);
            }

            if (!response.ok) {
                throw new Error(data?.detail || 'Login failed');
            }

            // Save to localStorage/Store
            localStorage.setItem('collector_token', data.access_token);
            localStorage.setItem('collector_info', JSON.stringify(data.collector));

            // Redirect to dashboard (in a real app used with React Router)
            window.location.href = '/collector/dashboard';

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4 shadow-lg shadow-blue-500/20">
                        <Truck className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Collector Portal</h1>
                    <p className="text-slate-400">Algerian Waste Management System</p>
                </div>

                <Card className="bg-slate-800 border-slate-700 shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-slate-300">Collector ID</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus:ring-blue-500"
                                    placeholder="Enter your driver ID"
                                    value={collectorId}
                                    onChange={(e) => setCollectorId(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    type="password"
                                    className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus:ring-blue-500"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign In to Route"}
                        </Button>
                    </form>
                </Card>

                <p className="mt-8 text-center text-slate-500 text-sm">
                    Contact your municipal operator if you lost your credentials.
                </p>
            </div>
        </div>
    );
}
