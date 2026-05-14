import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Button, Space, Typography, Card, message, Popconfirm, Tag, Tabs, Form, Input, Select, Row, Col, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, SaveOutlined, TeamOutlined, UserAddOutlined, SearchOutlined } from '@ant-design/icons';
import { usersApi, authApi, type UserWithCreated } from '../api';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;
const { Option } = Select;

interface RegisterFormData {
  login: string;
  password: string;
  name: string;
  role: string;
}

export const Users = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserWithCreated[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithCreated[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [creating, setCreating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { user: currentUser } = useAuth();
  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState<UserWithCreated | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.getAll();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 403) {
        message.error(t('errors.accessDenied', { defaultValue: 'Доступ запрещен. Только ADMIN может просматривать пользователей.' }));
      } else {
        message.error(t('users.errorLoading', { defaultValue: 'Ошибка при загрузке пользователей' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(value.toLowerCase()) ||
      user.login.toLowerCase().includes(value.toLowerCase()) ||
      user.role.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: number) => {
    if (id === currentUser?.id) {
      message.error(t('users.cannotDeleteSelf', { defaultValue: 'Нельзя удалить самого себя' }));
      return;
    }
    try {
      await usersApi.delete(id);
      message.success(t('users.userDeleted', { defaultValue: 'Пользователь удален' }));
      fetchUsers();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } } };
      if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || t('users.cannotDeleteSelf'));
      } else {
        message.error(t('users.errorDeleting', { defaultValue: 'Ошибка при удалении пользователя' }));
      }
    }
  };

  const handleEdit = (user: UserWithCreated) => {
    setEditingUser(user);
    setEditModalVisible(true);
    form.setFieldsValue({
      login: user.login,
      name: user.name,
      role: user.role,
    });
  };

  const handleUpdate = async (values: any) => {
    if (!editingUser) return;

    setEditing(true);
    try {
      await usersApi.update(editingUser.id, values);
      message.success(t('users.userUpdated', { defaultValue: 'Пользователь успешно обновлен' }));
      setEditModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      fetchUsers();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } }; message?: string };
      if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || t('users.errorUpdating', { defaultValue: 'Ошибка при обновлении пользователя' }));
      } else if (axiosError.message?.includes('Network Error')) {
        message.error(t('errors.networkError'));
      } else {
        message.error(t('users.errorUpdating', { defaultValue: 'Ошибка при обновлении пользователя' }));
      }
    } finally {
      setEditing(false);
    }
  };

  const columns = [
    {
      title: '№',
      key: 'rowNumber',
      width: 80,
      responsive: ['md'] as ('md' | 'xxxl' | 'xxl' | 'xl' | 'lg' | 'sm' | 'xs')[],
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: t('users.username'),
      dataIndex: 'login',
      key: 'login',
    },
    {
      title: t('common.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('users.role'),
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>{role}</Tag>
      ),
    },
    {
      title: t('users.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 150,
      render: (_: unknown, record: UserWithCreated) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title={t('users.confirmDelete')}
            description={t('users.deleteWarning')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
            disabled={record.id === currentUser?.id}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={record.id === currentUser?.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleCreate = async (values: RegisterFormData) => {
    setCreating(true);
    try {
      await authApi.register(values);
      message.success(t('users.userCreated', { defaultValue: 'Пользователь успешно создан' }));
      form.resetFields();
      setActiveTab('list');
      fetchUsers();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } }; message?: string };
      if (axiosError.response?.status === 403) {
        message.error(t('errors.onlyAdmin', { defaultValue: 'Только ADMIN может создавать пользователей' }));
      } else if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || t('users.invalidData', { defaultValue: 'Логин и пароль обязательны / Пользователь уже существует' }));
      } else if (axiosError.message?.includes('Network Error')) {
        message.error(t('errors.networkError'));
      } else {
        message.error(t('users.errorCreating', { defaultValue: 'Ошибка при создании пользователя. Попробуйте позже.' }));
      }
    } finally {
      setCreating(false);
    }
  };

  const tabItems = [
    {
      key: 'list',
      label: (
        <span>
          <TeamOutlined />
          {t('users.list')}
        </span>
      ),
      children: (
        <div>
          <Input
            placeholder={t('users.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ marginBottom: 16 }}
            allowClear
          />
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            size="small"
          />
        </div>
      ),
    },
    {
      key: 'create',
      label: (
        <span>
          <UserAddOutlined />
          Создать
        </span>
      ),
      children: (
        <Row justify="center">
          <Col xs={24} sm={20} md={16} lg={12} xl={8}>
            <Card>
          <Form
            form={form}
            name="register"
            onFinish={handleCreate}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="login"
              label={t('users.username')}
              rules={[{ required: true, message: t('users.enterLogin') }]}
            >
              <Input placeholder={t('users.username')} />
            </Form.Item>

            <Form.Item
              name="password"
              label={t('common.password')}
              rules={[{ required: true, message: t('users.enterPassword') }, { min: 6, message: t('users.minPasswordLength') }]}
            >
              <Input.Password placeholder={t('common.password')} />
            </Form.Item>

            <Form.Item
              name="name"
              label={t('common.name')}
              rules={[{ required: true, message: t('users.enterName') }]}
            >
              <Input placeholder={t('common.name')} />
            </Form.Item>

            <Form.Item
              name="role"
              label={t('users.role')}
              rules={[{ required: true, message: t('users.selectRole') }]}
            >
              <Select placeholder={t('users.selectRole')}>
                <Option value="USER">USER</Option>
                <Option value="ADMIN">ADMIN</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={creating}
                icon={<SaveOutlined />}
                block
                size="large"
              >
                {t('users.createUser')}
              </Button>
            </Form.Item>
          </Form>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>{t('users.title')}</Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <Modal
        title={t('users.edit')}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setEditModalVisible(false);
            setEditingUser(null);
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
          name="editUser"
          onFinish={handleUpdate}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            label={t('users.username')}
            name="login"
            rules={[{ required: true, message: t('users.enterLogin') }]}
          >
            <Input placeholder={t('users.enterLogin')} />
          </Form.Item>

          <Form.Item
            label={t('common.name')}
            name="name"
            rules={[{ required: true, message: t('users.enterName') }]}
          >
            <Input placeholder={t('users.enterName')} />
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
                {t('common.update')}
              </Button>
              <Button
                onClick={() => {
                  setEditModalVisible(false);
                  setEditingUser(null);
                  form.resetFields();
                }}
                size="large"
              >
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
