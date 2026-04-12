import { useEffect, useState } from 'react';
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
  Tag
} from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TeamOutlined,
  AccountBookOutlined
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
        message.error('Требуется авторизация');
      } else {
        message.error('Ошибка загрузки должников');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOperations = async () => {
    setOperationsLoading(true);
    try {
      const data = await debtorOperationsApi.getAll(filters);
      setOperations(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error('Требуется авторизация');
      } else {
        message.error('Ошибка загрузки операций должников');
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
      debt_amount: debtor.debt_amount,
      description: debtor.description,
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await debtorsApi.delete(id);
      message.success('Должник успешно удален');
      fetchDebtors();
    } catch (error: unknown) {
      message.error('Ошибка при удалении должника');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingDebtor) {
        await debtorsApi.update(editingDebtor.id, values as UpdateDebtorRequest);
        message.success('Должник успешно обновлен');
      } else {
        await debtorsApi.create(values as CreateDebtorRequest);
        message.success('Должник успешно создан');
      }
      setModalVisible(false);
      form.resetFields();
      fetchDebtors();
    } catch (error: unknown) {
      message.error('Ошибка при сохранении должника');
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
      message.success('Операция успешно удалена');
      fetchOperations();
    } catch (error: unknown) {
      message.error('Ошибка при удалении операции');
    }
  };

  const handleOperationSubmit = async (values: any) => {
    try {
      if (operationType === 'BORROWED') {
        await debtorOperationsApi.createBorrowed(values as CreateBorrowedRequest);
        message.success('Операция займа успешно создана');
      } else {
        await debtorOperationsApi.createReturned(values as CreateReturnedRequest);
        message.success('Операция возврата успешно создана');
      }
      setOperationModalVisible(false);
      operationForm.resetFields();
      fetchOperations();
    } catch (error: unknown) {
      message.error('Ошибка при сохранении операции');
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
      case 'BORROWED': return 'Займ';
      case 'RETURNED': return 'Возврат';
      default: return type;
    }
  };

  const debtorColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      responsive: ['md'] as ('md' | 'xxxl' | 'xxl' | 'xl' | 'lg' | 'sm' | 'xs')[],
    },
    {
      title: 'ФИО',
      dataIndex: 'full_name',
      key: 'full_name',
      ellipsis: true,
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      responsive: ['sm'] as ('md' | 'xxxl' | 'xxl' | 'xl' | 'lg' | 'sm' | 'xs')[],
    },
    {
      title: 'Сумма долга',
      dataIndex: 'debt_amount',
      key: 'debt_amount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => amount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }),
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      responsive: ['lg'] as ('md' | 'xxxl' | 'xxl' | 'xl' | 'lg' | 'sm' | 'xs')[],
    },
    {
      title: 'Дата создания',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      responsive: ['md'] as ('md' | 'xxxl' | 'xxl' | 'xl' | 'lg' | 'sm' | 'xs')[],
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: 'Действия',
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
            title="Вы уверены, что хотите удалить этого должника?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
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
      responsive: ['md'] as ('md' | 'xxxl' | 'xxl' | 'xl' | 'lg' | 'sm' | 'xs')[],
    },
    {
      title: 'Должник',
      dataIndex: 'debtor_name',
      key: 'debtor_name',
      ellipsis: true,
    },
    {
      title: 'Тип',
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
      title: 'Сумма',
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
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      responsive: ['lg'] as ('md' | 'xxxl' | 'xxl' | 'xl' | 'lg' | 'sm' | 'xs')[],
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      responsive: ['sm'] as ('md' | 'xxxl' | 'xxl' | 'xl' | 'lg' | 'sm' | 'xs')[],
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (_: any, record: DebtorOperation) => (
        <Space size="small">
          <Popconfirm
            title="Вы уверены, что хотите удалить эту операцию?"
            onConfirm={() => handleDeleteOperation(record.id)}
            okText="Да"
            cancelText="Нет"
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
          Должники
        </span>
      ),
      children: (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={16}>
                <Input
                  placeholder="Поиск по ФИО или телефону"
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
                  Добавить должника
                </Button>
              </Col>
            </Row>
          </Card>

          <Table
            columns={debtorColumns}
            dataSource={debtors.filter(debtor => 
              debtor.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
              debtor.phone.includes(searchText) ||
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
          Операции
        </span>
      ),
      children: (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={8}>
                <Input
                  placeholder="Поиск по ФИО или описанию"
                  prefix={<SearchOutlined />}
                  value={operationsSearchText}
                  onChange={(e) => handleOperationsSearch(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <DatePicker
                  placeholder="Дата"
                  value={filters.date ? dayjs(filters.date) : null}
                  onChange={(value) => handleFilterChange('date', value)}
                  style={{ width: '100%' }}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Select
                  placeholder="Тип"
                  value={filters.type}
                  onChange={(value) => handleFilterChange('type', value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="BORROWED">Займ</Option>
                  <Option value="RETURNED">Возврат</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Space style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    danger
                    icon={<ArrowUpOutlined />}
                    onClick={() => handleCreateOperation('BORROWED')}
                    style={{ flex: 1 }}
                  >
                    Займ
                  </Button>
                  <Button
                    type="primary"
                    icon={<ArrowDownOutlined />}
                    onClick={() => handleCreateOperation('RETURNED')}
                    style={{ flex: 1 }}
                  >
                    Возврат
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <Table
            columns={operationColumns}
            dataSource={operations.filter(operation => 
              operation.debtor_name.toLowerCase().includes(operationsSearchText.toLowerCase()) ||
              operation.description.toLowerCase().includes(operationsSearchText.toLowerCase()) ||
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
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>Должники</Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <Modal
        title={editingDebtor ? 'Редактировать должника' : 'Добавить должника'}
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
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            {editingDebtor ? 'Сохранить' : 'Создать'}
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
            label="ФИО"
            name="full_name"
            rules={[{ required: true, message: 'Введите ФИО должника' }]}
          >
            <Input placeholder="Введите ФИО должника" />
          </Form.Item>
          
          <Form.Item
            label="Телефон"
            name="phone"
            rules={[{ required: true, message: 'Введите номер телефона' }]}
          >
            <Input placeholder="Введите номер телефона" />
          </Form.Item>
          
          <Form.Item
            label="Сумма долга"
            name="debt_amount"
            rules={[
              { required: true, message: 'Введите сумму долга' },
              { type: 'number', min: 0.01, message: 'Сумма должна быть положительной' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Введите сумму долга"
              min={0.01}
              step={0.01}
              precision={2}
            />
          </Form.Item>
          
          <Form.Item
            label="Описание"
            name="description"
            rules={[{ required: true, message: 'Введите описание долга' }]}
          >
            <TextArea
              placeholder="Введите описание долга"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={operationType === 'BORROWED' ? 'Создать операцию займа' : 'Создать операцию возврата'}
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
            Отмена
          </Button>,
          <Button key="submit" type="primary" onClick={() => operationForm.submit()}>
            Создать
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
              { type: 'number', min: 0.01, message: 'Сумма должна быть положительной' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Введите сумму"
              min={0.01}
              step={0.01}
              precision={2}
            />
          </Form.Item>
          
          <Form.Item
            label="Описание"
            name="description"
            rules={[{ required: true, message: 'Введите описание' }]}
          >
            <TextArea
              placeholder="Введите описание операции"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
