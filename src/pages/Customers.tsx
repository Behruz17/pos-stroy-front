import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Card, message, Popconfirm, Form, Input, Row, Col, Modal, type TableProps, Select, DatePicker, Tag, Spin, InputNumber } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, PhoneOutlined, SearchOutlined, UserOutlined, DollarOutlined, TransactionOutlined } from '@ant-design/icons';
import { customersApi, customerOperationsApi, salesApi, customerPaymentsApi, type Customer, type CreateCustomerRequest, type CustomerOperation, type CustomerOperationFilters, type Sale, type CustomerPayment, type CreateCustomerPaymentRequest } from '../api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

export const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
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
        message.error('Требуется авторизация');
      } else {
        message.error('Ошибка при загрузке клиентов');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOperations = async () => {
    setOperationsLoading(true);
    try {
      const data = await customerOperationsApi.getAll(operationsFilters);
      setOperations(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error('Требуется авторизация');
      } else {
        message.error('Ошибка загрузки операций клиентов');
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
        message.error('Требуется авторизация');
      } else {
        message.error('Ошибка загрузки оплат');
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
      message.error('Ошибка загрузки клиентов');
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
      message.success('Клиент удален');
      fetchCustomers();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 404) {
        message.error('Клиент не найден');
      } else {
        message.error('Ошибка при удалении клиента');
      }
    }
  };

  const handleCreate = async (values: CreateCustomerRequest) => {
    setCreating(true);
    try {
      await customersApi.create(values);
      message.success('Клиент успешно создан');
      setModalVisible(false);
      form.resetFields();
      fetchCustomers();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } }; message?: string };
      if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || 'Проверьте обязательные поля');
      } else if (axiosError.message?.includes('Network Error')) {
        message.error('Сервер недоступен. Проверьте подключение.');
      } else {
        message.error('Ошибка при создании клиента');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCreateModal = () => {
    setModalVisible(true);
    form.resetFields();
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
    
    // If it's a DEBT or PAID operation with sale_id, fetch the sale details with items
    if ((record.type === 'DEBT' || record.type === 'PAID') && record.sale_id) {
      setLoadingSale(true);
      try {
        const saleData = await salesApi.getById(record.sale_id);
        setSaleDetails(saleData);
      } catch (error: unknown) {
        message.error('Ошибка при загрузке деталей продажи');
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
      case 'PAYMENT': return 'blue';
      case 'RETURN': return 'orange';
      default: return 'default';
    }
  };

  const getOperationTypeText = (type: string) => {
    switch (type) {
      case 'DEBT': return 'Долг';
      case 'PAID': return 'Оплачено';
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
      message.success('Оплата успешно удалена');
      fetchPayments();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } } };
      if (axiosError.response?.status === 404) {
        message.error(axiosError.response.data?.message || 'Оплата не найдена');
      } else if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || 'Нельзя удалить эту оплату');
      } else {
        message.error('Ошибка удаления оплаты');
      }
    }
  };

  const handleCreatePayment = async (values: any) => {
    setCreatingPayment(true);
    try {
      const createData: CreateCustomerPaymentRequest = {
        customer_id: values.customer_id,
        sum: values.sum,
      };

      await customerPaymentsApi.create(createData);
      message.success('Оплата успешно создана');
      setPaymentsModalVisible(false);
      paymentsForm.resetFields();
      fetchPayments();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string; error?: string } }; message?: string };
      
      if (axiosError.response?.status === 400) {
        const errorMessage = axiosError.response.data?.message || axiosError.response.data?.error || 'Проверьте обязательные поля';
        message.error(errorMessage);
      } else if (axiosError.message?.includes('Network Error')) {
        message.error('Сервер недоступен. Проверьте подключение.');
      } else {
        message.error('Ошибка создания оплаты');
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
      responsive: ['md'],
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: 'Полное имя',
      dataIndex: 'full_name',
      key: 'full_name',
      ellipsis: true,
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-',
      responsive: ['sm'],
    },
    {
      title: 'Баланс',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) => (
        <span style={{ color: balance >= 0 ? '#52c41a' : '#ff4d4f' }}>
          <DollarOutlined style={{ marginRight: 4 }} />
          {balance.toLocaleString()}
        </span>
      ),
      responsive: ['sm'],
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Customer) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/customers/${record.id}/edit`)}
            size="small"
          />
          <Popconfirm
            title="Удалить клиента?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
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
      responsive: ['md'],
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
      responsive: ['sm'],
    },
    {
      title: 'Клиент',
      dataIndex: 'customer_name',
      key: 'customer_name',
      ellipsis: true,
      responsive: ['sm'],
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getOperationTypeColor(type)}>
          {getOperationTypeText(type)}
        </Tag>
      ),
      responsive: ['sm'],
    },
    {
      title: 'Сумма',
      dataIndex: 'sum',
      key: 'sum',
      render: (sum: number, record: CustomerOperation) => (
        <span style={{ color: record.type === 'DEBT' ? '#ff4d4f' : '#52c41a' }}>
          {sum.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
        </span>
      ),
      responsive: ['sm'],
    },
  ];

  const paymentsColumns: TableProps<CustomerPayment>['columns'] = [
    {
      title: '№',
      key: 'rowNumber',
      width: 60,
      responsive: ['md'],
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
      responsive: ['sm'],
    },
    {
      title: 'Клиент',
      dataIndex: 'customer_name',
      key: 'customer_name',
      ellipsis: true,
    },
    {
      title: 'Сумма',
      dataIndex: 'sum',
      key: 'sum',
      render: (amount: number) => (
        <span style={{ color: '#52c41a' }}>
          <DollarOutlined style={{ marginRight: 4 }} />
          {amount.toLocaleString()}
        </span>
      ),
      responsive: ['sm'],
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color="blue">{type}</Tag>
      ),
      width: 100,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: CustomerPayment) => (
        <Space size="small">
          <Popconfirm
            title="Удалить оплату?"
            description="Это действие нельзя отменить, баланс клиента будет восстановлен"
            onConfirm={() => handleDeletePayment(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button danger icon={<DeleteOutlined />} size="small" title="Удалить" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>Клиенты</Title>
      
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
        {selectedOperation && (selectedOperation.type === 'DEBT' || selectedOperation.type === 'PAID') ? (
          <div>
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
                scroll={{ y: 400 }}
                columns={[
                  {
                    title: 'Товар',
                    dataIndex: 'product_name',
                    key: 'product_name',
                    ellipsis: true,
                  },
                  {
                    title: 'Код',
                    dataIndex: 'product_code',
                    key: 'product_code',
                    width: 100,
                  },
                  {
                    title: 'Кол-во',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 80,
                    align: 'right',
                  },
                  {
                    title: 'Цена',
                    dataIndex: 'unit_price',
                    key: 'unit_price',
                    width: 100,
                    align: 'right',
                    render: (price: number) => price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }),
                  },
                  {
                    title: 'Сумма',
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
                Нет данных о товарах
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
            Для этой операции нет данных о товарах
          </div>
        )}
      </Modal>

      <Modal
        title="Добавить оплату клиента"
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
            Отмена
          </Button>,
          <Button key="submit" type="primary" onClick={() => paymentsForm.submit()} loading={creatingPayment}>
            Создать
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
            label="Клиент"
            name="customer_id"
            rules={[{ required: true, message: 'Выберите клиента' }]}
          >
            <Select placeholder="Выберите клиента" prefix={<UserOutlined />}>
              {paymentCustomers.map(customer => (
                <Option key={customer.id} value={customer.id}>
                  {customer.full_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Сумма"
            name="sum"
            rules={[
              { required: true, message: 'Введите сумму' },
              { type: 'number', min: 0.01, message: 'Сумма должна быть больше 0' }
            ]}
          >
            <InputNumber
              placeholder="Сумма"
              min={0.01}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
              prefix={<DollarOutlined />}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
