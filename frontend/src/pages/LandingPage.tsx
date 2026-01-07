import { Link } from 'react-router-dom';
import { Settings, BrainCircuit, ArrowRight } from 'lucide-react';

export function LandingPage() {
    return (
        <div className="max-w-4xl mx-auto py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
                    Daily Decision Engine <span className="text-blue-600">Admin</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                    Configure urban waste variables and run AI simulations to generate optimized resource mandates.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Input Button */}
                <Link to="/inputs" className="group">
                    <div className="h-full bg-white border-2 border-slate-200 rounded-2xl p-8 transition-all hover:border-blue-500 hover:shadow-xl cursor-pointer flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Settings size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3">1. Configure Inputs</h2>
                        <p className="text-slate-500 mb-6">
                            Define your Zones, Weekly Schedule, available Fleet Resources, and Calendar Events.
                        </p>
                        <span className="text-blue-600 font-semibold group-hover:translate-x-1 transition-transform flex items-center">
                            Manage Configuration <ArrowRight size={18} className="ml-2" />
                        </span>
                    </div>
                </Link>

                {/* Output Button */}
                <Link to="/output" className="group">
                    <div className="h-full bg-slate-900 border-2 border-slate-900 rounded-2xl p-8 transition-all hover:shadow-xl cursor-pointer flex flex-col items-center text-center text-white">
                        <div className="w-20 h-20 bg-slate-800 text-green-400 rounded-full flex items-center justify-center mb-6 group-hover:bg-green-500 group-hover:text-white transition-colors">
                            <BrainCircuit size={40} />
                        </div>
                        <h2 className="text-2xl font-bold mb-3">2. AI Output (Simulation)</h2>
                        <p className="text-slate-400 mb-6">
                            Run the Decision Engine to generate daily mandates, resource allocations, and explanations.
                        </p>
                        <span className="text-green-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center">
                            Run Simulation <ArrowRight size={18} className="ml-2" />
                        </span>
                    </div>
                </Link>
            </div>
        </div>
    );
}
