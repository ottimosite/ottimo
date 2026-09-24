import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout, AppLayout } from './components/Layout'
import { Home, InfoPage, PublicAuditExample } from './pages/PublicPages'
import { Dashboard } from './features/dashboard/Dashboard'
import { Websites } from './features/websites/Websites'
import { AuditList, NewAudit } from './features/audits/Audits'
import { AuditOverview } from './features/audits/AuditOverview'
import { Recommendations } from './features/recommendations/Recommendations'
import { CategoryPage, HistoryPage, InsightsPage, ReportsPage, SettingsPage, WebsiteDetail } from './features/platform/PlatformPages'
import { ConceptPage, ConceptsIndex } from './pages/ConceptPages'
import { AuditOnboarding } from './features/audits/AuditOnboarding'
import { AuthProvider, ProtectedWorkspace } from './features/auth/AuthBoundary'
export default function App() {
	return <Routes>
		<Route element={<PublicLayout />}>
			<Route path="/" element={<Home />} />
		</Route>
		<Route element={<PublicLayout />}>
			<Route path="/services" element={<InfoPage path="/services" />} />
			<Route path="/methodology" element={<InfoPage path="/methodology" />} />
			<Route path="/pricing" element={<InfoPage path="/pricing" />} />
			<Route path="/example-audit" element={<PublicAuditExample />} />

			{/* Legacy public routes stay recoverable without remaining part of the active IA. */}
			<Route path="/performance" element={<Navigate to="/services" replace />} />
			<Route path="/seo" element={<Navigate to="/services" replace />} />
			<Route path="/accessibility" element={<Navigate to="/services" replace />} />
			<Route path="/ai" element={<Navigate to="/services" replace />} />
			<Route path="/usability" element={<Navigate to="/services" replace />} />
			<Route path="/technical" element={<Navigate to="/services" replace />} />
			<Route path="/about" element={<Navigate to="/" replace />} />
			<Route path="/case-studies" element={<Navigate to="/example-audit" replace />} />
			<Route path="/contact" element={<Navigate to="/#start" replace />} />
			<Route path="/concepts" element={<Navigate to="/methodology" replace />} />
			<Route path="/concepts/reliability" element={<Navigate to="/methodology" replace />} />
			<Route path="/concepts/speed" element={<Navigate to="/methodology" replace />} />
			<Route path="/concepts/friendly" element={<Navigate to="/methodology" replace />} />
		</Route>
		<Route path="/app" element={<AuthProvider><ProtectedWorkspace><AppLayout /></ProtectedWorkspace></AuthProvider>}>
			<Route index element={<Navigate to="/app/dashboard" replace />} />
			<Route path="dashboard" element={<Dashboard />} />
			<Route path="websites" element={<Websites />} />
			<Route path="websites/:id" element={<WebsiteDetail />} />
			<Route path="insights" element={<InsightsPage />} />
			<Route path="audits" element={<AuditList />} />
			<Route path="audits/new" element={<AuditOnboarding />} />
			<Route path="audits/new/run" element={<NewAudit />} />
			<Route path="audits/:id" element={<AuditOverview />} />
			<Route path="performance" element={<CategoryPage category="performance" />} />
			<Route path="accessibility" element={<CategoryPage category="accessibility" />} />
			<Route path="seo" element={<CategoryPage category="seo" />} />
			<Route path="usability" element={<CategoryPage category="usability" />} />
			<Route path="technical" element={<CategoryPage category="technical" />} />
			<Route path="ai" element={<CategoryPage category="ai" />} />
			<Route path="recommendations" element={<Recommendations />} />
			<Route path="reports" element={<ReportsPage />} />
			<Route path="history" element={<HistoryPage />} />
			<Route path="settings" element={<SettingsPage />} />
		</Route>
	</Routes>
}
