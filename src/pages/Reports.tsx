import { useEffect, useState } from 'react';
import { Typography, Card, message, Tabs, DatePicker, Button, Table, Tag, Spin, Statistic, Row, Col, Select, Space, Collapse } from 'antd';
import { useTranslation } from 'react-i18next';
import { 
  PieChartOutlined, 
  ShoppingCartOutlined, 
  ImportOutlined, 
  DollarOutlined,
  FilterOutlined,
  UserOutlined,
  ShopOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { 
  reportsApi, 
  customersApi,
  suppliersApi,
  type GeneralReportResponse,
  type SalesReportResponse,
  type ArrivalsReportResponse,
  type ExpensesReportResponse,
  type Customer,
  type Supplier
} from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Panel } = Collapse;

export const Reports = () => {
  const { t } = useTranslation();
  
  // Date range state
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  
  // General report state
  const [generalReport, setGeneralReport] = useState<GeneralReportResponse | null>(null);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  
  // Sales report state
  const [salesReport, setSalesReport] = useState<SalesReportResponse | null>(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<number | undefined>();
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<'PAID' | 'DEBT' | undefined>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Arrivals report state
  const [arrivalsReport, setArrivalsReport] = useState<ArrivalsReportResponse | null>(null);
  const [loadingArrivals, setLoadingArrivals] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<number | undefined>();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Expenses report state
  const [expensesReport, setExpensesReport] = useState<ExpensesReportResponse | null>(null);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  
  // Active tab
  const [activeTab, setActiveTab] = useState('general');
  
  const fetchCustomers = async () => {
    try {
      const data = await customersApi.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };
  
  const fetchSuppliers = async () => {
    try {
      const data = await suppliersApi.getAll();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };
  
  const fetchGeneralReport = async () => {
    setLoadingGeneral(true);
    try {
      const params = {
        start_date: dateRange[0]?.format('YYYY-MM-DD'),
        end_date: dateRange[1]?.format('YYYY-MM-DD'),
      };
      const data = await reportsApi.getGeneral(params);
      setGeneralReport(data);
    } catch (error) {
      message.error(t('reports.errorLoadingGeneral', { defaultValue: 'Ошибка при загрузке общего отчета' }));
    } finally {
      setLoadingGeneral(false);
    }
  };
  
  const fetchSalesReport = async () => {
    setLoadingSales(true);
    try {
      const params = {
        start_date: dateRange[0]?.format('YYYY-MM-DD'),
        end_date: dateRange[1]?.format('YYYY-MM-DD'),
        customer_id: selectedCustomer,
        payment_status: selectedPaymentStatus,
      };
      const data = await reportsApi.getSales(params);
      setSalesReport(data);
    } catch (error) {
      message.error(t('reports.errorLoadingSales', { defaultValue: 'Ошибка при загрузке отчета по продажам' }));
    } finally {
      setLoadingSales(false);
    }
  };
  
  const fetchArrivalsReport = async () => {
    setLoadingArrivals(true);
    try {
      const params = {
        start_date: dateRange[0]?.format('YYYY-MM-DD'),
        end_date: dateRange[1]?.format('YYYY-MM-DD'),
        supplier_id: selectedSupplier,
      };
      const data = await reportsApi.getArrivals(params);
      setArrivalsReport(data);
    } catch (error) {
      message.error(t('reports.errorLoadingArrivals', { defaultValue: 'Ошибка при загрузке отчета по поступлениям' }));
    } finally {
      setLoadingArrivals(false);
    }
  };
  
  const fetchExpensesReport = async () => {
    setLoadingExpenses(true);
    try {
      const params = {
        start_date: dateRange[0]?.format('YYYY-MM-DD'),
        end_date: dateRange[1]?.format('YYYY-MM-DD'),
      };
      const data = await reportsApi.getExpenses(params);
      setExpensesReport(data);
    } catch (error) {
      message.error(t('reports.errorLoadingExpenses', { defaultValue: 'Ошибка при загрузке отчета по расходам' }));
    } finally {
      setLoadingExpenses(false);
    }
  };
  
  const handleApplyFilters = () => {
    switch (activeTab) {
      case 'general':
        fetchGeneralReport();
        break;
      case 'sales':
        fetchSalesReport();
        break;
      case 'arrivals':
        fetchArrivalsReport();
        break;
      case 'expenses':
        fetchExpensesReport();
        break;
    }
  };
  
  useEffect(() => {
    fetchCustomers();
    fetchSuppliers();
    fetchGeneralReport();
  }, []);
  
  useEffect(() => {
    if (activeTab === 'sales') fetchSalesReport();
    if (activeTab === 'arrivals') fetchArrivalsReport();
    if (activeTab === 'expenses') fetchExpensesReport();
  }, [activeTab]);
  
  const formatCurrency = (value: number | string) => {
    return Number(value || 0).toLocaleString('ru-RU', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };
  
  // Sales table columns
  const salesColumns: any[] = [
    {
      title: t('common.id'),
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: t('common.date'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
      responsive: ['md'],
    },
    {
      title: t('common.customer'),
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: t('common.amount'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: string) => <strong>{formatCurrency(amount)}</strong>,
    },
    {
      title: t('sales.discount', { defaultValue: 'Скидка' }),
      dataIndex: 'discount',
      key: 'discount',
      render: (discount: string) => <span style={{ color: '#ff4d4f' }}>{formatCurrency(discount)}</span>,
    },
    {
      title: t('reports.profit', { defaultValue: 'Прибыль' }),
      dataIndex: 'total_profit',
      key: 'total_profit',
      render: (profit: number) => (
        <strong style={{ color: profit >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {formatCurrency(profit)}
        </strong>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status: string) => (
        <Tag color={status === 'PAID' ? 'green' : status === 'PARTIAL' ? 'blue' : 'red'}>
          {status === 'PAID' ? t('sales.paid', { defaultValue: 'Оплачено' }) : status === 'PARTIAL' ? t('sales.partial', { defaultValue: 'Частично' }) : t('sales.debt', { defaultValue: 'Долг' })}
        </Tag>
      ),
    },
    {
      title: t('common.items'),
      key: 'items',
      render: (_: any, record: any) => (
        <Collapse ghost size="small">
          <Panel header={`${record.items?.length || 0} ${t('common.items', { defaultValue: 'товаров' })}`} key="1">
            {record.items?.map((item: any, idx: number) => (
              <div key={idx} style={{ padding: '4px 0', fontSize: 12 }}>
                <div>{item.product_name} — {item.quantity} × {formatCurrency(item.unit_price)} = {formatCurrency(item.total_price)}</div>
                <div style={{ color: '#666', fontSize: 11 }}>
                  {t('reports.purchaseCost', { defaultValue: 'Закупка' })}: {formatCurrency(item.purchase_cost_tjs)} {item.currency !== 'TJS' && `(${item.currency} ${formatCurrency(item.purchase_cost_original)} × ${item.exchange_rate})`} | {t('reports.unitProfit', { defaultValue: 'Прибыль/ед' })}: {formatCurrency(item.unit_profit)} | {t('reports.itemProfit', { defaultValue: 'Прибыль' })}: {formatCurrency(item.total_profit)}
                </div>
              </div>
            ))}
          </Panel>
        </Collapse>
      ),
    },
  ];
  
  // Arrivals table columns
  const arrivalsColumns: any[] = [
    {
      title: t('common.id'),
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: t('common.date'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
      responsive: ['md'],
    },
    {
      title: t('common.supplier'),
      dataIndex: 'supplier_name',
      key: 'supplier_name',
    },
    {
      title: t('common.amount'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: string, record: any) => (
        <div>
          <strong>{formatCurrency(amount)}</strong>
          <Tag style={{ marginLeft: 4 }}>{record.currency}</Tag>
        </div>
      ),
    },
    {
      title: t('common.items'),
      key: 'items',
      render: (_: any, record: any) => (
        <Collapse ghost size="small">
          <Panel header={`${record.items?.length || 0} ${t('common.items', { defaultValue: 'товаров' })}`} key="1">
            {record.items?.map((item: any, idx: number) => (
              <div key={idx} style={{ padding: '4px 0', fontSize: 12 }}>
                {item.product_name} — {item.quantity} × {formatCurrency(item.purchase_cost)}
              </div>
            ))}
          </Panel>
        </Collapse>
      ),
    },
  ];
  
  // Expenses table columns
  const expensesColumns: any[] = [
    {
      title: t('common.id'),
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: t('common.date'),
      dataIndex: 'expense_date',
      key: 'expense_date',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('common.amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string) => <strong>{formatCurrency(amount)}</strong>,
    },
    {
      title: t('common.createdBy'),
      dataIndex: 'created_by_name',
      key: 'created_by_name',
      responsive: ['md'],
    },
  ];
  
  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
        {t('reports.title', { defaultValue: 'Отчеты' })}
      </Title>
      
      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                {t('reports.period', { defaultValue: 'Период' })}
              </div>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates || [null, null])}
                format="DD.MM.YYYY"
                style={{ minWidth: 200 }}
              />
            </div>
            
            {activeTab === 'sales' && (
              <>
                <Select
                  placeholder={t('reports.filterByCustomer', { defaultValue: 'Фильтр по клиенту' })}
                  allowClear
                  style={{ minWidth: 180 }}
                  value={selectedCustomer}
                  onChange={setSelectedCustomer}
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {customers.map(c => (
                    <Select.Option key={c.id} value={c.id}>{c.full_name}</Select.Option>
                  ))}
                </Select>
                <Select
                  placeholder={t('reports.filterByStatus', { defaultValue: 'Статус оплаты' })}
                  allowClear
                  style={{ minWidth: 140 }}
                  value={selectedPaymentStatus}
                  onChange={setSelectedPaymentStatus}
                >
                  <Select.Option value="PAID">{t('sales.paid', { defaultValue: 'Оплачено' })}</Select.Option>
                  <Select.Option value="DEBT">{t('sales.debt', { defaultValue: 'Долг' })}</Select.Option>
                </Select>
              </>
            )}
            
            {activeTab === 'arrivals' && (
              <Select
                placeholder={t('reports.filterBySupplier', { defaultValue: 'Фильтр по поставщику' })}
                allowClear
                style={{ minWidth: 180 }}
                value={selectedSupplier}
                onChange={setSelectedSupplier}
                showSearch
                filterOption={(input, option) =>
                  String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {suppliers.map(s => (
                  <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                ))}
              </Select>
            )}
            
            <Button 
              type="primary" 
              icon={<FilterOutlined />} 
              onClick={handleApplyFilters}
              loading={loadingGeneral || loadingSales || loadingArrivals || loadingExpenses}
            >
              {t('common.apply', { defaultValue: 'Применить' })}
            </Button>
          </div>
        </Space>
      </Card>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        {/* General Report Tab */}
        <TabPane 
          tab={<span><PieChartOutlined /> {t('reports.general', { defaultValue: 'Общий' })}</span>} 
          key="general"
        >
          <Spin spinning={loadingGeneral}>
            {generalReport && (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={12} lg={8}>
                    <Card>
                      <Statistic
                        title={t('reports.totalSales', { defaultValue: 'Всего продаж' })}
                        value={generalReport.summary.totalSales}
                        precision={2}
                        prefix={<ShoppingCartOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card>
                      <Statistic
                        title={t('reports.paidSales', { defaultValue: 'Оплаченные продажи' })}
                        value={generalReport.summary.paidSales}
                        precision={2}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card>
                      <Statistic
                        title={t('reports.debtSales', { defaultValue: 'Продажи в долг' })}
                        value={generalReport.summary.debtSales}
                        precision={2}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#ff4d4f' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card>
                      <Statistic
                        title={t('reports.profit', { defaultValue: 'Прибыль' })}
                        value={generalReport.summary.profit}
                        precision={2}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: generalReport.summary.profit >= 0 ? '#52c41a' : '#ff4d4f' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card>
                      <Statistic
                        title={t('reports.totalExpenses', { defaultValue: 'Расходы' })}
                        value={generalReport.summary.totalExpenses}
                        precision={2}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#ff4d4f' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card>
                      <Statistic
                        title={t('reports.totalStockReceipts', { defaultValue: 'Поступления' })}
                        value={generalReport.summary.totalStockReceipts}
                        precision={2}
                        prefix={<ImportOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card>
                      <Statistic
                        title={t('reports.totalReturns', { defaultValue: 'Возвраты' })}
                        value={generalReport.summary.totalReturns}
                        precision={2}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#faad14' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card>
                      <Statistic
                        title={t('reports.totalDebtorBorrowed', { defaultValue: 'Выдано должникам' })}
                        value={generalReport.summary.totalDebtorBorrowed}
                        precision={2}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#722ed1' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card>
                      <Statistic
                        title={t('reports.totalDebtorReturned', { defaultValue: 'Возвращено должниками' })}
                        value={generalReport.summary.totalDebtorReturned}
                        precision={2}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#13c2c2' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card>
                      <Statistic
                        title={t('reports.totalSalaryPayments', { defaultValue: 'Выплаты зарплат' })}
                        value={generalReport.summary.totalSalaryPayments}
                        precision={2}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#eb2f96' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title={t('reports.salesCount', { defaultValue: 'Кол-во продаж' })}
                        value={generalReport.summary.salesCount}
                        prefix={<ShoppingCartOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title={t('reports.customersCount', { defaultValue: 'Клиенты' })}
                        value={generalReport.summary.customersCount}
                        prefix={<UserOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title={t('reports.suppliersCount', { defaultValue: 'Поставщики' })}
                        value={generalReport.summary.suppliersCount}
                        prefix={<ShopOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title={t('reports.productsCount', { defaultValue: 'Товары' })}
                        value={generalReport.summary.productsCount}
                        prefix={<InboxOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>
              </>
            )}
          </Spin>
        </TabPane>
        
        {/* Sales Report Tab */}
        <TabPane 
          tab={<span><ShoppingCartOutlined /> {t('reports.sales', { defaultValue: 'Продажи' })}</span>} 
          key="sales"
        >
          <Spin spinning={loadingSales}>
            {salesReport && (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={6}>
                    <Card size="small">
                      <Statistic
                        title={t('reports.totalAmount', { defaultValue: 'Общая сумма' })}
                        value={salesReport.summary.totalAmount}
                        precision={2}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card size="small">
                      <Statistic
                        title={t('reports.paidAmount', { defaultValue: 'Оплачено' })}
                        value={salesReport.summary.paidAmount}
                        precision={2}
                        valueStyle={{ color: '#52c41a' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card size="small">
                      <Statistic
                        title={t('reports.debtAmount', { defaultValue: 'Долг' })}
                        value={salesReport.summary.debtAmount}
                        precision={2}
                        valueStyle={{ color: '#ff4d4f' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card size="small">
                      <Statistic
                        title={t('reports.totalProfit', { defaultValue: 'Общая прибыль' })}
                        value={salesReport.summary.totalProfit}
                        precision={2}
                        valueStyle={{ color: salesReport.summary.totalProfit >= 0 ? '#52c41a' : '#ff4d4f' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                </Row>
                <Table
                  dataSource={salesReport.sales}
                  columns={salesColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: true }}
                  size="small"
                />
              </>
            )}
          </Spin>
        </TabPane>
        
        {/* Arrivals Report Tab */}
        <TabPane 
          tab={<span><ImportOutlined /> {t('reports.arrivals', { defaultValue: 'Поступления' })}</span>} 
          key="arrivals"
        >
          <Spin spinning={loadingArrivals}>
            {arrivalsReport && (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={6}>
                    <Card size="small">
                      <Statistic
                        title={t('reports.totalAmount', { defaultValue: 'Общая сумма' })}
                        value={arrivalsReport.summary.totalAmount}
                        precision={2}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card size="small">
                      <Statistic
                        title="TJS"
                        value={arrivalsReport.summary.tjsAmount}
                        precision={2}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card size="small">
                      <Statistic
                        title="USD"
                        value={arrivalsReport.summary.usdAmount}
                        precision={2}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card size="small">
                      <Statistic
                        title="RUB"
                        value={arrivalsReport.summary.rubAmount}
                        precision={2}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                </Row>
                <Table
                  dataSource={arrivalsReport.receipts}
                  columns={arrivalsColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: true }}
                  size="small"
                />
              </>
            )}
          </Spin>
        </TabPane>
        
        {/* Expenses Report Tab */}
        <TabPane 
          tab={<span><DollarOutlined /> {t('reports.expenses', { defaultValue: 'Расходы' })}</span>} 
          key="expenses"
        >
          <Spin spinning={loadingExpenses}>
            {expensesReport && (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title={t('reports.totalAmount', { defaultValue: 'Общая сумма' })}
                        value={expensesReport.summary.totalAmount}
                        precision={2}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title={t('reports.expensesCount', { defaultValue: 'Кол-во расходов' })}
                        value={expensesReport.summary.count}
                      />
                    </Card>
                  </Col>
                </Row>
                <Table
                  dataSource={expensesReport.expenses}
                  columns={expensesColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: true }}
                  size="small"
                />
              </>
            )}
          </Spin>
        </TabPane>
      </Tabs>
    </div>
  );
};
