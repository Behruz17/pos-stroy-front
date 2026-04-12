import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Users } from './pages/Users'
import { UserEdit } from './pages/UserEdit'
import { Suppliers } from './pages/Suppliers'
import { SupplierEdit } from './pages/SupplierEdit'
import { Products } from './pages/Products'
import { ProductEdit } from './pages/ProductEdit'
import { Customers } from './pages/Customers'
import { CustomerEdit } from './pages/CustomerEdit'
import { StockReceipts } from './pages/StockReceipts'
import { Sales } from './pages/Sales'
import { SaleEdit } from './pages/SaleEdit'
import { Returns } from './pages/Returns'
import { Expenses } from './pages/Expenses'
import { Debtors } from './pages/Debtors'

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
              path="/users/:id/edit"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <UserEdit />
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
              path="/suppliers/:id/edit"
              element={
                <ProtectedRoute>
                  <SupplierEdit />
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
              path="/products/:id/edit"
              element={
                <ProtectedRoute>
                  <ProductEdit />
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
              path="/customers/:id/edit"
              element={
                <ProtectedRoute>
                  <CustomerEdit />
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
              path="/sales/:id/edit"
              element={
                <ProtectedRoute>
                  <SaleEdit />
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
                        {/* Redirects */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
