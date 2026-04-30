import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Card, message, Popconfirm, Form, Input, InputNumber, Row, Col, type TableProps, DatePicker, Modal, Select, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { DeleteOutlined, SaveOutlined, PlusOutlined, SearchOutlined, DollarOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';
import { expensesApi, accountsApi, type Expense, type CreateExpenseRequest, type UpdateExpenseRequest, type ExpenseFilters, type Account, type ExpenseRecipient, type CreateExpenseRecipientRequest, type UpdateExpenseRecipientRequest } from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

export const Expenses = () => {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [filters, setFilters] = useState<ExpenseFilters>({ date: dayjs().format('YYYY-MM-DD') });
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(1);
  const [recipients, setRecipients] = useState<ExpenseRecipient[]>([]);
  const [recipientModalVisible, setRecipientModalVisible] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<ExpenseRecipient | null>(null);
  const [recipientCreating, setRecipientCreating] = useState(false);
  const [recipientForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('expenses');

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

  const fetchRecipients = async () => {
    try {
      const data = await expensesApi.getRecipients();
      setRecipients(data);
    } catch (error) {
      // Silently fail
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await expensesApi.getAll(filters);
      setExpenses(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error(t('errors.unauthorized'));
      } else {
        message.error(t('expenses.errorLoading', { defaultValue: 'Ошибка загрузки расходов' }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchAccounts();
    fetchRecipients();
  }, [filters]);

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleDelete = async (id: number) => {
    try {
      await expensesApi.delete(id);
      message.success(t('expenses.expenseDeleted', { defaultValue: 'Расход успешно удалён' }));
      fetchExpenses();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } } };
      if (axiosError.response?.status === 404) {
        message.error(axiosError.response.data?.message || 'Expense not found');
      } else {
        message.error(t('expenses.errorDeleting', { defaultValue: 'Ошибка удаления расхода' }));
      }
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const createData: CreateExpenseRequest = {
        description: values.description,
        amount: values.amount,
        recipient_id: values.recipient_id,
        account_id: selectedAccountId,
        expense_date: values.date ? values.date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      };

      await expensesApi.create(createData);
      message.success(t('expenses.expenseCreated', { defaultValue: 'Расход создан' }));
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchExpenses();
    } catch (error: unknown) {
      console.error('Error creating expense:', error);
      message.error(t('expenses.errorCreating', { defaultValue: 'Ошибка создания расхода' }));
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
        recipient_id: values.recipient_id,
      };

      await expensesApi.update(selectedExpense!.id, updateData);
      message.success(t('expenses.expenseUpdated', { defaultValue: 'Расход успешно обновлён' }));
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
        message.error(t('errors.networkError'));
      } else {
        message.error(t('expenses.errorUpdating', { defaultValue: 'Ошибка обновления расхода' }));
      }
    } finally {
      setEditing(false);
    }
  };

  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense);
    editForm.setFieldsValue({
      description: expense.description,
      amount: parseFloat(expense.amount),
      recipient_id: expense.recipient_id,
    });
    setEditModalVisible(true);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters };
    
    if (key === 'date') {
      newFilters.date = value ? value.format('YYYY-MM-DD') : undefined;
    } else if (key === 'recipient_id') {
      newFilters.recipient_id = value;
    } else if (key === 'created_by') {
      newFilters.created_by = value;
    }
    
    setFilters(newFilters);
  };

  // Recipients management functions
  const openCreateRecipientModal = () => {
    setEditingRecipient(null);
    setRecipientModalVisible(true);
    recipientForm.resetFields();
  };

  const openEditRecipientModal = (recipient: ExpenseRecipient) => {
    setEditingRecipient(recipient);
    recipientForm.setFieldsValue({
      name: recipient.name,
      type: recipient.type,
    });
    setRecipientModalVisible(true);
  };

  const handleCreateRecipient = async (values: any) => {
    setRecipientCreating(true);
    try {
      const createData: CreateExpenseRecipientRequest = {
        name: values.name,
        type: values.type,
      };

      await expensesApi.createRecipient(createData);
      message.success(t('expenses.recipientCreated', { defaultValue: 'Получатель успешно создан' }));
      setRecipientModalVisible(false);
      recipientForm.resetFields();
      fetchRecipients();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      message.error(axiosError.response?.data?.message || t('expenses.errorCreatingRecipient', { defaultValue: 'Ошибка создания получателя' }));
    } finally {
      setRecipientCreating(false);
    }
  };

  const handleUpdateRecipient = async (values: any) => {
    setRecipientCreating(true);
    try {
      const updateData: UpdateExpenseRecipientRequest = {
        name: values.name,
        type: values.type,
      };

      await expensesApi.updateRecipient(editingRecipient!.id, updateData);
      message.success(t('expenses.recipientUpdated', { defaultValue: 'Получатель успешно обновлён' }));
      setRecipientModalVisible(false);
      setEditingRecipient(null);
      recipientForm.resetFields();
      fetchRecipients();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      message.error(axiosError.response?.data?.message || t('expenses.errorUpdatingRecipient', { defaultValue: 'Ошибка обновления получателя' }));
    } finally {
      setRecipientCreating(false);
    }
  };

  const handleDeleteRecipient = async (id: number) => {
    try {
      await expensesApi.deleteRecipient(id);
      message.success(t('expenses.recipientDeleted', { defaultValue: 'Получатель успешно удалён' }));
      fetchRecipients();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      message.error(axiosError.response?.data?.message || t('expenses.errorDeletingRecipient', { defaultValue: 'Ошибка удаления получателя' }));
    }
  };

  const handleSyncRecipients = async () => {
    try {
      const response = await expensesApi.syncRecipients();
      message.success(t('expenses.recipientsSynced', { defaultValue: 'Сотрудники синхронизированы', synced_count: response.synced_count }));
      fetchRecipients();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      message.error(axiosError.response?.data?.message || t('expenses.errorSyncingRecipients', { defaultValue: 'Ошибка синхронизации сотрудников' }));
    }
  };

  const handleRecipientModalCancel = () => {
    setRecipientModalVisible(false);
    setEditingRecipient(null);
    recipientForm.resetFields();
  };

  const columns: TableProps<Expense>['columns'] = [
    {
      title: '№',
      key: 'rowNumber',
      width: 60,
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: t('common.date'),
      dataIndex: 'expense_date',
      key: 'expense_date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('common.amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span style={{ color: '#ff4d4f' }}>
          <DollarOutlined style={{ marginRight: 4 }} />
          {amount.toLocaleString()}
        </span>
      ),
    },
    {
      title: t('expenses.recipient', { defaultValue: 'Получатель' }),
      dataIndex: 'display_name',
      key: 'display_name',
      render: (display_name: string, record: Expense) => (
        <span style={{ 
          color: record.recipient_id ? '#52c41a' : '#1890ff',
          fontWeight: 'bold'
        }}>
          {display_name || '-'}
        </span>
      ),
    },
    {
      title: t('common.createdBy'),
      dataIndex: 'created_by_name',
      key: 'created_by_name',
      ellipsis: true,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Expense) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
            size="small"
            title={t('common.edit')}
          />
          <Popconfirm
            title={t('expenses.confirmDelete')}
            description={t('expenses.deleteWarning')}
            onConfirm={() => handleDelete(record.id)}
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
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>{t('expenses.title')}</Title>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'expenses',
            label: (
              <span>
                <DollarOutlined />
                {t('expenses.expensesTab', { defaultValue: 'Расходы' })}
              </span>
            ),
            children: (
              <>
                <Card style={{ marginBottom: 16 }}>
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} md={12}>
                      <Input
                        placeholder={t('expenses.searchPlaceholder')}
                        value={searchText}
                        onChange={(e) => handleSearch(e.target.value)}
                        prefix={<SearchOutlined />}
                        allowClear
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                      <DatePicker
                        placeholder={t('common.filterByDate')}
                        value={filters.date ? dayjs(filters.date) : null}
                        onChange={(date) => handleFilterChange('date', date)}
                        style={{ width: '100%' }}
                        allowClear
                      />
                    </Col>
                    <Col xs={24} sm={12} md={3}>
                      <Select
                        placeholder={t('expenses.filterByRecipient', { defaultValue: 'Фильтр по получателю' })}
                        value={filters.recipient_id}
                        onChange={(value) => handleFilterChange('recipient_id', value)}
                        style={{ width: '100%' }}
                        allowClear
                      >
                        {recipients.map(recipient => (
                          <Option key={recipient.id} value={recipient.id}>
                            {recipient.display_name}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                    <Col xs={24} sm={12} md={3}>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={openCreateModal}
                        style={{ width: '100%' }}
                      >
                        {t('expenses.addExpense')}
                      </Button>
                    </Col>
                  </Row>
                </Card>

                <Table
                  columns={columns}
                  dataSource={expenses.filter(expense => 
                    searchText === '' || 
                    expense.description.toLowerCase().includes(searchText.toLowerCase())
                  )}
                  loading={loading}
                  rowKey="id"
                  pagination={{
                    showSizeChanger: true,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} из ${total} ${t('expenses.records', { defaultValue: 'записей' })}`,
                  }}
                />
              </>
            ),
          },
          {
            key: 'recipients',
            label: (
              <span>
                <TeamOutlined />
                {t('expenses.recipientsTab', { defaultValue: 'Получатели' })}
              </span>
            ),
            children: (
              <>
                <Card style={{ marginBottom: 16 }}>
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} md={4}>
                      <Button
                        icon={<TeamOutlined />}
                        onClick={handleSyncRecipients}
                        style={{ width: '100%' }}
                        title={t('expenses.syncRecipients', { defaultValue: 'Синхронизировать сотрудников' })}
                      >
                        {t('expenses.sync', { defaultValue: 'Синхр.' })}
                      </Button>
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={openCreateRecipientModal}
                        style={{ width: '100%' }}
                        title={t('expenses.addRecipient', { defaultValue: 'Добавить получателя' })}
                      >
                        {t('expenses.addRecipient', { defaultValue: 'Добавить получателя' })}
                      </Button>
                    </Col>
                  </Row>
                </Card>

                <Table
                  dataSource={recipients}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    {
                      title: '№',
                      key: 'rowNumber',
                      width: 50,
                      render: (_: unknown, __: any, index: number) => index + 1,
                    },
                    {
                      title: t('expenses.recipientName', { defaultValue: 'Название' }),
                      dataIndex: 'display_name',
                      key: 'display_name',
                      render: (display_name: string, record: ExpenseRecipient) => (
                        <Space>
                          <span style={{ 
                            color: record.type === 'employee' ? '#52c41a' : '#1890ff',
                            fontWeight: 'bold'
                          }}>
                            {display_name}
                          </span>
                          {record.type === 'employee' && (
                            <span style={{ fontSize: 12, color: '#666' }}>
                              ({t('expenses.employee', { defaultValue: 'Сотрудник' })})
                            </span>
                          )}
                        </Space>
                      ),
                    },
                    {
                      title: t('common.actions', { defaultValue: 'Действия' }),
                      key: 'actions',
                      width: 100,
                      render: (_: unknown, record: ExpenseRecipient) => (
                        <Space>
                          <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => openEditRecipientModal(record)}
                            size="small"
                            title={t('common.edit', { defaultValue: 'Изменить' })}
                            disabled={record.type === 'employee'} // Cannot edit employee recipients
                          />
                          <Popconfirm
                            title={t('expenses.deleteRecipientConfirm', { defaultValue: 'Вы уверены, что хотите удалить этого получателя?' })}
                            onConfirm={() => handleDeleteRecipient(record.id)}
                            okText={t('common.yes', { defaultValue: 'Да' })}
                            cancelText={t('common.no', { defaultValue: 'Нет' })}
                            disabled={record.type === 'employee'} // Cannot delete employee recipients
                          >
                            <Button
                              type="link"
                              danger
                              icon={<DeleteOutlined />}
                              size="small"
                              title={t('common.delete', { defaultValue: 'Удалить' })}
                              disabled={record.type === 'employee'}
                            />
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
        ]}
      />

      {/* Create Expense Modal */}
      <Modal
        title={t('expenses.createExpense')}
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          name="createExpense"
          onFinish={handleCreate}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="description"
            label={t('common.description')}
            rules={[{ required: true, message: t('expenses.enterDescription') }]}
          >
            <Input.TextArea rows={3} placeholder={t('expenses.enterDescription')} />
          </Form.Item>

          <Form.Item
            name="amount"
            label={t('common.amount')}
            rules={[
              { required: true, message: t('expenses.enterAmount') },
              { type: 'number', min: 0.01, message: t('expenses.amountGreaterThanZero') }
            ]}>
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
            name="recipient_id"
            label={t('expenses.recipient', { defaultValue: 'Получатель' })}
            rules={[{ required: false, message: t('expenses.selectRecipient', { defaultValue: 'Выберите получателя' }) }]}
          >
            <Select
              placeholder={t('expenses.selectRecipient', { defaultValue: 'Выберите получателя' })}
              allowClear
            >
              {recipients.map(recipient => (
                <Option key={recipient.id} value={recipient.id}>
                  {recipient.display_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t('expenses.account', { defaultValue: 'Счет оплаты' })}
          >
            <Select
              value={selectedAccountId}
              onChange={(value) => setSelectedAccountId(value)}
              style={{ width: '100%' }}
            >
              {accounts.map(account => (
                <Option key={account.id} value={account.id}>
                  {account.name} ({account.type === 'CASH' ? t('accounts.cash', { defaultValue: 'Наличные' }) : t('accounts.electronic', { defaultValue: 'Электронный' })}) - {account.current_balance.toLocaleString()}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        title={t('expenses.editExpense')}
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
            label={t('common.description')}
            rules={[{ required: true, message: t('expenses.enterDescription') }]}>
            <Input.TextArea rows={3} placeholder={t('expenses.enterDescription')} />
          </Form.Item>

          <Form.Item
            name="amount"
            label={t('common.amount')}
            rules={[
              { required: true, message: t('expenses.enterAmount') },
              { type: 'number', min: 0.01, message: t('expenses.amountGreaterThanZero') }
            ]}>
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
            name="recipient_id"
            label={t('expenses.recipient', { defaultValue: 'Получатель' })}
            rules={[{ required: false, message: t('expenses.selectRecipient', { defaultValue: 'Выберите получателя' }) }]}
          >
            <Select
              placeholder={t('expenses.selectRecipient', { defaultValue: 'Выберите получателя' })}
              allowClear
            >
              {recipients.map(recipient => (
                <Option key={recipient.id} value={recipient.id}>
                  {recipient.display_name}
                </Option>
              ))}
            </Select>
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
                {t('expenses.update')}
              </Button>
              <Button
                onClick={() => {
                  setEditModalVisible(false);
                  setSelectedExpense(null);
                  editForm.resetFields();
                }}
                size="large"
              >
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Recipients Management Modal */}
      <Modal
        title={
          editingRecipient
            ? t('expenses.editRecipient', { defaultValue: 'Редактировать получателя' })
            : t('expenses.createRecipient', { defaultValue: 'Создать получателя' })
        }
        open={recipientModalVisible}
        onCancel={handleRecipientModalCancel}
        footer={null}
        width={500}
      >
        <Form
          form={recipientForm}
          layout="vertical"
          onFinish={editingRecipient ? handleUpdateRecipient : handleCreateRecipient}
          initialValues={{
            type: 'other',
          }}
        >
          <Form.Item
            name="name"
            label={t('expenses.recipientName', { defaultValue: 'Название получателя' })}
            rules={[
              { required: true, message: t('expenses.recipientNameRequired', { defaultValue: 'Пожалуйста, введите название получателя' }) },
              { max: 255, message: t('expenses.recipientNameTooLong', { defaultValue: 'Название не должно превышать 255 символов' }) },
            ]}
          >
            <Input placeholder={t('expenses.enterRecipientName', { defaultValue: 'Введите название получателя' })} />
          </Form.Item>

          <Form.Item
            name="type"
            label={t('expenses.recipientType', { defaultValue: 'Тип получателя' })}
            rules={[{ required: true, message: t('expenses.recipientTypeRequired', { defaultValue: 'Пожалуйста, выберите тип получателя' }) }]}
          >
            <Select>
              <Option value="other">{t('expenses.otherCategory', { defaultValue: 'Другая категория' })}</Option>
              <Option value="employee">{t('expenses.employee', { defaultValue: 'Сотрудник' })}</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={recipientCreating}
                icon={<SaveOutlined />}
              >
                {editingRecipient
                  ? t('common.update', { defaultValue: 'Обновить' })
                  : t('common.create', { defaultValue: 'Создать' })}
              </Button>
              <Button onClick={handleRecipientModalCancel}>
                {t('common.cancel', { defaultValue: 'Отмена' })}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
