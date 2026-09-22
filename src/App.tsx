import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout, AppLayout } from './components/Layout'
import { Home, InfoPage, PublicAuditExample } from './pages/PublicPages'
import { PublicServicePage } from './pages/PublicServicePages'
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
			<Route path="/performance" element={<PublicServicePage slug="performance" />} />
			<Route path="/seo" element={<PublicServicePage slug="seo" />} />
			<Route path="/accessibility" element={<PublicServicePage slug="accessibility" />} />
			<Route path="/ai" element={<PublicServicePage slug="ai" />} />
			<Route path="/methodology" element={<InfoPage path="/methodology" />} />
			<Route path="/usability" element={<PublicServicePage slug="usability" />} />
			<Route path="/technical" element={<PublicServicePage slug="technical" />} />
			<Route path="/pricing" element={<InfoPage path="/pricing" />} />
			<Route path="/about" element={<InfoPage path="/about" />} />
			<Route path="/case-studies" element={<InfoPage path="/case-studies" />} />
			<Route path="/contact" element={<InfoPage path="/contact" />} />
			<Route path="/concepts" element={<ConceptsIndex />} />
			<Route path="/concepts/reliability" element={<ConceptPage theme="reliability" />} />
			<Route path="/concepts/speed" element={<ConceptPage theme="speed" />} />
			<Route path="/concepts/friendly" element={<ConceptPage theme="friendly" />} />
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
