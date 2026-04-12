import { useState } from 'react'
import { Layout as AntLayout, Menu, Button, Typography, Divider, Drawer } from 'antd'
import { useAuth } from '../contexts/AuthContext'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { UserOutlined, DashboardOutlined, LogoutOutlined, TeamOutlined, ShopOutlined, MenuOutlined, ShoppingOutlined, UserAddOutlined, ShoppingCartOutlined, DollarOutlined, RotateLeftOutlined, CreditCardOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import './Layout.css'

const { Content, Header, Sider } = AntLayout
const { Text } = Typography

interface LayoutProps {
  children: React.ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout, isAuthenticated, hasRole } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const menuItems = isAuthenticated
    ? [
        {
          key: '/',
          icon: <DashboardOutlined />,
          label: <Link to="/">Главная</Link>,
        },
        {
          key: '/suppliers',
          icon: <ShopOutlined />,
          label: <Link to="/suppliers">Поставщики</Link>,
        },
        {
          key: '/products',
          icon: <ShoppingOutlined />,
          label: <Link to="/products">Товары</Link>,
        },
        {
          key: '/customers',
          icon: <UserAddOutlined />,
          label: <Link to="/customers">Клиенты</Link>,
        },
        {
          key: '/stock-receipts',
          icon: <ShoppingCartOutlined />,
          label: <Link to="/stock-receipts">Приходы</Link>,
        },
        {
          key: '/sales',
          icon: <DollarOutlined />,
          label: <Link to="/sales">Продажи</Link>,
        },
        {
          key: '/returns',
          icon: <RotateLeftOutlined />,
          label: <Link to="/returns">Возвраты</Link>,
        },
        {
          key: '/expenses',
          icon: <CreditCardOutlined />,
          label: <Link to="/expenses">Расходы</Link>,
        },
        {
          key: '/debtors',
          icon: <ExclamationCircleOutlined />,
          label: <Link to="/debtors">Должники</Link>,
        },
                ...(hasRole('ADMIN') ? [{
          key: '/users',
          icon: <TeamOutlined />,
          label: <Link to="/users">Пользователи</Link>,
        }] : []),
      ]
    : [
        {
          key: '/login',
          icon: <UserOutlined />,
          label: <Link to="/login">Вход</Link>,
        },
      ]

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {isAuthenticated ? (
        <>
          <Sider
            breakpoint="md"
            collapsedWidth="0"
            theme="dark"
            className="desktop-sidebar"
            style={{
              height: '100vh',
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 1000,
            }}
          >
            <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                ERM App
              </Text>
            </div>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
            />
            {user && (
              <>
                <Divider style={{ background: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />
                <div style={{ padding: '0 16px' }}>
                  <Button
                    type="primary"
                    danger
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                    block
                  >
                    <span>Выйти</span>
                  </Button>
                </div>
              </>
            )}
          </Sider>

          {/* Mobile Drawer Menu */}
          <Drawer
            placement="left"
            closable={true}
            onClose={() => setMobileMenuOpen(false)}
            open={mobileMenuOpen}
            width={200}
            styles={{ body: { padding: 0, background: '#001529' } }}
          >
            <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#001529' }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                ERM App
              </Text>
            </div>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={() => setMobileMenuOpen(false)}
            />
            {user && (
              <>
                <Divider style={{ background: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />
                <div style={{ padding: '0 16px' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.65)' }}>{user.name}</Text>
                  <Button
                    type="primary"
                    danger
                    icon={<LogoutOutlined />}
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleLogout()
                    }}
                    block
                    style={{ marginTop: 8 }}
                  >
                    Выйти
                  </Button>
                </div>
              </>
            )}
          </Drawer>

          <AntLayout style={{ marginLeft: 200 }}>
            <Header className="mobile-header" style={{
              padding: '0 16px',
              background: '#fff',
              borderBottom: '1px solid #f0f0f0',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              zIndex: 999,
            }}>
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuOpen(true)}
                style={{ fontSize: 18 }}
              />
              <Text strong style={{ fontSize: 16 }}>ERM App</Text>
              <div style={{ width: 32 }} />
            </Header>
            <Content style={{ padding: '16px 12px', minHeight: 'calc(100vh - 64px)' }}>{children}</Content>
          </AntLayout>
        </>
      ) : (
        <Content>{children}</Content>
      )}
    </AntLayout>
  )
}
