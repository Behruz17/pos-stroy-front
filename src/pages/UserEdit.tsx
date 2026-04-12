import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Select, Spin, Row, Col } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { usersApi, type UserWithCreated } from '../api';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;
const { Option } = Select;

interface EditFormData {
  login: string;
  name: string;
  role: string;
}

export const UserEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, setUser] = useState<UserWithCreated | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const data = await usersApi.getById(parseInt(id));
        setUser(data);
        form.setFieldsValue({
          login: data.login,
          name: data.name,
          role: data.role,
        });
      } catch (error: unknown) {
        const axiosError = error as { response?: { status: number } };
        if (axiosError.response?.status === 404) {
          message.error('Пользователь не найден');
        } else {
          message.error('Ошибка при загрузке пользователя');
        }
        navigate('/users');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, form, navigate]);

  const onFinish = async (values: EditFormData) => {
    if (!id) return;

    // Проверка: ADMIN не может изменить свою роль
    if (parseInt(id) === currentUser?.id && values.role !== currentUser?.role) {
      message.error('Нельзя изменить свою роль');
      return;
    }

    setSaving(true);
    try {
      await usersApi.update(parseInt(id), values);
      message.success('Пользователь обновлен');
      navigate('/users');
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } } };
      if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || 'Нельзя изменить свою роль');
      } else if (axiosError.response?.status === 404) {
        message.error('Пользователь не найден');
        navigate('/users');
      } else {
        message.error('Ошибка при обновлении пользователя');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/users')}
        style={{ marginBottom: 16 }}
      >
        Назад к списку
      </Button>

      <Row justify="center">
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          <Card>
            <Title level={3} style={{ marginTop: 0 }}>Редактирование пользователя #{id}</Title>

            <Form
              form={form}
              name="editUser"
              onFinish={onFinish}
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
              >
                <Select placeholder="Выберите роль" disabled={parseInt(id!) === currentUser?.id}>
                  <Option value="USER">USER</Option>
                  <Option value="ADMIN">ADMIN</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  icon={<SaveOutlined />}
                  block
                  size="large"
                >
                  Сохранить
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
