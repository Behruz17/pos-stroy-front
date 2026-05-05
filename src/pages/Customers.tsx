import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Card, message, Popconfirm, Form, Input, Row, Col, Modal, type TableProps, Select, DatePicker, Tag, Spin, InputNumber, Statistic } from 'antd';
import { useTranslation } from 'react-i18next';
import { EditOutlined, DeleteOutlined, PlusOutlined, PhoneOutlined, SearchOutlined, UserOutlined, DollarOutlined, TransactionOutlined } from '@ant-design/icons';
import { customersApi, customerOperationsApi, salesApi, customerPaymentsApi, accountsApi, type Customer, type CreateCustomerRequest, type CustomerOperation, type CustomerOperationFilters, type Sale, type CustomerPayment, type CreateCustomerPaymentRequest, type Account } from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

export const Customers = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  
  // Customer operations state
  const [operations, setOperations] = useState<CustomerOperation[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [operationsSearchText, setOperationsSearchText] = useState('');
  const [operationsFilters, setOperationsFilters] = useState<CustomerOperationFilters>({ date: dayjs().format('YYYY-MM-DD') });
  const [selectedOperation, setSelectedOperation] = useState<CustomerOperation | null>(null);
  const [operationsModalVisible, setOperationsModalVisible] = useState(false);
  const [saleDetails, setSaleDetails] = useState<Sale | null>(null);
  const [loadingSale, setLoadingSale] = useState(false);
  
  // Customer payments state
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsSearchText, setPaymentsSearchText] = useState('');
  const [paymentsModalVisible, setPaymentsModalVisible] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [paymentsForm] = Form.useForm();
  const [paymentCustomers, setPaymentCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(1);

  const fetchAccounts = async () => {
    try {
      const data = await accountsApi.getAll();
      setAccounts(data);
      const cashAccount = data.find(a => a.type === 'CASH' && a.status === 1);
      if (cashAccount) {
        setSelectedAccountId(cashAccount.id);
      } else if (data.length > 0) {
        setSelectedAccountId(data[0].id);
      }
    } catch (error) {
      // Silently fail
    }
  };

  const [activeTab, setActiveTab] = useState<'customers' | 'operations' | 'payments'>('customers');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customersApi.getAll();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error(t('errors.unauthorized'));
      } else {
        message.error(t('customers.errorLoading'));
      }
    } finally {
      setLoading(false);
    }
  };

  const getTotalDebt = () => {
    return customers.reduce((total, customer) => {
      const balance = Number(customer.balance) || 0;
      return balance > 0 ? total + balance : total;
    }, 0);
  };

  const fetchOperations = async () => {
    setOperationsLoading(true);
    try {
      const data = await customerOperationsApi.getAll(operationsFilters);
      setOperations(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error(t('errors.unauthorized'));
      } else {
        message.error(t('customers.operationsErrorLoading', { defaultValue: 'Ошибка загрузки операций клиентов' }));
      }
    } finally {
      setOperationsLoading(false);
    }
  };

  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const data = await customerPaymentsApi.getAll();
      setPayments(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error(t('errors.unauthorized'));
      } else {
        message.error(t('customers.paymentsErrorLoading', { defaultValue: 'Ошибка загрузки оплат' }));
      }
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchPaymentCustomers = async () => {
    try {
      const data = await customersApi.getAll();
      setPaymentCustomers(data);
    } catch (error: unknown) {
      message.error(t('customers.errorLoading'));
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    const filtered = customers.filter(customer => 
      customer.full_name.toLowerCase().includes(value.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCustomers(filtered);
  };

  useEffect(() => {
    fetchCustomers();
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (activeTab === 'operations') {
      fetchOperations();
    } else if (activeTab === 'payments') {
      fetchPayments();
      fetchPaymentCustomers();
    }
  }, [operationsFilters, activeTab]);

  const handleDelete = async (id: number) => {
    try {
      await customersApi.delete(id);
      message.success(t('customers.customerDeleted'));
      fetchCustomers();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 404) {
        message.error(t('errors.notFound'));
      } else {
        message.error(t('customers.errorDeleting'));
      }
    }
  };

  const handleCreate = async (values: CreateCustomerRequest) => {
    setCreating(true);
    try {
      await customersApi.create(values);
      message.success(t('customers.customerCreated'));
      setModalVisible(false);
      form.resetFields();
      fetchCustomers();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } }; message?: string };
      if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || t('errors.required'));
      } else if (axiosError.message?.includes('Network Error')) {
        message.error(t('errors.networkError'));
      } else {
        message.error(t('customers.errorCreating'));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCreateModal = () => {
    setModalVisible(true);
    form.resetFields();
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditModalVisible(true);
    form.setFieldsValue({
      full_name: customer.full_name,
      phone: customer.phone,
    });
  };

  const handleUpdate = async (values: any) => {
    if (!editingCustomer) return;

    setEditing(true);
    try {
      await customersApi.update(editingCustomer.id, values);
      message.success(t('customers.customerUpdated'));
      setEditModalVisible(false);
      setEditingCustomer(null);
      form.resetFields();
      fetchCustomers();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } }; message?: string };
      if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || t('customers.errorUpdating'));
      } else if (axiosError.message?.includes('Network Error')) {
        message.error(t('errors.networkError'));
      } else {
        message.error(t('customers.errorUpdating'));
      }
    } finally {
      setEditing(false);
    }
  };

  // Customer operations handlers
  const handleOperationsSearch = (value: string) => {
    setOperationsSearchText(value);
  };

  const handleOperationsFilterChange = (key: string, value: any) => {
    const newFilters = { ...operationsFilters };
    
    if (key === 'date') {
      newFilters.date = value ? value.format('YYYY-MM-DD') : undefined;
    } else if (key === 'type') {
      newFilters.type = value || undefined;
    }
    
    setOperationsFilters(newFilters);
  };

  const handleOperationRowClick = async (record: CustomerOperation) => {
    setSelectedOperation(record);
    
    // If it's a DEBT, PAID, or PARTIAL operation with sale_id, fetch the sale details with items
    if ((record.type === 'DEBT' || record.type === 'PAID' || record.type === 'PARTIAL') && record.sale_id) {
      setLoadingSale(true);
      try {
        const saleData = await salesApi.getById(record.sale_id);
        setSaleDetails(saleData);
      } catch (error: unknown) {
        message.error(t('sales.errorLoadingDetails', { defaultValue: 'Ошибка при загрузке деталей продажи' }));
        setSaleDetails(null);
      } finally {
        setLoadingSale(false);
      }
    } else {
      setSaleDetails(null);
    }
    
    setOperationsModalVisible(true);
  };

  const handleCloseOperationsModal = () => {
    setOperationsModalVisible(false);
    setSelectedOperation(null);
    setSaleDetails(null);
  };

  const getOperationTypeColor = (type: string) => {
    switch (type) {
      case 'DEBT': return 'red';
      case 'PAID': return 'green';
      case 'PARTIAL': return 'blue';
      case 'PAYMENT': return 'cyan';
      case 'RETURN': return 'orange';
      default: return 'default';
    }
  };

  const getOperationTypeText = (type: string) => {
    switch (type) {
      case 'DEBT': return 'Долг';
      case 'PAID': return 'Оплачено';
      case 'PARTIAL': return 'Частично';
      case 'PAYMENT': return 'Платёж';
      case 'RETURN': return 'Возврат';
      default: return type;
    }
  };

  // Customer payments handlers
  const handlePaymentsSearch = (value: string) => {
    setPaymentsSearchText(value);
  };

  const handleDeletePayment = async (id: number) => {
    try {
      await customerPaymentsApi.delete(id);
      message.success(t('payments.paymentDeleted', { defaultValue: 'Оплата успешно удалена' }));
      fetchPayments();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } } };
      if (axiosError.response?.status === 404) {
        message.error(axiosError.response.data?.message || t('payments.paymentNotFound', { defaultValue: 'Оплата не найдена' }));
      } else if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || t('payments.cannotDelete', { defaultValue: 'Нельзя удалить эту оплату' }));
      } else {
        message.error(t('payments.errorDeleting', { defaultValue: 'Ошибка удаления оплаты' }));
      }
    }
  };

  const handleCreatePayment = async (values: any) => {
    setCreatingPayment(true);
    try {
      const createData: CreateCustomerPaymentRequest = {
        customer_id: values.customer_id,
        sum: values.sum,
        account_id: selectedAccountId,
      };

      await customerPaymentsApi.create(createData);
      message.success(t('payments.paymentCreated', { defaultValue: 'Оплата успешно создана' }));
      setPaymentsModalVisible(false);
      paymentsForm.resetFields();
      fetchPayments();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string; error?: string } }; message?: string };
      
      if (axiosError.response?.status === 400) {
        const errorMessage = axiosError.response.data?.message || axiosError.response.data?.error || 'Проверьте обязательные поля';
        message.error(errorMessage);
      } else if (axiosError.message?.includes('Network Error')) {
        message.error(t('errors.networkError'));
      } else {
        message.error(t('payments.errorCreating', { defaultValue: 'Ошибка создания оплаты' }));
      }
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleCreatePaymentModal = () => {
    setPaymentsModalVisible(true);
    paymentsForm.resetFields();
  };

  const columns: TableProps<Customer>['columns'] = [
    {
      title: '№',
      key: 'rowNumber',
      width: 60,
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: t('customers.fullName'),
      dataIndex: 'full_name',
      key: 'full_name',
      ellipsis: true,
    },
    {
      title: t('common.phone'),
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: t('customers.balance'),
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) => (
        <span style={{ color: balance >= 0 ? '#52c41a' : '#ff4d4f' }}>
          <DollarOutlined style={{ marginRight: 4 }} />
          {balance.toLocaleString()}
        </span>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Customer) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title={t('customers.confirmDeleteTitle', { defaultValue: 'Удалить клиента?' })}
            description={t('customers.confirmDeleteDesc', { defaultValue: 'Это действие нельзя отменить' })}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const operationsColumns: TableProps<CustomerOperation>['columns'] = [
    {
      title: '№',
      key: 'rowNumber',
      width: 60,
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: t('common.date'),
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: t('customers.customer'),
      dataIndex: 'customer_name',
      key: 'customer_name',
      ellipsis: true,
    },
    {
      title: t('common.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getOperationTypeColor(type)}>
          {getOperationTypeText(type)}
        </Tag>
      ),
    },
    {
      title: t('common.amount'),
      dataIndex: 'sum',
      key: 'sum',
      render: (sum: number, record: CustomerOperation) => (
        <span style={{ color: record.type === 'DEBT' ? '#ff4d4f' : '#52c41a' }}>
          {sum.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
        </span>
      ),
    },
  ];

  const paymentsColumns: TableProps<CustomerPayment>['columns'] = [
    {
      title: '№',
      key: 'rowNumber',
      width: 60,
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: t('common.date'),
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: t('customers.customer'),
      dataIndex: 'customer_name',
      key: 'customer_name',
      ellipsis: true,
    },
    {
      title: t('common.amount'),
      dataIndex: 'sum',
      key: 'sum',
      render: (amount: number) => (
        <span style={{ color: '#52c41a' }}>
          <DollarOutlined style={{ marginRight: 4 }} />
          {amount.toLocaleString()}
        </span>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      render: (_: unknown, record: CustomerPayment) => (
        <Space size="small">
          <Popconfirm
            title={t('customers.deletePaymentTitle', { defaultValue: 'Удалить оплату?' })}
            description={t('customers.deletePaymentDesc', { defaultValue: 'Это действие нельзя отменить, баланс клиента будет восстановлен' })}
            onConfirm={() => handleDeletePayment(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button danger icon={<DeleteOutlined />} size="small" title={t('common.delete')} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>Клиенты</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Общая сумма долга"
              value={getTotalDebt()}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<DollarOutlined />}
              suffix="TJS"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Количество клиентов"
              value={customers.length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col>
            <Button
              type={activeTab === 'customers' ? 'primary' : 'default'}
              icon={<UserOutlined />}
              onClick={() => setActiveTab('customers')}
            >
              Клиенты
            </Button>
          </Col>
          <Col>
            <Button
              type={activeTab === 'operations' ? 'primary' : 'default'}
              icon={<TransactionOutlined />}
              onClick={() => setActiveTab('operations')}
            >
              Операции клиентов
            </Button>
          </Col>
          <Col>
            <Button
              type={activeTab === 'payments' ? 'primary' : 'default'}
              icon={<DollarOutlined />}
              onClick={() => setActiveTab('payments')}
            >
              Оплаты клиентов
            </Button>
          </Col>
        </Row>
      </Card>

      {activeTab === 'customers' && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={16}>
                <Input
                  placeholder="Поиск клиентов..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateModal}
                  style={{ width: '100%' }}
                >
                  Добавить клиента
                </Button>
              </Col>
            </Row>
          </Card>

          <Table
            columns={columns}
            dataSource={filteredCustomers}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            size="small"
          />
        </>
      )}

      {activeTab === 'operations' && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Input
                  placeholder="Поиск по имени клиента..."
                  value={operationsSearchText}
                  onChange={(e) => handleOperationsSearch(e.target.value)}
                  prefix={<SearchOutlined />}
                  allowClear
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <DatePicker
                  placeholder="Фильтр по дате"
                  value={operationsFilters.date ? dayjs(operationsFilters.date) : null}
                  onChange={(date) => handleOperationsFilterChange('date', date)}
                  style={{ width: '100%' }}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Select
                  placeholder="Тип операции"
                  value={operationsFilters.type}
                  onChange={(value) => handleOperationsFilterChange('type', value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="DEBT">Долг</Option>
                  <Option value="PAID">Оплачено</Option>
                  <Option value="PARTIAL">Частично</Option>
                  <Option value="PAYMENT">Платёж</Option>
                  <Option value="RETURN">Возврат</Option>
                </Select>
              </Col>
            </Row>
          </Card>

          <Table
            columns={operationsColumns}
            dataSource={operations.filter(operation => 
              operation.customer_name.toLowerCase().includes(operationsSearchText.toLowerCase()) ||
              operation.id.toString().includes(operationsSearchText) ||
              operation.customer_id.toString().includes(operationsSearchText)
            )}
            rowKey="id"
            loading={operationsLoading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            size="small"
            onRow={(record) => ({
              style: { cursor: 'pointer' },
              onClick: () => handleOperationRowClick(record),
            })}
          />
        </>
      )}

      {activeTab === 'payments' && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={16}>
                <Input
                  placeholder="Поиск оплат..."
                  prefix={<SearchOutlined />}
                  value={paymentsSearchText}
                  onChange={(e) => handlePaymentsSearch(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreatePaymentModal}
                  style={{ width: '100%' }}
                >
                  Добавить оплату
                </Button>
              </Col>
            </Row>
          </Card>

          <Table
            columns={paymentsColumns}
            dataSource={payments.filter(payment => 
              payment.customer_name.toLowerCase().includes(paymentsSearchText.toLowerCase()) ||
              payment.id.toString().includes(paymentsSearchText)
            )}
            rowKey="id"
            loading={paymentsLoading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            size="small"
          />
        </>
      )}

      <Modal
        title="Добавить клиента"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setModalVisible(false);
            form.resetFields();
          }}>
            Отмена
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()} loading={creating}>
            Создать
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            label="Полное имя"
            name="full_name"
            rules={[{ required: true, message: 'Введите полное имя клиента' }]}
          >
            <Input placeholder="Например: Иванов Иван Иванович" prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            label="Телефон"
            name="phone"
          >
            <Input placeholder="+992123456789" prefix={<PhoneOutlined />} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Редактировать клиента"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingCustomer(null);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setEditModalVisible(false);
            setEditingCustomer(null);
            form.resetFields();
          }}>
            Отмена
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()} loading={editing}>
            Обновить
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={form}
          name="editCustomer"
          onFinish={handleUpdate}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            label="ФИО"
            name="full_name"
            rules={[{ required: true, message: 'Введите ФИО клиента' }]}
          >
            <Input placeholder="Введите ФИО клиента" prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            label="Телефон"
            name="phone"
          >
            <Input placeholder="+992123456789" prefix={<PhoneOutlined />} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Товары"
        open={operationsModalVisible}
        onCancel={handleCloseOperationsModal}
        footer={[
          <Button key="close" onClick={handleCloseOperationsModal}>
            Закрыть
          </Button>,
        ]}
        width={600}
      >
        {selectedOperation && (selectedOperation.type === 'DEBT' || selectedOperation.type === 'PAID' || selectedOperation.type === 'PARTIAL') ? (
          <div>
            {selectedOperation?.type === 'PARTIAL' && saleDetails && ((parseFloat(saleDetails.cash_amount) || 0) > 0 || (parseFloat(saleDetails.electronic_amount) || 0) > 0) && (
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <Card size="small">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#8c8c8c', fontSize: 14 }}>Оплачено</div>
                      <div style={{ color: '#52c41a', fontSize: 24, fontWeight: 'bold' }}>
                        {(Number(saleDetails.cash_amount) + Number(saleDetails.electronic_amount)).toFixed(2)} TJS
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#8c8c8c', fontSize: 14 }}>Осталось</div>
                      <div style={{ color: '#ff4d4f', fontSize: 24, fontWeight: 'bold' }}>
                        {(Number(saleDetails.total_amount) - Number(saleDetails.cash_amount) - Number(saleDetails.electronic_amount)).toFixed(2)} TJS
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            )}
            {loadingSale ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin size="large" />
              </div>
            ) : saleDetails?.items && saleDetails.items.length > 0 ? (
              <Table
                dataSource={saleDetails.items}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ x: 'max-content', y: 400 }}
                columns={[
                  {
                    title: t('common.product'),
                    dataIndex: 'product_name',
                    key: 'product_name',
                    ellipsis: true,
                  },
                  {
                    title: t('common.id'),
                    dataIndex: 'product_id',
                    key: 'product_id',
                    width: 80,
                  },
                  {
                    title: t('common.quantityShort', { defaultValue: 'Кол-во' }),
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 80,
                    align: 'right',
                  },
                  {
                    title: t('common.price'),
                    dataIndex: 'unit_price',
                    key: 'unit_price',
                    width: 100,
                    align: 'right',
                    render: (price: number) => price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }),
                  },
                  {
                    title: t('common.amount'),
                    dataIndex: 'total_price',
                    key: 'total_price',
                    width: 100,
                    align: 'right',
                    render: (total: number) => total.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }),
                  },
                ]}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                {t('customers.noProductData', { defaultValue: 'Нет данных о товарах' })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
            {t('customers.noProductDataForOperation', { defaultValue: 'Для этой операции нет данных о товарах' })}
          </div>
        )}
      </Modal>

      <Modal
        title={t('customers.addPayment')}
        open={paymentsModalVisible}
        onCancel={() => {
          setPaymentsModalVisible(false);
          paymentsForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setPaymentsModalVisible(false);
            paymentsForm.resetFields();
          }}>
            {t('common.cancel')}
          </Button>,
          <Button key="submit" type="primary" onClick={() => paymentsForm.submit()} loading={creatingPayment}>
            {t('common.create')}
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={paymentsForm}
          layout="vertical"
          onFinish={handleCreatePayment}
        >
          <Form.Item
            label={t('common.customer')}
            name="customer_id"
            rules={[{ required: true, message: t('customers.selectCustomer', { defaultValue: 'Выберите клиента' }) }]}
          >
            <Select placeholder={t('customers.selectCustomer', { defaultValue: 'Выберите клиента' })} prefix={<UserOutlined />}>
              {paymentCustomers.map(customer => (
                <Option key={customer.id} value={customer.id}>
                  {customer.full_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t('common.amount')}
            name="sum"
            rules={[
              { required: true, message: t('customers.enterAmount', { defaultValue: 'Введите сумму' }) },
              { type: 'number', min: 0.01, message: t('customers.amountGreaterThanZero', { defaultValue: 'Сумма должна быть больше 0' }) }
            ]}
          >
            <InputNumber
              placeholder={t('common.amount')}
              min={0.01}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
              prefix={<DollarOutlined />}
            />
          </Form.Item>

          <Form.Item
            label={t('customers.account', { defaultValue: 'Счет оплаты' })}
            required
          >
            {accounts.length === 0 ? (
              <div style={{ color: '#ff4d4f' }}>Счета не загружены. Проверьте подключение к API.</div>
            ) : (
              <Select
                value={selectedAccountId}
                onChange={(value) => setSelectedAccountId(value)}
                style={{ width: '100%' }}
                placeholder="Выберите счет"
              >
                {accounts.filter(a => a.status === 1).map(account => (
                  <Option key={account.id} value={account.id}>
                    {account.name} ({account.type === 'CASH' ? 'Наличные' : 'Электронный'}) - {account.current_balance.toLocaleString()}
                  </Option>
                ))}
              </Select>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
