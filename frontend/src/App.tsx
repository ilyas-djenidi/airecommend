import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LandingPage } from './pages/LandingPage'
import { InputsPage } from './pages/InputsPage'
import { PlannerPage } from './pages/PlannerPage'

import { CollectorDashboard } from './pages/CollectorDashboard'
import { AIInsightsPage } from './pages/AIInsightsPage';
import { MapsPage } from './pages/MapsPage';

import { OperationsMap } from './components/visualization/OperationsMap'

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/inputs" element={<InputsPage />} />
                    <Route path="/output" element={<PlannerPage />} />
                    <Route path="/collector" element={<CollectorDashboard />} />
                    <Route path="/ai-insights" element={<AIInsightsPage />} />
                    <Route path="/maps" element={<MapsPage />} />
                    <Route path="/map-ia" element={<OperationsMap />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    )
}

export default App
