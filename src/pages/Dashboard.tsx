import { useState, useEffect } from 'react'
import { Card, Typography, Row, Col, Statistic, message } from 'antd'
import { 
  ShoppingCartOutlined, 
  DollarOutlined, 
  UserOutlined, 
  ShopOutlined, 
  RiseOutlined,
  FallOutlined,
  WalletOutlined
} from '@ant-design/icons'
import { 
  salesApi, 
  customerPaymentsApi, 
  supplierPaymentsApi, 
  stockReceiptsApi,
  customersApi,
  suppliersApi,
  productsApi
} from '../api'

const { Title } = Typography

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCustomers: 0,
    totalSuppliers: 0,
    totalProducts: 0,
    totalCustomerPayments: 0,
    totalSupplierPayments: 0,
    totalStockReceipts: 0,
    lowStockProducts: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [sales, customers, suppliers, products, customerPayments, supplierPayments, stockReceipts] = await Promise.all([
          salesApi.getAll().catch(() => []),
          customersApi.getAll().catch(() => []),
          suppliersApi.getAll().catch(() => []),
          productsApi.getAll().catch(() => []),
          customerPaymentsApi.getAll().catch(() => []),
          supplierPaymentsApi.getAll().catch(() => []),
          stockReceiptsApi.getAll().catch(() => [])
        ])

        const lowStock = products.filter((p: any) => p.stock_quantity <= 10).length

        setStats({
          totalSales: Array.isArray(sales) ? sales.length : 0,
          totalCustomers: Array.isArray(customers) ? customers.length : 0,
          totalSuppliers: Array.isArray(suppliers) ? suppliers.length : 0,
          totalProducts: Array.isArray(products) ? products.length : 0,
          totalCustomerPayments: Array.isArray(customerPayments) ? customerPayments.length : 0,
          totalSupplierPayments: Array.isArray(supplierPayments) ? supplierPayments.length : 0,
          totalStockReceipts: Array.isArray(stockReceipts) ? stockReceipts.length : 0,
          lowStockProducts: lowStock
        })
      } catch (error) {
        message.error('Ошибка при загрузке статистики')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>Главная</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Всего продаж"
              value={stats.totalSales}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Клиенты"
              value={stats.totalCustomers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Поставщики"
              value={stats.totalSuppliers}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#52c41a' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Товары"
              value={stats.totalProducts}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#722ed1' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Приходы"
              value={stats.totalStockReceipts}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#13c2c2' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Оплаты клиентов"
              value={stats.totalCustomerPayments}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#faad14' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Оплаты поставщикам"
              value={stats.totalSupplierPayments}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#faad14' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Товары с малым остатком"
              value={stats.lowStockProducts}
              prefix={<FallOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
              loading={loading}
            />
          </Card>
        </Col>
              </Row>
    </div>
  )
}
