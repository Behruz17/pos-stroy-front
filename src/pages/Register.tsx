import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Select } from 'antd';
import { UserOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Option } = Select;

interface RegisterFormData {
  login: string;
  password: string;
  name: string;
  role: string;
}

export const Register = () => {
  const [loading, setLoading] = useState(false);
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Only ADMIN can access this page
  if (!hasRole('ADMIN')) {
    message.error('Доступ запрещен. Только ADMIN может создавать пользователей.');
    navigate('/', { replace: true });
    return null;
  }

  const onFinish = async (values: RegisterFormData) => {
    setLoading(true);
    try {
      const response = await authApi.register(values);
      message.success(response.message || 'Пользователь успешно создан');
      form.resetFields();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } }; message?: string };
      if (axiosError.response?.status === 403) {
        message.error('Только ADMIN может создавать пользователей');
      } else if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || 'Login и password обязательны / Пользователь уже существует');
      } else if (axiosError.message?.includes('Network Error')) {
        message.error('Сервер недоступен. Проверьте подключение.');
      } else {
        message.error('Ошибка при создании пользователя. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ maxWidth: 500, margin: '0 auto' }} bordered={false}>
        <Title level={3} style={{ textAlign: 'center' }}>Создание пользователя</Title>

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="login"
            rules={[{ required: true, message: 'Введите логин' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Логин"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Введите пароль' }, { min: 6, message: 'Минимум 6 символов' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Пароль"
            />
          </Form.Item>

          <Form.Item
            name="name"
            rules={[{ required: true, message: 'Введите имя' }]}
          >
            <Input
              prefix={<IdcardOutlined />}
              placeholder="Имя"
            />
          </Form.Item>

          <Form.Item
            name="role"
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
              loading={loading}
              block
              size="large"
            >
              Создать пользователя
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
