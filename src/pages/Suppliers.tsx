import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Card, message, Popconfirm, Form, Input, Row, Col, Modal, type TableProps, Select, DatePicker, Tag, Spin, InputNumber } from 'antd';
import { useTranslation } from 'react-i18next';
import { EditOutlined, DeleteOutlined, TeamOutlined, PlusOutlined, PhoneOutlined, SearchOutlined, AccountBookOutlined, DollarOutlined, ShopOutlined } from '@ant-design/icons';
import { suppliersApi, supplierOperationsApi, stockReceiptsApi, supplierPaymentsApi, accountsApi, type Supplier, type CreateSupplierRequest, type SupplierOperation, type SupplierOperationFilters, type StockReceipt, type SupplierPayment, type CreateSupplierPaymentRequest, type Account } from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

export const Suppliers = () => {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  
  // Supplier operations state
  const [operations, setOperations] = useState<SupplierOperation[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [operationsSearchText, setOperationsSearchText] = useState('');
  const [operationsFilters, setOperationsFilters] = useState<SupplierOperationFilters>({ date: dayjs().format('YYYY-MM-DD') });
  const [selectedOperation, setSelectedOperation] = useState<SupplierOperation | null>(null);
  const [operationsModalVisible, setOperationsModalVisible] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState<StockReceipt | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  
  // Supplier payments state
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsSearchText, setPaymentsSearchText] = useState('');
  const [paymentsModalVisible, setPaymentsModalVisible] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [paymentsForm] = Form.useForm();
  const [paymentSuppliers, setPaymentSuppliers] = useState<Supplier[]>([]);
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

  const [activeTab, setActiveTab] = useState<'suppliers' | 'operations' | 'payments'>('suppliers');

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await suppliersApi.getAll();
      setSuppliers(data);
      setFilteredSuppliers(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error(t('errors.unauthorized'));
      } else {
        message.error(t('suppliers.errorLoading', { defaultValue: 'Ошибка при загрузке поставщиков' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOperations = async () => {
    setOperationsLoading(true);
    try {
      const data = await supplierOperationsApi.getAll(operationsFilters);
      setOperations(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error(t('errors.unauthorized'));
      } else {
        message.error(t('suppliers.operationsErrorLoading', { defaultValue: 'Ошибка загрузки операций поставщиков' }));
      }
    } finally {
      setOperationsLoading(false);
    }
  };

  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const data = await supplierPaymentsApi.getAll();
      setPayments(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error(t('errors.unauthorized'));
      } else {
        message.error(t('suppliers.paymentsErrorLoading', { defaultValue: 'Ошибка загрузки оплат' }));
      }
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchPaymentSuppliers = async () => {
    try {
      const data = await suppliersApi.getAll();
      setPaymentSuppliers(data);
    } catch (error: unknown) {
      message.error(t('suppliers.errorLoading'));
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    const filtered = suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(value.toLowerCase()) ||
      supplier.phone?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSuppliers(filtered);
  };

  useEffect(() => {
    fetchSuppliers();
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (activeTab === 'operations') {
      fetchOperations();
    } else if (activeTab === 'payments') {
      fetchPayments();
      fetchPaymentSuppliers();
    }
  }, [operationsFilters, activeTab]);

  const handleDelete = async (id: number) => {
    try {
      await suppliersApi.delete(id);
      message.success(t('suppliers.supplierDeleted', { defaultValue: 'Поставщик удален' }));
      fetchSuppliers();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } } };
      if (axiosError.response?.status === 404) {
        message.error(t('errors.notFound'));
      } else {
        message.error(t('suppliers.errorDeleting', { defaultValue: 'Ошибка при удалении поставщика' }));
      }
    }
  };

  const handleCreate = async (values: CreateSupplierRequest) => {
    setCreating(true);
    try {
      await suppliersApi.create(values);
      message.success(t('suppliers.supplierCreated', { defaultValue: 'Поставщик успешно создан' }));
      setModalVisible(false);
      form.resetFields();
      fetchSuppliers();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } }; message?: string };
      if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || t('errors.required'));
      } else if (axiosError.message?.includes('Network Error')) {
        message.error(t('errors.networkError'));
      } else {
        message.error(t('suppliers.errorCreating', { defaultValue: 'Ошибка при создании поставщика' }));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCreateModal = () => {
    setModalVisible(true);
    form.resetFields();
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setEditModalVisible(true);
    form.setFieldsValue({
      name: supplier.name,
      phone: supplier.phone,
      currency: supplier.currency,
    });
  };

  const handleUpdate = async (values: any) => {
    if (!editingSupplier) return;
    
    setEditing(true);
    try {
      await suppliersApi.update(editingSupplier.id, values);
      message.success(t('suppliers.supplierUpdated', { defaultValue: 'Поставщик успешно обновлен' }));
      setEditModalVisible(false);
      setEditingSupplier(null);
      form.resetFields();
      fetchSuppliers();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } }; message?: string };
      if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || t('suppliers.errorUpdating', { defaultValue: 'Ошибка при обновлении поставщика' }));
      } else if (axiosError.message?.includes('Network Error')) {
        message.error(t('errors.networkError'));
      } else {
        message.error(t('suppliers.errorUpdating', { defaultValue: 'Ошибка при обновлении поставщика' }));
      }
    } finally {
      setEditing(false);
    }
  };

  // Supplier operations handlers
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

  const handleOperationRowClick = async (record: SupplierOperation) => {
    setSelectedOperation(record);
    
    // If it's a receipt operation, fetch receipt details with items
    if (record.type === 'RECEIPT' && record.receipt_id) {
      setLoadingReceipt(true);
      try {
        const receiptData = await stockReceiptsApi.getById(record.receipt_id);
        setReceiptDetails(receiptData);
      } catch (error: unknown) {
        message.error(t('stockReceipts.errorLoadingDetails', { defaultValue: 'Ошибка при загрузке деталей прихода' }));
        setReceiptDetails(null);
      } finally {
        setLoadingReceipt(false);
      }
    } else {
      setReceiptDetails(null);
    }
    
    setOperationsModalVisible(true);
  };

  const handleCloseOperationsModal = () => {
    setOperationsModalVisible(false);
    setSelectedOperation(null);
    setReceiptDetails(null);
  };

  const getOperationTypeColor = (type: string) => {
    switch (type) {
      case 'RECEIPT': return 'green';
      case 'PAYMENT': return 'blue';
      default: return 'default';
    }
  };

  const getOperationTypeText = (type: string) => {
    switch (type) {
      case 'RECEIPT': return 'Приход';
      case 'PAYMENT': return 'Платёж';
      default: return type;
    }
  };

  // Supplier payments handlers
  const handlePaymentsSearch = (value: string) => {
    setPaymentsSearchText(value);
  };

  const handleDeletePayment = async (id: number) => {
    try {
      await supplierPaymentsApi.delete(id);
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
      const createData: CreateSupplierPaymentRequest = {
        supplier_id: values.supplier_id,
        sum: values.sum,
        account_id: selectedAccountId,
      };

      await supplierPaymentsApi.create(createData);
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

  const columns: TableProps<Supplier>['columns'] = [
    {
      title: '№',
      key: 'rowNumber',
      width: 60,
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Баланс',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number, record: Supplier) => (
        <span>
          {balance ? balance.toLocaleString() : '0'} {record.currency || ''}
        </span>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Supplier) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Удалить поставщика?"
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

  const operationsColumns: TableProps<SupplierOperation>['columns'] = [
    {
      title: '№',
      key: 'rowNumber',
      width: 60,
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Поставщик',
      dataIndex: 'supplier_name',
      key: 'supplier_name',
      ellipsis: true,
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
    },
    {
      title: 'Сумма',
      dataIndex: 'sum',
      key: 'sum',
      render: (sum: number) => (
        <span style={{ color: '#52c41a' }}>
          {sum ? sum.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '0 ₽'}
        </span>
      ),
    },
  ];

  const paymentsColumns: TableProps<SupplierPayment>['columns'] = [
    {
      title: '№',
      key: 'rowNumber',
      width: 60,
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Поставщик',
      dataIndex: 'supplier_name',
      key: 'supplier_name',
      ellipsis: true,
    },
    {
      title: 'Сумма',
      dataIndex: 'sum',
      key: 'sum',
      render: (amount: number) => (
        <span style={{ color: '#52c41a' }}>
          <DollarOutlined style={{ marginRight: 4 }} />
          {amount ? amount.toLocaleString() : '0'}
        </span>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: SupplierPayment) => (
        <Space size="small">
          <Popconfirm
            title="Удалить оплату?"
            description="Это действие нельзя отменить, баланс поставщика будет восстановлен"
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
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>Поставщики</Title>
      
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col>
            <Button
              type={activeTab === 'suppliers' ? 'primary' : 'default'}
              icon={<TeamOutlined />}
              onClick={() => setActiveTab('suppliers')}
            >
              Поставщики
            </Button>
          </Col>
          <Col>
            <Button
              type={activeTab === 'operations' ? 'primary' : 'default'}
              icon={<AccountBookOutlined />}
              onClick={() => setActiveTab('operations')}
            >
              Операции поставщиков
            </Button>
          </Col>
          <Col>
            <Button
              type={activeTab === 'payments' ? 'primary' : 'default'}
              icon={<DollarOutlined />}
              onClick={() => setActiveTab('payments')}
            >
              {t('suppliers.payments')}
            </Button>
          </Col>
        </Row>
      </Card>

      {activeTab === 'suppliers' && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={16}>
                <Input
                  placeholder={t('suppliers.searchPlaceholder', { defaultValue: 'Поиск поставщиков...' })}
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
                  {t('suppliers.addSupplier')}
                </Button>
              </Col>
            </Row>
          </Card>

          <Table
            columns={columns}
            dataSource={filteredSuppliers}
            rowKey="id"
            loading={loading}
            pagination={false}
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
                  placeholder={t('suppliers.searchByNamePlaceholder', { defaultValue: 'Поиск по имени поставщика...' })}
                  value={operationsSearchText}
                  onChange={(e) => handleOperationsSearch(e.target.value)}
                  prefix={<SearchOutlined />}
                  allowClear
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <DatePicker
                  placeholder={t('common.filterByDate')}
                  value={operationsFilters.date ? dayjs(operationsFilters.date) : null}
                  onChange={(date) => handleOperationsFilterChange('date', date)}
                  style={{ width: '100%' }}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Select
                  placeholder={t('suppliers.operationType')}
                  value={operationsFilters.type}
                  onChange={(value) => handleOperationsFilterChange('type', value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="RECEIPT">{t('suppliers.receipt')}</Option>
                  <Option value="PAYMENT">{t('suppliers.payment')}</Option>
                </Select>
              </Col>
            </Row>
          </Card>

          <Table
            columns={operationsColumns}
            dataSource={operations.filter(operation => 
              operation.supplier_name.toLowerCase().includes(operationsSearchText.toLowerCase()) ||
              operation.id.toString().includes(operationsSearchText) ||
              operation.supplier_id.toString().includes(operationsSearchText)
            )}
            rowKey="id"
            loading={operationsLoading}
            pagination={false}
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
                  placeholder={t('suppliers.searchPaymentsPlaceholder', { defaultValue: 'Поиск оплат...' })}
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
                  {t('suppliers.addPayment')}
                </Button>
              </Col>
            </Row>
          </Card>

          <Table
            columns={paymentsColumns}
            dataSource={payments.filter(payment => 
              payment.supplier_name.toLowerCase().includes(paymentsSearchText.toLowerCase()) ||
              payment.id.toString().includes(paymentsSearchText)
            )}
            rowKey="id"
            loading={paymentsLoading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            size="small"
          />
        </>
      )}

      <Modal
        title={t('suppliers.create')}
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
            {t('common.cancel')}
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()} loading={creating}>
            {t('common.create')}
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
            label={t('common.name')}
            name="name"
            rules={[{ required: true, message: t('suppliers.enterName', { defaultValue: 'Введите наименование поставщика' }) }]}
          >
            <Input placeholder={t('suppliers.namePlaceholder', { defaultValue: 'Например: ООО Поставщик' })} prefix={<TeamOutlined />} />
          </Form.Item>

          <Form.Item
            label="Телефон"
            name="phone"
          >
            <Input placeholder="+992123456789" prefix={<PhoneOutlined />} />
          </Form.Item>

          <Form.Item
            label="Валюта"
            name="currency"
            initialValue="TJS"
          >
            <Select>
              <Option value="TJS">TJS</Option>
              <Option value="USD">USD</Option>
              <Option value="RUB">RUB</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('suppliers.edit')}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingSupplier(null);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setEditModalVisible(false);
            setEditingSupplier(null);
            form.resetFields();
          }}>
            {t('common.cancel')}
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()} loading={editing}>
            {t('common.update')}
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={form}
          name="editSupplier"
          onFinish={handleUpdate}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            label={t('common.name')}
            name="name"
            rules={[{ required: true, message: t('suppliers.enterName', { defaultValue: 'Введите наименование поставщика' }) }]}
          >
            <Input placeholder={t('suppliers.enterNamePlaceholder', { defaultValue: 'Введите наименование поставщика' })} prefix={<ShopOutlined />} />
          </Form.Item>

          <Form.Item
            label="Телефон"
            name="phone"
          >
            <Input placeholder="+992123456789" prefix={<PhoneOutlined />} />
          </Form.Item>

          <Form.Item
            label="Валюта"
            name="currency"
          >
            <Select>
              <Option value="TJS">TJS</Option>
              <Option value="USD">USD</Option>
              <Option value="RUB">RUB</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('common.products')}
        open={operationsModalVisible}
        onCancel={handleCloseOperationsModal}
        footer={[
          <Button key="close" onClick={handleCloseOperationsModal}>
            {t('common.close')}
          </Button>,
        ]}
        width={600}
      >
        {selectedOperation && selectedOperation.type === 'RECEIPT' ? (
          <div>
            {loadingReceipt ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin size="large" />
              </div>
            ) : receiptDetails?.items && receiptDetails.items.length > 0 ? (
              <Table
                dataSource={receiptDetails.items}
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
                    title: t('suppliers.purchaseCost', { defaultValue: 'Закупка' }),
                    dataIndex: 'purchase_cost',
                    key: 'purchase_cost',
                    width: 100,
                    align: 'right',
                    render: (cost: number | null) => cost ? cost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-',
                  },
                  {
                    title: t('suppliers.sellingPrice', { defaultValue: 'Продажа' }),
                    dataIndex: 'selling_price',
                    key: 'selling_price',
                    width: 100,
                    align: 'right',
                    render: (price: number | null) => price ? price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-',
                  },
                ]}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                {t('suppliers.noProductData', { defaultValue: 'Нет данных о товарах' })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
            {t('suppliers.noProductDataForOperation', { defaultValue: 'Для этой операции нет данных о товарах' })}
          </div>
        )}
      </Modal>

      <Modal
        title={t('suppliers.addPayment')}
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
            label={t('suppliers.supplier')}
            name="supplier_id"
            rules={[{ required: true, message: t('suppliers.selectSupplier', { defaultValue: 'Выберите поставщика' }) }]}
          >
            <Select placeholder={t('suppliers.selectSupplier', { defaultValue: 'Выберите поставщика' })} prefix={<ShopOutlined />}>
              {paymentSuppliers.map(supplier => (
                <Option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t('common.amount')}
            name="sum"
            rules={[
              { required: true, message: t('suppliers.enterAmount', { defaultValue: 'Введите сумму' }) },
              { type: 'number', min: 0.01, message: t('suppliers.amountGreaterThanZero', { defaultValue: 'Сумма должна быть больше 0' }) }
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
            label={t('suppliers.account', { defaultValue: 'Счет оплаты' })}
            required
          >
            <Select
              value={selectedAccountId}
              onChange={(value) => setSelectedAccountId(value)}
              style={{ width: '100%' }}
              placeholder={t('suppliers.selectAccount', { defaultValue: 'Выберите счет' })}
            >
              {accounts.filter(a => a.status === 1).map(account => (
                <Option key={account.id} value={account.id}>
                  {account.name} ({account.type === 'CASH' ? t('accounts.cash', { defaultValue: 'Наличные' }) : t('accounts.electronic', { defaultValue: 'Электронный' })}) - {account.current_balance ? account.current_balance.toLocaleString() : '0'}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
