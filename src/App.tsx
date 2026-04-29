import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Users } from './pages/Users'
import { Suppliers } from './pages/Suppliers'
import { Products } from './pages/Products'
import { Customers } from './pages/Customers'
import { StockReceipts } from './pages/StockReceipts'
import { Sales } from './pages/Sales'
import { Returns } from './pages/Returns'
import { Expenses } from './pages/Expenses'
import { Debtors } from './pages/Debtors'
import { Salaries } from './pages/Salaries'
import { Accounts } from './pages/Accounts'
import { Reports } from './pages/Reports'
import { DailySummaryPage } from './pages/DailySummary'
import { Conversions } from './pages/Conversions'
import { ExchangeRates } from './pages/ExchangeRates'
import { Employees } from './pages/Employees'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Users />
                </ProtectedRoute>
              }
            />
                        <Route
              path="/suppliers"
              element={
                <ProtectedRoute>
                  <Suppliers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              }
            />
                        <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              }
            />
                        <Route
              path="/stock-receipts"
              element={
                <ProtectedRoute>
                  <StockReceipts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales"
              element={
                <ProtectedRoute>
                  <Sales />
                </ProtectedRoute>
              }
            />
                                    <Route
              path="/returns"
              element={
                <ProtectedRoute>
                  <Returns />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/debtors"
              element={
                <ProtectedRoute>
                  <Debtors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/salaries"
              element={
                <ProtectedRoute>
                  <Salaries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts"
              element={
                <ProtectedRoute>
                  <Accounts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/daily-summary"
              element={
                <ProtectedRoute>
                  <DailySummaryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conversions"
              element={
                <ProtectedRoute>
                  <Conversions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exchange-rates"
              element={
                <ProtectedRoute>
                  <ExchangeRates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <Employees />
                </ProtectedRoute>
              }
            />
            {/* Redirects */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
