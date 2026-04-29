import { useState, useEffect } from 'react'
import { Card, Typography, Row, Col, Statistic, message } from 'antd'
import { 
  CheckCircleOutlined,
  TruckOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { salesApi } from '../api'
import dayjs from 'dayjs'

const { Title } = Typography

export const Dashboard = () => {
  const [todayStats, setTodayStats] = useState({
    ordered: 0,
    ready: 0,
    delivered: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTodayStats = async () => {
      try {
        const today = dayjs().format('YYYY-MM-DD')
        const sales = await salesApi.getAll().catch(() => [])

        // Filter sales created today
        const todaySales = Array.isArray(sales) 
          ? sales.filter((sale: any) => dayjs(sale.created_at).format('YYYY-MM-DD') === today)
          : []

        // Count by stage
        const ordered = todaySales.filter((sale: any) => sale.stage === 'ordered').length
        const ready = todaySales.filter((sale: any) => sale.stage === 'ready').length
        const delivered = todaySales.filter((sale: any) => sale.stage === 'delivered').length

        setTodayStats({ ordered, ready, delivered })
      } catch (error) {
        message.error('Ошибка при загрузке статистики заказов')
      } finally {
        setLoading(false)
      }
    }

    fetchTodayStats()
  }, [])

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>Главная</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Заказано сегодня"
              value={todayStats.ordered}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Готово сегодня"
              value={todayStats.ready}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Доставлено сегодня"
              value={todayStats.delivered}
              prefix={<TruckOutlined />}
              valueStyle={{ color: '#722ed1' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
