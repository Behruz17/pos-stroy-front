import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Table, 
  Button, 
  Space, 
  Typography, 
  Card, 
  message, 
  Input, 
  Row, 
  Col, 
  Modal, 
  Form, 
  InputNumber,
  Popconfirm,
  Tabs,
  Select,
  DatePicker,
  Tag,
  Statistic
} from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TeamOutlined,
  AccountBookOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { 
  debtorsApi, 
  debtorOperationsApi,
  type Debtor,
  type DebtorOperation,
  type DebtorOperationFilters,
  type CreateDebtorRequest,
  type UpdateDebtorRequest,
  type CreateBorrowedRequest,
  type CreateReturnedRequest
} from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export const Debtors = () => {
  const { t } = useTranslation();
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDebtor, setEditingDebtor] = useState<Debtor | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('debtors');
  
  // Operations state
  const [operations, setOperations] = useState<DebtorOperation[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [operationsSearchText, setOperationsSearchText] = useState('');
  const [filters, setFilters] = useState<DebtorOperationFilters>({});
  const [operationModalVisible, setOperationModalVisible] = useState(false);
  const [operationType, setOperationType] = useState<'BORROWED' | 'RETURNED'>('BORROWED');
  const [operationForm] = Form.useForm();

  const fetchDebtors = async () => {
    setLoading(true);
    try {
      const data = await debtorsApi.getAll();
      setDebtors(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error(t('errors.unauthorized'));
      } else {
        message.error(t('debtors.errorLoading', { defaultValue: 'Ошибка загрузки должников' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const getTotalDebt = () => {
    return debtors.reduce((total, debtor) => total + (Number(debtor.debt_amount) || 0), 0);
  };

  const fetchOperations = async () => {
    setOperationsLoading(true);
    try {
      const data = await debtorOperationsApi.getAll(filters);
      setOperations(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error(t('errors.unauthorized'));
      } else {
        message.error(t('debtors.operationsErrorLoading', { defaultValue: 'Ошибка загрузки операций должников' }));
      }
    } finally {
      setOperationsLoading(false);
    }
  };

  useEffect(() => {
    fetchDebtors();
    fetchOperations();
  }, []);

  useEffect(() => {
    if (activeTab === 'operations') {
      fetchOperations();
    }
  }, [filters, activeTab]);

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleOperationsSearch = (value: string) => {
    setOperationsSearchText(value);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters };
    
    if (key === 'date') {
      newFilters.date = value ? value.format('YYYY-MM-DD') : undefined;
    } else if (key === 'type') {
      newFilters.type = value;
    } else if (key === 'debtor_id') {
      newFilters.debtor_id = value;
    }
    
    setFilters(newFilters);
  };



  const handleCreate = () => {
    setEditingDebtor(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEdit = (debtor: Debtor) => {
    setEditingDebtor(debtor);
    setModalVisible(true);
    form.setFieldsValue({
      full_name: debtor.full_name,
      phone: debtor.phone,
      description: debtor.description,
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await debtorsApi.delete(id);
      message.success(t('debtors.debtorDeleted', { defaultValue: 'Должник успешно удален' }));
      fetchDebtors();
    } catch (error: unknown) {
      message.error(t('debtors.errorDeleting', { defaultValue: 'Ошибка при удалении должника' }));
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingDebtor) {
        const updateData: UpdateDebtorRequest = {
          full_name: values.full_name,
          phone: values.phone,
          description: values.description,
        };
        await debtorsApi.update(editingDebtor.id, updateData);
        message.success(t('debtors.debtorUpdated', { defaultValue: 'Должник успешно обновлен' }));
      } else {
        const createData: CreateDebtorRequest = {
          full_name: values.full_name,
          phone: values.phone,
          ...(values.debt_amount && values.debt_amount > 0 && { initial_debt: values.debt_amount }),
          description: values.description,
        };
        await debtorsApi.create(createData);
        if (values.debt_amount && values.debt_amount > 0) {
          message.success(t('debtors.debtorCreatedWithDebt', { defaultValue: 'Должник с начальным долгом успешно создан' }));
        } else {
          message.success(t('debtors.debtorCreated', { defaultValue: 'Должник успешно создан' }));
        }
      }
      setModalVisible(false);
      form.resetFields();
      fetchDebtors();
    } catch (error: unknown) {
      message.error(t('debtors.errorSaving', { defaultValue: 'Ошибка при сохранении должника' }));
    }
  };

  const handleCreateOperation = (type: 'BORROWED' | 'RETURNED') => {
    setOperationType(type);
    setOperationModalVisible(true);
    operationForm.resetFields();
  };

  const handleDeleteOperation = async (id: number) => {
    try {
      await debtorOperationsApi.delete(id);
      message.success(t('debtors.operationDeleted', { defaultValue: 'Операция успешно удалена' }));
      fetchOperations();
    } catch (error: unknown) {
      message.error(t('debtors.errorDeletingOperation', { defaultValue: 'Ошибка при удалении операции' }));
    }
  };

  const handleOperationSubmit = async (values: any) => {
    try {
      if (operationType === 'BORROWED') {
        await debtorOperationsApi.createBorrowed(values as CreateBorrowedRequest);
        message.success(t('debtors.borrowOperationCreated', { defaultValue: 'Операция займа успешно создана' }));
      } else {
        await debtorOperationsApi.createReturned(values as CreateReturnedRequest);
        message.success(t('debtors.returnOperationCreated', { defaultValue: 'Операция возврата успешно создана' }));
      }
      setOperationModalVisible(false);
      operationForm.resetFields();
      fetchOperations();
    } catch (error: unknown) {
      message.error(t('debtors.errorSavingOperation', { defaultValue: 'Ошибка при сохранении операции' }));
    }
  };

  const getOperationTypeColor = (type: string) => {
    switch (type) {
      case 'BORROWED': return 'red';
      case 'RETURNED': return 'green';
      default: return 'default';
    }
  };

  const getOperationTypeText = (type: string) => {
    switch (type) {
      case 'BORROWED': return t('debtors.borrowed');
      case 'RETURNED': return t('debtors.returned');
      default: return type;
    }
  };

  const debtorColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('debtors.fullName'),
      dataIndex: 'full_name',
      key: 'full_name',
      ellipsis: true,
    },
    {
      title: t('common.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: t('debtors.debtAmount'),
      dataIndex: 'debt_amount',
      key: 'debt_amount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => amount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      render: (_: any, record: Debtor) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title={t('debtors.confirmDelete')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const operationColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('debtors.debtor'),
      dataIndex: 'debtor_name',
      key: 'debtor_name',
      ellipsis: true,
    },
    {
      title: t('common.type'),
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={getOperationTypeColor(type)}>
          {getOperationTypeText(type)}
        </Tag>
      ),
    },
    {
      title: t('common.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right' as const,
      render: (amount: number, record: DebtorOperation) => (
        <span style={{ color: record.type === 'BORROWED' ? '#ff4d4f' : '#52c41a' }}>
          {amount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
        </span>
      ),
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('common.date'),
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      render: (_: any, record: DebtorOperation) => (
        <Space size="small">
          <Popconfirm
            title={t('debtors.confirmDeleteOperation')}
            onConfirm={() => handleDeleteOperation(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'debtors',
      label: (
        <span>
          <TeamOutlined />
          {t('debtors.title')}
        </span>
      ),
      children: (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={16}>
                <Input
                  placeholder={t('debtors.searchPlaceholder', { defaultValue: 'Поиск по ФИО или телефону' })}
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
                  onClick={handleCreate}
                  style={{ width: '100%' }}
                >
                  {t('debtors.addDebtor')}
                </Button>
              </Col>
            </Row>
          </Card>

          <Table
            columns={debtorColumns}
            dataSource={debtors.filter(debtor => 
              !searchText || 
              (debtor.full_name && debtor.full_name.toLowerCase().includes(searchText.toLowerCase())) ||
              (debtor.phone && debtor.phone.includes(searchText)) ||
              debtor.id.toString().includes(searchText)
            )}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            size="small"
          />
        </div>
      ),
    },
    {
      key: 'operations',
      label: (
        <span>
          <AccountBookOutlined />
          {t('debtors.operations')}
        </span>
      ),
      children: (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={8}>
                <Input
                  placeholder={t('debtors.searchOperationsPlaceholder', { defaultValue: 'Поиск по ФИО или описанию' })}
                  prefix={<SearchOutlined />}
                  value={operationsSearchText}
                  onChange={(e) => handleOperationsSearch(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <DatePicker
                  placeholder={t('common.date')}
                  value={filters.date ? dayjs(filters.date) : null}
                  onChange={(value) => handleFilterChange('date', value)}
                  style={{ width: '100%' }}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Select
                  placeholder={t('common.type')}
                  value={filters.type}
                  onChange={(value) => handleFilterChange('type', value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="BORROWED">{t('debtors.borrowed')}</Option>
                  <Option value="RETURNED">{t('debtors.returned')}</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Space style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    danger
                    icon={<ArrowUpOutlined />}
                    onClick={() => handleCreateOperation('BORROWED')}
                    style={{ flex: 1 }}
                  >
                    {t('debtors.borrowed')}
                  </Button>
                  <Button
                    type="primary"
                    icon={<ArrowDownOutlined />}
                    onClick={() => handleCreateOperation('RETURNED')}
                    style={{ flex: 1 }}
                  >
                    {t('debtors.returned')}
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <Table
            columns={operationColumns}
            dataSource={operations.filter(operation => 
              !operationsSearchText || 
              (operation.debtor_name && operation.debtor_name.toLowerCase().includes(operationsSearchText.toLowerCase())) ||
              (operation.description && operation.description.toLowerCase().includes(operationsSearchText.toLowerCase())) ||
              operation.id.toString().includes(operationsSearchText)
            )}
            rowKey="id"
            loading={operationsLoading}
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
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>{t('debtors.title')}</Title>
      
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
              title="Количество должников"
              value={debtors.length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <Modal
        title={editingDebtor ? t('debtors.edit') : t('debtors.create')}
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
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            {editingDebtor ? t('common.save') : t('common.create')}
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label={t('debtors.fullName')}
            name="full_name"
            rules={[{ required: true, message: t('debtors.enterFullName', { defaultValue: 'Введите ФИО должника' }) }]}
          >
            <Input placeholder={t('debtors.enterFullName', { defaultValue: 'Введите ФИО должника' })} />
          </Form.Item>
          
          <Form.Item
            label={t('common.phone')}
            name="phone"
          >
            <Input placeholder={t('debtors.enterPhone', { defaultValue: 'Введите номер телефона' })} />
          </Form.Item>
          
          {!editingDebtor && (
            <Form.Item
              label={t('debtors.debtAmount')}
              name="debt_amount"
              rules={[
                { type: 'number', min: 0, message: 'Сумма не может быть отрицательной' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Введите сумму долга"
                min={0}
                step={0.01}
                precision={2}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title={operationType === 'BORROWED' ? t('debtors.createBorrowOperation') : t('debtors.createReturnOperation')}
        open={operationModalVisible}
        onCancel={() => {
          setOperationModalVisible(false);
          operationForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setOperationModalVisible(false);
            operationForm.resetFields();
          }}>
            {t('common.cancel')}
          </Button>,
          <Button key="submit" type="primary" onClick={() => operationForm.submit()}>
            {t('common.create')}
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={operationForm}
          layout="vertical"
          onFinish={handleOperationSubmit}
        >
          <Form.Item
            label="Должник"
            name="debtor_id"
            rules={[{ required: true, message: 'Выберите должника' }]}
          >
            <Select
              placeholder="Выберите должника"
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {debtors.map(debtor => (
                <Option key={debtor.id} value={debtor.id}>
                  {debtor.full_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            label="Сумма"
            name="amount"
            rules={[
              { required: true, message: 'Введите сумму' },
              { type: 'number', min: 0, message: 'Сумма не может быть отрицательной' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Введите сумму"
              min={0}
              step={0.01}
              precision={2}
            />
          </Form.Item>
          
          <Form.Item
            label={t('common.description')}
            name="description">
            <TextArea
              placeholder={t('debtors.enterDescription', { defaultValue: 'Введите описание операции (необязательно)' })}
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
