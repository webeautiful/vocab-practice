import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CategoryListPage from './pages/CategoryListPage'
import LearnPage from './pages/LearnPage'
import PracticePage from './pages/PracticePage'
import ResultPage from './pages/ResultPage'
import ParentLoginPage from './pages/ParentLoginPage'
import ParentDashboardPage from './pages/ParentDashboardPage'
import ParentCategoryPage from './pages/ParentCategoryPage'
import ParentSettingsPage from './pages/ParentSettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/categories" element={<CategoryListPage />} />
        <Route path="/learn/:categoryId" element={<LearnPage />} />
        <Route path="/practice/:categoryId" element={<PracticePage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/parent/login" element={<ParentLoginPage />} />
        <Route path="/parent/dashboard" element={<ParentDashboardPage />} />
        <Route path="/parent/category/:categoryId" element={<ParentCategoryPage />} />
        <Route path="/parent/settings" element={<ParentSettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
