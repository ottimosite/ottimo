import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout, AppLayout } from './components/Layout'
import { Home, InfoPage } from './pages/PublicPages'
import { Dashboard } from './features/dashboard/Dashboard'
import { Websites } from './features/websites/Websites'
import { AuditList, NewAudit } from './features/audits/Audits'
import { AuditOverview } from './features/audits/AuditOverview'
import { Recommendations } from './features/recommendations/Recommendations'
import { CategoryPage, HistoryPage, ReportsPage, SettingsPage, WebsiteDetail } from './features/platform/PlatformPages'
import { ConceptPage, ConceptsIndex } from './pages/ConceptPages'
import { AuditOnboarding } from './features/audits/AuditOnboarding'
export default function App() {
	return <Routes>
		<Route element={<PublicLayout />}>
			<Route path="/" element={<Home />} />
		</Route>
		<Route element={<PublicLayout />}>
			<Route path="/services" element={<InfoPage path="/services" />} />
			<Route path="/performance" element={<InfoPage path="/performance" />} />
			<Route path="/seo" element={<InfoPage path="/seo" />} />
			<Route path="/accessibility" element={<InfoPage path="/accessibility" />} />
			<Route path="/ai" element={<InfoPage path="/ai" />} />
			<Route path="/methodology" element={<InfoPage path="/methodology" />} />
			<Route path="/pricing" element={<InfoPage path="/pricing" />} />
			<Route path="/about" element={<InfoPage path="/about" />} />
			<Route path="/case-studies" element={<InfoPage path="/case-studies" />} />
			<Route path="/contact" element={<InfoPage path="/contact" />} />
			<Route path="/concepts" element={<ConceptsIndex />} />
			<Route path="/concepts/reliability" element={<ConceptPage theme="reliability" />} />
			<Route path="/concepts/speed" element={<ConceptPage theme="speed" />} />
			<Route path="/concepts/friendly" element={<ConceptPage theme="friendly" />} />
		</Route>
		<Route path="/app" element={<AppLayout />}>
			<Route index element={<Navigate to="/app/dashboard" replace />} />
			<Route path="dashboard" element={<Dashboard />} />
			<Route path="websites" element={<Websites />} />
			<Route path="websites/:id" element={<WebsiteDetail />} />
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
