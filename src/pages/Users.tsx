import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Card, message, Popconfirm, Tag, Tabs, Form, Input, Select, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, SaveOutlined, TeamOutlined, UserAddOutlined, SearchOutlined } from '@ant-design/icons';
import { usersApi, authApi, type UserWithCreated } from '../api';
import { useNavigate } from 'react-router-dom';
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
  const [users, setUsers] = useState<UserWithCreated[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithCreated[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [creating, setCreating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.getAll();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 403) {
        message.error('Доступ запрещен. Только ADMIN может просматривать пользователей.');
      } else {
        message.error('Ошибка при загрузке пользователей');
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
      message.error('Нельзя удалить самого себя');
      return;
    }
    try {
      await usersApi.delete(id);
      message.success('Пользователь удален');
      fetchUsers();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } } };
      if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || 'Нельзя удалить самого себя');
      } else {
        message.error('Ошибка при удалении пользователя');
      }
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
      title: 'Логин',
      dataIndex: 'login',
      key: 'login',
    },
    {
      title: 'Имя',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>{role}</Tag>
      ),
    },
    {
      title: 'Дата создания',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: UserWithCreated) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/users/${record.id}/edit`)}
          />
          <Popconfirm
            title="Удалить пользователя?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
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
      message.success('Пользователь успешно создан');
      form.resetFields();
      setActiveTab('list');
      fetchUsers();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } }; message?: string };
      if (axiosError.response?.status === 403) {
        message.error('Только ADMIN может создавать пользователей');
      } else if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || 'Логин и пароль обязательны / Пользователь уже существует');
      } else if (axiosError.message?.includes('Network Error')) {
        message.error('Сервер недоступен. Проверьте подключение.');
      } else {
        message.error('Ошибка при создании пользователя. Попробуйте позже.');
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
          Список
        </span>
      ),
      children: (
        <div>
          <Input
            placeholder="Поиск пользователей..."
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
            pagination={{ pageSize: 10 }}
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
              label="Логин"
              rules={[{ required: true, message: 'Введите логин' }]}
            >
              <Input placeholder="Логин" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Пароль"
              rules={[{ required: true, message: 'Введите пароль' }, { min: 6, message: 'Минимум 6 символов' }]}
            >
              <Input.Password placeholder="Пароль" />
            </Form.Item>

            <Form.Item
              name="name"
              label="Имя"
              rules={[{ required: true, message: 'Введите имя' }]}
            >
              <Input placeholder="Имя" />
            </Form.Item>

            <Form.Item
              name="role"
              label="Роль"
              rules={[{ required: true, message: 'Выберите роль' }]}
              initialValue="USER"
            >
              <Select placeholder="Выберите роль">
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
                Создать пользователя
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
      <Title level={3}>Пользователи</Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </div>
  );
};
