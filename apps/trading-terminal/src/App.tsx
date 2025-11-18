import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from '@pages/LoginPage'
import RegistrationPage from '@pages/RegistrationPage'
import DashboardLayout from '@layouts/DashboardLayout'
import Dashboard from '@pages/Dashboard'
import PortfolioPage from '@pages/PortfolioPage'
import OrdersPage from '@pages/OrdersPage'
import MarketPage from '@pages/MarketPage'
import SettingsPage from '@pages/SettingsPage'

function AppRoutes() {
  const { user } = useAuth()
  const isAuthenticated = !!user

  return (
    <Routes>
      {!isAuthenticated ? (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/market/:pair" element={<MarketPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      )}
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App
