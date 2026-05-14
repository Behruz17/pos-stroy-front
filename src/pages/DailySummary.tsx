import { useEffect, useState } from 'react';
import { Typography, Card, message, DatePicker, Button, Statistic, Row, Col, Spin, Tag, InputNumber, Space, Divider, Tabs, Table, Select, Alert, Grid } from 'antd';
import { useTranslation } from 'react-i18next';
import { 
  DollarOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  WalletOutlined,
  SaveOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { 
  reportsApi, 
  userCashflowApi, 
  usersApi,
  type DailyBalance,
  type UserCashflowResponse,
  type UserCashflowFilters,
  type CashflowOperation,
  getUser,
  type User
} from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

export const DailySummaryPage = () => {
  const { t } = useTranslation();
  
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [usdRate, setUsdRate] = useState<number>(10.5);
  const [dailyData, setDailyData] = useState<DailyBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fromCache, setFromCache] = useState<boolean | undefined>(undefined);
  
  // States for cashflow tab
  const [cashflowData, setCashflowData] = useState<UserCashflowResponse | null>(null);
  const [cashflowLoading, setCashflowLoading] = useState(false);
  const [cashflowError, setCashflowError] = useState<string | null>(null);
  const [cashflowFilters, setCashflowFilters] = useState<UserCashflowFilters>({});
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('summary');
  const screens = useBreakpoint();
  
  const currentUser = getUser();
  const isAdmin = currentUser?.role === 'ADMIN';
  
  const fetchDailySummary = async (forceRecalculate = false) => {
    setLoading(true);
    try {
      const date = selectedDate.format('YYYY-MM-DD');
      const data = await reportsApi.getDailyBalance(date, usdRate, forceRecalculate);
      setDailyData(data);
      setFromCache(data.from_cache);
    } catch (error) {
      message.error(t('dailySummary.errorLoading', { defaultValue: 'Ошибка при загрузке итога дня' }));
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveDailyBalance = async () => {
    setSaving(true);
    try {
      const date = selectedDate.format('YYYY-MM-DD');
      const response = await reportsApi.saveDailyBalance({ date, usd_rate: usdRate });
      message.success(t('dailySummary.savedSuccess', { defaultValue: 'Итог дня сохранен' }));
      setDailyData(response.data);
      setFromCache(true);
    } catch (error) {
      message.error(t('dailySummary.errorSaving', { defaultValue: 'Ошибка при сохранении' }));
    } finally {
      setSaving(false);
    }
  };
  
  useEffect(() => {
    fetchDailySummary();
  }, [selectedDate, usdRate]);
  
  // Initialize cashflow filters with current date
  useEffect(() => {
    const today = dayjs();
    setCashflowFilters({
      start_date: today.format('YYYY-MM-DD'),
      end_date: today.format('YYYY-MM-DD')
    });
  }, []);
  
  // Fetch cashflow data when tab changes to cashflow
  useEffect(() => {
    if (activeTab === 'cashflow') {
      fetchCashflowData();
      fetchUsers();
    }
  }, [activeTab]);
  
  const fetchCashflowData = async (currentFilters?: UserCashflowFilters) => {
    setCashflowLoading(true);
    setCashflowError(null);
    
    const filtersToUse = currentFilters || cashflowFilters;
    
    try {
      const response = await userCashflowApi.getUserCashflow(filtersToUse);
      setCashflowData(response);
    } catch (err: any) {
      setCashflowError(err.response?.data?.message || 'Failed to fetch cashflow data');
    } finally {
      setCashflowLoading(false);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const usersList = await usersApi.getAll();
      setUsers(usersList);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
    }
  };
  
  const handleCashflowUserChange = (userId: number | undefined) => {
    const newFilters = {
      ...cashflowFilters,
      created_by: userId
    };
    setCashflowFilters(newFilters);
    fetchCashflowData(newFilters);
  };
  
  const formatAmount = (amount: number | string, flowType: 'income' | 'expense') => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const prefix = flowType === 'income' ? '+' : '-';
    const color = flowType === 'income' ? '#52c41a' : '#ff4d4f';
    return (
      <span style={{ color, fontWeight: 'bold' }}>
        {prefix}{numericAmount.toFixed(2)}
      </span>
    );
  };
  
  const getOperationTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      sale: 'blue',
      customer_payment: 'green',
      return: 'orange',
      expense: 'red',
      supplier_payment: 'purple'
    };
    return colors[type] || 'default';
  };
  
  const operationColumns = [
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getOperationTypeColor(type)}>
          {type === 'sale' ? 'Продажа' :
           type === 'customer_payment' ? 'Платеж клиента' :
           type === 'return' ? 'Возврат' :
           type === 'expense' ? 'Расход' :
           type === 'supplier_payment' ? 'Платеж поставщику' : type}
        </Tag>
      ),
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number | string, record: CashflowOperation) => 
        formatAmount(amount, record.flow_type),
    },
    {
      title: 'Контрагент',
      dataIndex: 'counterpart_name',
      key: 'counterpart_name',
      render: (name: string | null) => name || '-',
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Дата',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
  ];
  
  const formatCurrency = (value: number) => {
    return Number(value || 0).toLocaleString('ru-RU', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };
  
  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
        {t('dailySummary.title', { defaultValue: 'Итог дня' })}
      </Title>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="Итоги дня" key="summary">
          {/* Filters */}
          <Card style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
                <div>
                  <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                    {t('dailySummary.date', { defaultValue: 'Дата' })}
                  </div>
                  <DatePicker
                    value={selectedDate}
                    onChange={(date) => date && setSelectedDate(date)}
                    format="DD.MM.YYYY"
                    style={{ minWidth: 140 }}
                  />
                </div>
                
                <div>
                  <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                    {t('dailySummary.usdRate', { defaultValue: 'Курс USD' })}
                  </div>
                  <InputNumber
                    value={usdRate}
                    onChange={(value) => setUsdRate(value || 1)}
                    min={0.01}
                    step={0.1}
                    precision={4}
                    style={{ width: 120 }}
                    prefix="$"
                  />
                </div>
                
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />} 
                  onClick={() => fetchDailySummary(true)}
                  loading={loading}
                >
                  {t('dailySummary.recalculate', { defaultValue: 'Пересчитать' })}
                </Button>
                
                <Button 
                  type="default" 
                  icon={<SaveOutlined />} 
                  onClick={handleSaveDailyBalance}
                  loading={saving}
                  disabled={!dailyData}
                >
                  {t('dailySummary.save', { defaultValue: 'Сохранить' })}
                </Button>
              </div>
              
              {fromCache !== undefined && (
                <Tag color={fromCache ? 'blue' : 'orange'}>
                  {fromCache 
                    ? t('dailySummary.fromCache', { defaultValue: 'Из кэша' })
                    : t('dailySummary.calculated', { defaultValue: 'Рассчитано' })
                  }
                </Tag>
              )}
            </Space>
          </Card>
          
          <Spin spinning={loading}>
            {dailyData && (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={12} lg={8}>
                    <Card>
                      <Statistic
                        title={t('dailySummary.income', { defaultValue: 'Доходы' })}
                        value={dailyData.income}
                        precision={2}
                        prefix={<ArrowUpOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                        formatter={(value) => formatCurrency(Number(value))}
                        suffix="TJS"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card>
                      <Statistic
                        title={t('dailySummary.expense', { defaultValue: 'Расходы' })}
                        value={dailyData.expense}
                        precision={2}
                        prefix={<ArrowDownOutlined />}
                        valueStyle={{ color: '#ff4d4f' }}
                        formatter={(value) => formatCurrency(Number(value))}
                        suffix="TJS"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card>
                      <Statistic
                        title={t('dailySummary.balance', { defaultValue: 'Баланс' })}
                        value={dailyData.balance}
                        precision={2}
                        prefix={<WalletOutlined />}
                        valueStyle={{ color: dailyData.balance >= 0 ? '#52c41a' : '#ff4d4f' }}
                        formatter={(value) => formatCurrency(Number(value))}
                        suffix="TJS"
                      />
                    </Card>
                  </Col>
                </Row>
                
                <Card title={t('dailySummary.usdConversion', { defaultValue: 'Конвертация в USD' })}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <Statistic
                        title={t('dailySummary.balanceUsd', { defaultValue: 'Баланс в USD' })}
                        value={dailyData.balance_usd}
                        precision={2}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                        formatter={(value) => formatCurrency(Number(value))}
                        suffix="USD"
                      />
                    </Col>
                    <Col xs={24} sm={12}>
                      <div style={{ padding: '8px 0' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                          {t('dailySummary.usedRate', { defaultValue: 'Использованный курс' })}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                          1 USD = {dailyData.usd_rate} TJS
                        </div>
                      </div>
                    </Col>
                  </Row>
                  <Divider />
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {t('dailySummary.calculationFormula', { defaultValue: 'Формула: Баланс / Курс USD = Баланс USD' })}
                    <br />
                    {formatCurrency(dailyData.balance)} / {dailyData.usd_rate} = {formatCurrency(dailyData.balance_usd)} USD
                  </div>
                </Card>
              </>
            )}
          </Spin>
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="Денежные потоки" key="cashflow">
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 0]} align="middle">
              <Col>
                <span style={{ fontWeight: 'bold' }}>Период:</span>
              </Col>
              <Col>
                <RangePicker
                  value={[dayjs(cashflowFilters.start_date), dayjs(cashflowFilters.end_date)]}
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      const newFilters = {
                        ...cashflowFilters,
                        start_date: dates[0].format('YYYY-MM-DD'),
                        end_date: dates[1].format('YYYY-MM-DD')
                      };
                      setCashflowFilters(newFilters);
                      fetchCashflowData(newFilters);
                    }
                  }}
                  format="DD.MM.YYYY"
                  style={{ width: screens.md ? 240 : 200 }}
                />
              </Col>
              <Col>
                <span style={{ fontWeight: 'bold' }}>Пользователь:</span>
              </Col>
              <Col>
                <Select
                  value={cashflowFilters.created_by}
                  onChange={handleCashflowUserChange}
                  placeholder="Все пользователи"
                  style={{ width: screens.md ? 200 : 150 }}
                  allowClear
                >
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.name}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />} 
                  onClick={() => fetchCashflowData()}
                  loading={cashflowLoading}
                >
                  Применить
                </Button>
              </Col>
              <Col>
                <Button onClick={() => {
                  const today = dayjs();
                  const newFilters = {
                    start_date: today.format('YYYY-MM-DD'),
                    end_date: today.format('YYYY-MM-DD'),
                    created_by: undefined
                  };
                  setCashflowFilters(newFilters);
                  fetchCashflowData(newFilters);
                }}>
                  Сбросить
                </Button>
              </Col>
            </Row>
          </Card>
          
          {cashflowError && (
            <Alert
              message="Ошибка"
              description={cashflowError}
              type="error"
              style={{ marginBottom: 16 }}
              closable
              onClose={() => setCashflowError(null)}
            />
          )}
          
          <Spin spinning={cashflowLoading}>
            {cashflowData && (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={12} sm={6}>
                    <Card>
                      <Statistic
                        title="Доходы"
                        value={typeof cashflowData.summary.total_income === 'string' ? parseFloat(cashflowData.summary.total_income) : cashflowData.summary.total_income}
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
                        value={typeof cashflowData.summary.total_expenses === 'string' ? parseFloat(cashflowData.summary.total_expenses) : cashflowData.summary.total_expenses}
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
                        value={typeof cashflowData.summary.net_cashflow === 'string' ? parseFloat(cashflowData.summary.net_cashflow) : cashflowData.summary.net_cashflow}
                        precision={2}
                        valueStyle={{ color: '#1890ff' }}
                        prefix={<DollarOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card>
                      <Statistic
                        title="Операций"
                        value={cashflowData.summary.operations_count}
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Card>
                  </Col>
                </Row>
                
                {/* User Summary - только для админов */}
                {isAdmin && cashflowData.users_summary && cashflowData.users_summary.length > 0 && (
                  <Card title="Итоги по пользователям" style={{ marginBottom: 16 }}>
                    <Table
                      columns={[
                        {
                          title: 'Пользователь',
                          dataIndex: 'name',
                          key: 'name',
                        },
                        {
                          title: 'Доходы',
                          dataIndex: 'total_income',
                          key: 'total_income',
                          render: (amount: number | string) => (
                            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                              +{typeof amount === 'string' ? parseFloat(amount) : amount?.toFixed(2)}
                            </span>
                          ),
                        },
                        {
                          title: 'Расходы',
                          dataIndex: 'total_expenses',
                          key: 'total_expenses',
                          render: (amount: number | string) => (
                            <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                              -{typeof amount === 'string' ? parseFloat(amount) : amount?.toFixed(2)}
                            </span>
                          ),
                        },
                        {
                          title: 'Чистый поток',
                          dataIndex: 'net_cashflow',
                          key: 'net_cashflow',
                          render: (amount: number | string) => {
                            const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
                            const color = numericAmount >= 0 ? '#52c41a' : '#ff4d4f';
                            return (
                              <span style={{ color, fontWeight: 'bold' }}>
                                {numericAmount >= 0 ? '+' : ''}{numericAmount.toFixed(2)}
                              </span>
                            );
                          },
                        },
                      ]}
                      dataSource={cashflowData.users_summary}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  </Card>
                )}
                
                <Card title="Операции">
                  <Table
                    columns={operationColumns}
                    dataSource={cashflowData.operations}
                    rowKey="id"
                    loading={cashflowLoading}
                    pagination={false}
                  />
                </Card>
              </>
            )}
          </Spin>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};
