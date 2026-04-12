import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Card, message, Popconfirm, Form, Input, InputNumber, Row, Col, type TableProps, DatePicker, Modal } from 'antd';
import { DeleteOutlined, SaveOutlined, PlusOutlined, SearchOutlined, DollarOutlined, EditOutlined } from '@ant-design/icons';
import { expensesApi, type Expense, type CreateExpenseRequest, type UpdateExpenseRequest, type ExpenseFilters } from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;

export const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [filters, setFilters] = useState<ExpenseFilters>({ date: dayjs().format('YYYY-MM-DD') });
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await expensesApi.getAll(filters);
      setExpenses(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error('Требуется авторизация');
      } else {
        message.error('Ошибка загрузки расходов');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleDelete = async (id: number) => {
    try {
      await expensesApi.delete(id);
      message.success('Расход успешно удалён');
      fetchExpenses();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } } };
      if (axiosError.response?.status === 404) {
        message.error(axiosError.response.data?.message || 'Expense not found');
      } else {
        message.error('Ошибка удаления расхода');
      }
    }
  };

  const handleCreate = async (values: any) => {
    setCreating(true);
    try {
      const createData: CreateExpenseRequest = {
        description: values.description,
        amount: values.amount,
        expense_date: dayjs().format('YYYY-MM-DD'),
      };

      await expensesApi.create(createData);
      message.success('Расход успешно создан');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchExpenses();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string; error?: string } }; message?: string };
      
      if (axiosError.response?.status === 400) {
        const errorMessage = axiosError.response.data?.message || axiosError.response.data?.error || 'Check required fields';
        message.error(errorMessage);
      } else if (axiosError.message?.includes('Network Error')) {
        message.error('Server unavailable. Check connection.');
      } else {
        message.error('Ошибка создания расхода');
      }
    } finally {
      setCreating(false);
    }
  };

  const openCreateModal = () => {
    setCreateModalVisible(true);
    createForm.resetFields();
  };

  const handleEdit = async (values: any) => {
    setEditing(true);
    try {
      const updateData: UpdateExpenseRequest = {
        description: values.description,
        amount: values.amount,
      };

      await expensesApi.update(selectedExpense!.id, updateData);
      message.success('Расход успешно обновлён');
      setEditModalVisible(false);
      setSelectedExpense(null);
      editForm.resetFields();
      fetchExpenses();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string; error?: string } }; message?: string };
      
      if (axiosError.response?.status === 400) {
        const errorMessage = axiosError.response.data?.message || axiosError.response.data?.error || 'Check required fields';
        message.error(errorMessage);
      } else if (axiosError.response?.status === 404) {
        message.error(axiosError.response.data?.message || 'Expense not found');
      } else if (axiosError.message?.includes('Network Error')) {
        message.error('Server unavailable. Check connection.');
      } else {
        message.error('Ошибка обновления расхода');
      }
    } finally {
      setEditing(false);
    }
  };

  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense);
    editForm.setFieldsValue({
      description: expense.description,
      amount: expense.amount,
    });
    setEditModalVisible(true);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters };
    
    if (key === 'date') {
      newFilters.date = value ? value.format('YYYY-MM-DD') : undefined;
    }
    
    setFilters(newFilters);
  };

  const columns: TableProps<Expense>['columns'] = [
    {
      title: '№',
      key: 'rowNumber',
      width: 60,
      responsive: ['md'],
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: 'Дата',
      dataIndex: 'expense_date',
      key: 'expense_date',
      render: (date: string) => new Date(date).toLocaleDateString(),
      responsive: ['sm'],
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      responsive: ['sm'],
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span style={{ color: '#ff4d4f' }}>
          <DollarOutlined style={{ marginRight: 4 }} />
          {amount.toLocaleString()}
        </span>
      ),
      responsive: ['sm'],
    },
    {
      title: 'Создал',
      dataIndex: 'created_by_name',
      key: 'created_by_name',
      ellipsis: true,
      responsive: ['md'],
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Expense) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
            size="small"
            title="Редактировать"
          />
          <Popconfirm
            title="Удалить расход?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDelete(record.id)}
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
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>Расходы</Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={12}>
            <Input
              placeholder="Поиск по описанию или ID..."
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DatePicker
              placeholder="Фильтр по дате"
              value={filters.date ? dayjs(filters.date) : null}
              onChange={(date) => handleFilterChange('date', date)}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
              style={{ width: '100%' }}
            >
              Добавить расход
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={expenses.filter(expense => 
          expense.description.toLowerCase().includes(searchText.toLowerCase()) ||
          expense.id.toString().includes(searchText)
        )}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
        size="small"
      />

      <Modal
        title="Добавить расход"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setCreateModalVisible(false);
            createForm.resetFields();
          }}>
            Отмена
          </Button>,
          <Button key="submit" type="primary" onClick={() => createForm.submit()} loading={creating}>
            Создать
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={createForm}
          name="createExpense"
          onFinish={handleCreate}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="description"
            label="Описание"
            rules={[{ required: true, message: 'Введите описание' }]}
          >
            <Input.TextArea rows={3} placeholder="Введите описание расхода" />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Сумма"
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

      <Modal
        title="Редактировать расход"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedExpense(null);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          name="editExpense"
          onFinish={handleEdit}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="description"
            label="Описание"
            rules={[{ required: true, message: 'Введите описание' }]}
          >
            <Input.TextArea rows={3} placeholder="Введите описание расхода" />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Сумма"
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

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={editing}
                icon={<SaveOutlined />}
                size="large"
              >
                Обновить расход
              </Button>
              <Button
                onClick={() => {
                  setEditModalVisible(false);
                  setSelectedExpense(null);
                  editForm.resetFields();
                }}
                size="large"
              >
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
