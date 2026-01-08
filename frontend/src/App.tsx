import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LandingPage } from './pages/LandingPage'
import { InputsPage } from './pages/InputsPage'
import { PlannerPage } from './pages/PlannerPage'

import { CollectorLogin } from './pages/CollectorLogin'
import { CollectorDashboard } from './pages/CollectorDashboard'
import { AIInsightsPage } from './pages/AIInsightsPage';
import { MapsPage } from './pages/MapsPage';
import { CollectorsPage } from './pages/CollectorsPage';

import { OperationsMap } from './components/visualization/OperationsMap'

function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                {/* Operator Portal (Wrapped in Layout) */}
                <Route path="/" element={<Layout><LandingPage /></Layout>} />
                <Route path="/inputs" element={<Layout><InputsPage /></Layout>} />
                <Route path="/output" element={<Layout><PlannerPage /></Layout>} />
                <Route path="/ai-insights" element={<Layout><AIInsightsPage /></Layout>} />
                <Route path="/maps" element={<Layout><MapsPage /></Layout>} />
                <Route path="/collectors" element={<Layout><CollectorsPage /></Layout>} />
                <Route path="/map-ia" element={<Layout><OperationsMap /></Layout>} />

                {/* Collector Portal (Standalone) */}
                <Route path="/collector/login" element={<CollectorLogin />} />
                <Route path="/collector/dashboard" element={<CollectorDashboard />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
