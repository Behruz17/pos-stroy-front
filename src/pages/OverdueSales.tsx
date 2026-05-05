import { useEffect, useState } from 'react';
import { Table, Typography, Card, message, Tabs, Statistic, Row, Col, type TableProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { CalendarOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';
import { salesApi, type OverdueSale, type OverdueSalesSummary, type OverdueSaleByCustomer } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface OverdueSalesProps {}

export const OverdueSales: React.FC<OverdueSalesProps> = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [overdueSales, setOverdueSales] = useState<OverdueSale[]>([]);
  const [summary, setSummary] = useState<OverdueSalesSummary | null>(null);
  const [overdueByCustomer, setOverdueByCustomer] = useState<OverdueSaleByCustomer[]>([]);
  const [activeTab, setActiveTab] = useState('list');

  const fetchOverdueSales = async () => {
    setLoading(true);
    try {
      const data = await salesApi.getOverdueSales();
      setOverdueSales(data);
    } catch (error: unknown) {
      message.error(t('sales.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await salesApi.getOverdueSalesSummary();
      setSummary(data);
    } catch (error: unknown) {
      message.error(t('sales.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdueByCustomer = async () => {
    setLoading(true);
    try {
      const data = await salesApi.getOverdueSalesByCustomer();
      setOverdueByCustomer(data);
    } catch (error: unknown) {
      message.error(t('sales.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetchOverdueSales();
    } else if (activeTab === 'summary') {
      fetchSummary();
    } else if (activeTab === 'by-customer') {
      fetchOverdueByCustomer();
    }
  }, [activeTab]);

  const listColumns: TableProps<OverdueSale>['columns'] = [
    {
      title: '№',
      key: 'rowNumber',
      width: 60,
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: t('common.customer'),
      dataIndex: 'customer_name',
      key: 'customer_name',
      ellipsis: true,
    },
    {
      title: t('common.totalAmount'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => (
        <span style={{ color: '#ff4d4f' }}>
          <DollarOutlined style={{ marginRight: 4 }} />
          {amount.toLocaleString()}
        </span>
      ),
    },
    {
      title: t('sales.discount', { defaultValue: 'Скидка' }),
      dataIndex: 'discount',
      key: 'discount',
      render: (discount: number) => {
        if (discount > 0) {
          return (
            <span style={{ color: '#ff4d4f' }}>
              <DollarOutlined style={{ marginRight: 4 }} />
              {discount.toLocaleString()}
            </span>
          );
        }
        return '-';
      },
    },
    {
      title: t('sales.debtDeadline', { defaultValue: 'Срок долга' }),
      dataIndex: 'debt_deadline',
      key: 'debt_deadline',
      render: (date: string) => {
        const deadline = dayjs(date);
        const now = dayjs();
        const daysOverdue = now.diff(deadline, 'day');
        return (
          <span style={{ color: daysOverdue > 0 ? '#ff4d4f' : '#52c41a' }}>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {deadline.format('DD.MM.YYYY')}
            {daysOverdue > 0 && (
              <Text style={{ marginLeft: 8, color: '#ff4d4f' }}>
                (+{daysOverdue} {t('common.days', { defaultValue: 'дней' })})
              </Text>
            )}
          </span>
        );
      },
    },
    {
      title: t('common.date'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const byCustomerColumns: TableProps<OverdueSaleByCustomer>['columns'] = [
    {
      title: '№',
      key: 'rowNumber',
      width: 60,
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: t('common.customer'),
      dataIndex: 'customer_name',
      key: 'customer_name',
      ellipsis: true,
    },
    {
      title: t('customers.phone'),
      dataIndex: 'phone',
      key: 'phone',
      ellipsis: true,
    },
    {
      title: t('sales.overdueSalesCount', { defaultValue: 'Кол-во просрочек' }),
      dataIndex: 'overdue_sales_count',
      key: 'overdue_sales_count',
      width: 120,
    },
    {
      title: t('sales.totalOverdueAmount', { defaultValue: 'Общая сумма долга' }),
      dataIndex: 'total_overdue_amount',
      key: 'total_overdue_amount',
      render: (amount: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          <DollarOutlined style={{ marginRight: 4 }} />
          {amount.toLocaleString()}
        </span>
      ),
    },
    {
      title: t('sales.avgDaysOverdue', { defaultValue: 'Сред. дней просрочки' }),
      dataIndex: 'avg_days_overdue',
      key: 'avg_days_overdue',
      width: 120,
      render: (days: number) => (
        <span style={{ color: days > 10 ? '#ff4d4f' : days > 5 ? '#faad14' : '#52c41a' }}>
          {days.toFixed(1)} {t('common.days', { defaultValue: 'дней' })}
        </span>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'list',
      label: (
        <span>
          <CalendarOutlined />
          {t('sales.overdueSalesList', { defaultValue: 'Список просрочек' })}
        </span>
      ),
      children: (
        <div>
          <Table
            columns={listColumns}
            dataSource={overdueSales}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            size="small"
            onRow={(record) => ({
              onClick: () => {
                window.open(`/overdue-sales/${record.id}`, '_blank');
              },
              style: { cursor: 'pointer' }
            })}
          />
        </div>
      ),
    },
    {
      key: 'summary',
      label: (
        <span>
          <DollarOutlined />
          {t('sales.overdueSummary', { defaultValue: 'Сводка по долгам' })}
        </span>
      ),
      children: (
        <div>
          {summary ? (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title={t('sales.totalOverdueSales', { defaultValue: 'Всего просрочек' })}
                    value={summary.total_overdue_sales}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title={t('sales.totalOverdueAmount', { defaultValue: 'Общая сумма долга' })}
                    value={summary.total_overdue_amount}
                    precision={2}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<DollarOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title={t('sales.customersWithDebt', { defaultValue: 'Клиентов с долгами' })}
                    value={summary.customers_with_debt}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title={t('sales.avgDaysOverdue', { defaultValue: 'Сред. дней просрочки' })}
                    value={summary.avg_days_overdue}
                    precision={1}
                    valueStyle={{ color: summary.avg_days_overdue > 10 ? '#ff4d4f' : '#faad14' }}
                  />
                </Card>
              </Col>
            </Row>
          ) : (
            <div style={{ textAlign: 'center', padding: 20 }}>
              {t('common.loading')}...
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'by-customer',
      label: (
        <span>
          <UserOutlined />
          {t('sales.overdueByCustomer', { defaultValue: 'По клиентам' })}
        </span>
      ),
      children: (
        <div>
          <Table
            columns={byCustomerColumns}
            dataSource={overdueByCustomer}
            rowKey="customer_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            size="small"
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
        {t('sales.overdueSalesTitle', { defaultValue: 'Просроченные продажи' })}
      </Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </div>
  );
};
