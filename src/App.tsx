import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CategoryListPage from './pages/CategoryListPage'
import LearnPage from './pages/LearnPage'
import PracticePage from './pages/PracticePage'
import ResultPage from './pages/ResultPage'

function Placeholder({ name }: { name: string }) {
  return <div className="p-8 text-2xl text-center">{name}</div>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/categories" element={<CategoryListPage />} />
        <Route path="/learn/:categoryId" element={<LearnPage />} />
        <Route path="/practice/:categoryId" element={<PracticePage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/parent/login" element={<Placeholder name="家长登录" />} />
        <Route path="/parent/dashboard" element={<Placeholder name="家长面板" />} />
        <Route path="/parent/category/:categoryId" element={<Placeholder name="主题详情" />} />
        <Route path="/parent/settings" element={<Placeholder name="设置" />} />
      </Routes>
    </BrowserRouter>
  )
}
