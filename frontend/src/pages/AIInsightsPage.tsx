import { useState } from 'react';
import { Card, Button, Input } from '../components/ui';
import { Brain, TrendingUp, Leaf, Recycle, AlertCircle, ShoppingCart } from 'lucide-react';
import { useStore } from '../store';

interface CompositionAnalysis {
    date: string;
    zone: string;
    wpi_score: number;
    organic_pct: number;
    plastic_pct: number;
    paper_pct: number;
    metals_pct: number;
    density_kg_m3: number;
    explanation_en: string;
    explanation_ar: string;
    explanation_fr: string;
}

export function AIInsightsPage() {
    const store = useStore();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [analysis, setAnalysis] = useState<CompositionAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [language, setLanguage] = useState<'en' | 'ar' | 'fr'>('en');

    const runAnalysis = async () => {
        setLoading(true);
        try {
            // Call backend composition analysis API
            const response = await fetch('http://localhost:8000/composition-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedDate,
                    zone_name: 'Sample Zone',
                    bioclimatic_zone: 'NORTHERN_COASTAL',
                    days_since_collection: 2
                })
            });

            if (response.ok) {
                const data = await response.json();
                setAnalysis(data);
            }
        } catch (e) {
            console.error('Analysis failed:', e);
            alert('AI Analysis unavailable. Backend may not be running.');
        } finally {
            setLoading(false);
        }
    };

    const getExplanation = () => {
        if (!analysis) return '';
        if (language === 'ar') return analysis.explanation_ar;
        if (language === 'fr') return analysis.explanation_fr;
        return analysis.explanation_en;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center gap-3 mb-2">
                    <Brain className="text-purple-600" size={32} />
                    <div>
                        <h1 className="text-3xl font-bold">AI Waste Intelligence</h1>
                        <p className="text-slate-600">Composition Analysis & Decision Insights (AND 2018-2019 Study)</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <Card className="p-4">
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Analysis Date</label>
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Language</label>
                        <select
                            className="border rounded px-3 py-2 bg-white"
                            value={language}
                            onChange={e => setLanguage(e.target.value as 'en' | 'ar' | 'fr')}
                        >
                            <option value="en">English</option>
                            <option value="ar">العربية</option>
                            <option value="fr">Français</option>
                        </select>
                    </div>
                    <Button onClick={runAnalysis} disabled={loading}>
                        {loading ? 'Analyzing...' : 'Run Analysis'}
                    </Button>
                </div>
            </Card>

            {/* Results */}
            {analysis && (
                <>
                    {/* WPI Score Card */}
                    <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-slate-600 mb-1">Waste Pressure Index (WPI)</div>
                                <div className="text-5xl font-bold text-purple-700">{analysis.wpi_score.toFixed(2)}</div>
                                <div className="text-sm text-slate-500 mt-1">Based on AND 2018-2019 Characterization Data</div>
                            </div>
                            <div className="text-right">
                                <div className={`inline-block px-4 py-2 rounded-lg font-bold text-white ${analysis.wpi_score > 5.0 ? 'bg-red-500' :
                                    analysis.wpi_score > 3.0 ? 'bg-orange-500' :
                                        analysis.wpi_score >= 0.8 ? 'bg-green-500' :
                                            'bg-gray-400'
                                    }`}>
                                    {analysis.wpi_score > 5.0 ? 'CRITICAL' :
                                        analysis.wpi_score > 3.0 ? 'HIGH' :
                                            analysis.wpi_score >= 0.8 ? 'NORMAL' :
                                                'LOW'}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Composition Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-4 border-l-4 border-green-500">
                            <div className="flex items-center gap-2 mb-2">
                                <Leaf className="text-green-600" />
                                <div className="font-bold text-slate-700">Organic Waste</div>
                            </div>
                            <div className="text-3xl font-bold text-green-700">{analysis.organic_pct.toFixed(1)}%</div>
                            <div className="text-xs text-slate-500 mt-1">Composting/Biogas Potential</div>
                        </Card>

                        <Card className="p-4 border-l-4 border-blue-500">
                            <div className="flex items-center gap-2 mb-2">
                                <Recycle className="text-blue-600" />
                                <div className="font-bold text-slate-700">Recyclables</div>
                            </div>
                            <div className="text-3xl font-bold text-blue-700">
                                {(analysis.plastic_pct + analysis.paper_pct + analysis.metals_pct).toFixed(1)}%
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                Plastic: {analysis.plastic_pct.toFixed(1)}% | Paper: {analysis.paper_pct.toFixed(1)}% | Metals: {analysis.metals_pct.toFixed(1)}%
                            </div>
                        </Card>

                        <Card className="p-4 border-l-4 border-purple-500">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="text-purple-600" />
                                <div className="font-bold text-slate-700">Density</div>
                            </div>
                            <div className="text-3xl font-bold text-purple-700">{analysis.density_kg_m3.toFixed(0)}</div>
                            <div className="text-xs text-slate-500 mt-1">kg/m³ (Estimated)</div>
                        </Card>
                    </div>

                    {/* SNGID 6: Marketplace Forecast */}
                    <Card className="p-6 bg-yellow-50 border border-yellow-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="text-yellow-600" />
                                <h3 className="font-bold text-yellow-900 text-lg">Marketplace Forecast (Next 7 Days)</h3>
                            </div>
                            <span className="text-xs font-bold bg-yellow-200 text-yellow-800 px-2 py-1 rounded">ECONOMIC OPPORTUNITY</span>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <div className="text-sm text-yellow-800 font-medium">Recoverable Plastic</div>
                                <div className="text-3xl font-bold text-yellow-900">
                                    {((analysis.plastic_pct / 100) * 85).toFixed(1)} <span className="text-sm font-normal text-yellow-700">Tons</span>
                                </div>
                                <div className="text-xs text-yellow-600 mt-1">~{((analysis.plastic_pct / 100) * 85 * 45000).toLocaleString()} DZD Value</div>
                            </div>
                            <div>
                                <div className="text-sm text-yellow-800 font-medium">Recoverable Paper</div>
                                <div className="text-3xl font-bold text-yellow-900">
                                    {((analysis.paper_pct / 100) * 85).toFixed(1)} <span className="text-sm font-normal text-yellow-700">Tons</span>
                                </div>
                                <div className="text-xs text-yellow-600 mt-1">~{((analysis.paper_pct / 100) * 85 * 12000).toLocaleString()} DZD Value</div>
                            </div>
                        </div>
                    </Card>


                </>
            )}

            {!analysis && !loading && (
                <Card className="p-12 text-center text-slate-400">
                    <Brain size={64} className="mx-auto mb-4 opacity-50" />
                    <p>Run an analysis to see waste composition insights and AI reasoning</p>
                </Card>
            )}
        </div>
    );
}
