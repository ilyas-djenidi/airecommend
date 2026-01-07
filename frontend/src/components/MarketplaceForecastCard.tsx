import { ShoppingCart } from 'lucide-react';
import { Card } from './ui';

interface MarketplaceForecastCardProps {
    plasticTons: number;
    paperTons: number;
    days?: number;
}

export function MarketplaceForecastCard({ plasticTons, paperTons, days = 7 }: MarketplaceForecastCardProps) {
    const plasticValue = plasticTons * 45000; // 45000 DZD/ton (Estimate)
    const paperValue = paperTons * 12000;     // 12000 DZD/ton (Estimate)

    return (
        <Card className="p-6 bg-yellow-50 border border-yellow-200">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ShoppingCart className="text-yellow-600" />
                    <h3 className="font-bold text-yellow-900 text-lg">Marketplace Forecast (Next {days} Days)</h3>
                </div>
                <span className="text-xs font-bold bg-yellow-200 text-yellow-800 px-2 py-1 rounded">ECONOMIC OPPORTUNITY</span>
            </div>
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <div className="text-sm text-yellow-800 font-medium">Recoverable Plastic</div>
                    <div className="text-3xl font-bold text-yellow-900">
                        {plasticTons.toFixed(1)} <span className="text-sm font-normal text-yellow-700">Tons</span>
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">~{plasticValue.toLocaleString()} DZD Value</div>
                </div>
                <div>
                    <div className="text-sm text-yellow-800 font-medium">Recoverable Paper</div>
                    <div className="text-3xl font-bold text-yellow-900">
                        {paperTons.toFixed(1)} <span className="text-sm font-normal text-yellow-700">Tons</span>
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">~{paperValue.toLocaleString()} DZD Value</div>
                </div>
            </div>
        </Card>
    );
}
