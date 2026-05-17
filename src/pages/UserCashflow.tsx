import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  DatePicker, 
  Select, 
  Button, 
  Statistic, 
  Row, 
  Col, 
  Tag, 
  Typography, 
  Alert,
  Spin,
  Divider,
  Grid
} from 'antd';
import { 
  ReloadOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  DollarOutlined 
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { 
  userCashflowApi, 
  usersApi,
  type UserCashflowResponse, 
  type UserCashflowFilters,
  type CashflowOperation,
  getUser,
  type User
} from '../api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { useBreakpoint } = Grid;

export const UserCashflow: React.FC = () => {
  const [data, setData] = useState<UserCashflowResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserCashflowFilters>({
    start_date: dayjs().format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD')
  });
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([dayjs(), dayjs()]);
  const [users, setUsers] = useState<User[]>([]);
  const screens = useBreakpoint();

  const currentUser = getUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  useEffect(() => {
    fetchData();
    if (isAdmin) {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const usersList = await usersApi.getAll();
      setUsers(usersList);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchData = async (currentFilters?: UserCashflowFilters) => {
    setLoading(true);
    setError(null);
    
    const filtersToUse = currentFilters || filters;
    console.log('Fetching data with filters:', filtersToUse);
    
    try {
      const response = await userCashflowApi.getUserCashflow(filtersToUse);
      console.log('API response:', response);
      setData(response);
    } catch (err: any) {
      console.error('API error:', err);
      setError(err.response?.data?.message || 'Failed to fetch cashflow data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates) {
      setDateRange(dates);
      const newFilters = {
        ...filters,
        start_date: dates[0]?.format('YYYY-MM-DD') || undefined,
        end_date: dates[1]?.format('YYYY-MM-DD') || undefined
      };
      console.log('Date filters updated:', newFilters);
      setFilters(newFilters);
      // Автоматически загружаем данные при изменении даты
      fetchData(newFilters);
    } else {
      setDateRange([null, null]);
      const newFilters = {
        ...filters,
        start_date: undefined,
        end_date: undefined
      };
      console.log('Date filters cleared:', newFilters);
      setFilters(newFilters);
      // Автоматически загружаем данные при очистке даты
      fetchData(newFilters);
    }
  };

  const handleUserChange = (userId: number | undefined) => {
    console.log('Selected user ID:', userId);
    const newFilters = {
      ...filters,
      created_by: userId
    };
    console.log('New filters:', newFilters);
    setFilters(newFilters);
    // Автоматически загружаем данные при изменении пользователя
    fetchData(newFilters);
  };

  const applyFilters = () => {
    fetchData();
  };

  const resetFilters = () => {
    const today = dayjs();
    setFilters({
      start_date: today.format('YYYY-MM-DD'),
      end_date: today.format('YYYY-MM-DD')
    });
    setDateRange([today, today]);
    setTimeout(fetchData, 0);
  };

  const getOperationTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      sale: 'blue',
      customer_payment: 'green',
      debtor_returned: 'cyan',
      return: 'orange',
      expense: 'red',
      supplier_payment: 'purple',
      debtor_borrowed: 'magenta',
      salary_payment: 'volcano'
    };
    return colors[type] || 'default';
  };

  const getOperationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sale: 'Продажа',
      customer_payment: 'Оплата клиента',
      debtor_returned: 'Возврат должника',
      return: 'Возврат',
      expense: 'Расход',
      supplier_payment: 'Оплата поставщику',
      debtor_borrowed: 'Выдача должнику',
      salary_payment: 'Выплата зарплаты'
    };
    return labels[type] || type;
  };

  const formatAmount = (amount: number | string, flowType: 'income' | 'expense') => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const prefix = flowType === 'income' ? '+' : '-';
    const color = flowType === 'income' ? '#52c41a' : '#ff4d4f';
    return (
      <Text strong style={{ color }}>
        {prefix}{numericAmount.toFixed(2)}
      </Text>
    );
  };

  const operationColumns = [
    {
      title: 'Дата',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
      width: screens.md ? 150 : 120,
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getOperationTypeColor(type)}>
          {getOperationTypeLabel(type)}
        </Tag>
      ),
      width: screens.md ? 140 : 120,
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Контрагент',
      dataIndex: 'counterpart_name',
      key: 'counterpart_name',
      render: (name: string | null) => name || '-',
      width: screens.md ? 150 : 120,
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number | string, record: CashflowOperation) => 
        formatAmount(amount, record.flow_type),
      align: 'right' as const,
      width: screens.md ? 120 : 100,
    },
  ];

  const userSummaryColumns = [
    {
      title: 'Пользователь',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Доходы',
      dataIndex: 'total_income',
      key: 'total_income',
      render: (amount: number | string) => {
        const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return (
          <Text style={{ color: '#52c41a' }}>+{numericAmount.toFixed(2)}</Text>
        );
      },
      align: 'right' as const,
    },
    {
      title: 'Расходы',
      dataIndex: 'total_expenses',
      key: 'total_expenses',
      render: (amount: number | string) => {
        const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return (
          <Text style={{ color: '#ff4d4f' }}>-{numericAmount.toFixed(2)}</Text>
        );
      },
      align: 'right' as const,
    },
    {
      title: 'Чистый поток',
      dataIndex: 'net_cashflow',
      key: 'net_cashflow',
      render: (amount: number | string) => {
        const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const color = numericAmount >= 0 ? '#52c41a' : '#ff4d4f';
        const prefix = numericAmount >= 0 ? '+' : '';
        return (
          <Text strong style={{ color }}>
            {prefix}{numericAmount.toFixed(2)}
          </Text>
        );
      },
      align: 'right' as const,
    },
  ];

  return (
    <div style={{ padding: screens.md ? '24px' : '16px' }}>
      <Title level={screens.md ? 2 : 3} style={{ marginBottom: screens.md ? '24px' : '16px' }}>
        Итоги
      </Title>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 0]} align="middle">
          <Col>
            <Text strong>Период:</Text>
          </Col>
          <Col>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              format="DD.MM.YYYY"
              style={{ width: screens.md ? '240px' : '200px' }}
            />
          </Col>
          
          {isAdmin && (
            <>
              <Col>
                <Text strong>Пользователь:</Text>
              </Col>
              <Col>
                <Select
                  value={filters.created_by}
                  onChange={handleUserChange}
                  placeholder="Все пользователи"
                  style={{ width: screens.md ? '200px' : '150px' }}
                  allowClear
                >
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.name}
                    </Option>
                  ))}
                </Select>
              </Col>
            </>
          )}
          
          <Col>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={applyFilters}
              loading={loading}
            >
              Применить
            </Button>
          </Col>
          
          <Col>
            <Button onClick={resetFilters}>
              Сбросить
            </Button>
          </Col>
        </Row>
      </Card>

      {error && (
        <Alert
          message="Ошибка"
          description={error}
          type="error"
          style={{ marginBottom: '16px' }}
          closable
          onClose={() => setError(null)}
        />
      )}

      {loading && !data ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Доходы"
                  value={typeof data.summary.total_income === 'string' ? parseFloat(data.summary.total_income) : data.summary.total_income}
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<ArrowUpOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Расходы"
                  value={typeof data.summary.total_expenses === 'string' ? parseFloat(data.summary.total_expenses) : data.summary.total_expenses}
                  precision={2}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<ArrowDownOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Чистый поток"
                  value={typeof data.summary.net_cashflow === 'string' ? parseFloat(data.summary.net_cashflow) : data.summary.net_cashflow}
                  precision={2}
                  valueStyle={{ 
                    color: (typeof data.summary.net_cashflow === 'string' ? parseFloat(data.summary.net_cashflow) : data.summary.net_cashflow) >= 0 ? '#52c41a' : '#ff4d4f' 
                  }}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Операций"
                  value={data.summary.operations_count}
                  prefix="#"
                />
              </Card>
            </Col>
          </Row>

          {/* Users Summary (Admin only) */}
          {isAdmin && data.users_summary && data.users_summary.length > 0 && (
            <>
              <Title level={4} style={{ marginBottom: '16px' }}>
                Сводка по пользователям
              </Title>
              <Card style={{ marginBottom: '16px' }}>
                <Table
                  columns={userSummaryColumns}
                  dataSource={data.users_summary}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: screens.md ? undefined : 'max-content' }}
                />
              </Card>
              <Divider />
            </>
          )}

          {/* Operations Table */}
          <Title level={4} style={{ marginBottom: '16px' }}>
            Операции
          </Title>
          <Card>
            <Table
              columns={operationColumns}
              dataSource={data.operations}
              rowKey={(record) => `${record.type}-${record.id}`}
              loading={loading}
              scroll={{ x: screens.md ? undefined : 'max-content' }}
              pagination={false}
            />
          </Card>
        </>
      ) : null}
    </div>
  );
};
