import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, IdcardOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { authApi } from '../api';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

interface RegisterFormData {
  login: string;
  password: string;
  name: string;
}

export const PublicRegister = () => {
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: RegisterFormData) => {
    setLoading(true);
    try {
      await authApi.register({
        ...values,
        role: 'USER',
      });
      setRegistered(true);
      message.success('Регистрация успешна! Теперь вы можете войти.');
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } }; message?: string };
      if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || 'Пользователь с таким логином уже существует');
      } else if (axiosError.response?.status === 403) {
        message.error('Регистрация отключена. Обратитесь к администратору.');
      } else if (axiosError.message?.includes('Network Error')) {
        message.error('Сервер недоступен. Проверьте подключение.');
      } else {
        message.error('Ошибка при регистрации. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="login-container">
        <Card className="login-card" bordered={false}>
          <Title level={3} className="login-title" style={{ color: '#52c41a' }}>
            Регистрация завершена!
          </Title>
          <Text style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
            Ваш аккаунт успешно создан. Теперь вы можете войти.
          </Text>
          <Button
            type="primary"
            block
            size="large"
            onClick={() => navigate('/login')}
          >
            Перейти к входу
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="login-container">
      <Row justify="center" style={{ width: '100%' }}>
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          <Card className="login-card" bordered={false}>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 16 }}>
              <ArrowLeftOutlined style={{ marginRight: 4 }} />
              <span>Назад ко входу</span>
            </Link>

            <Title level={3} className="login-title">Регистрация</Title>

            <Form
              form={form}
              name="public-register"
              onFinish={onFinish}
              autoComplete="off"
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="login"
                rules={[
                  { required: true, message: 'Введите логин' },
                  { min: 3, message: 'Минимум 3 символа' },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Логин"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: 'Введите пароль' },
                  { min: 6, message: 'Минимум 6 символов' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Пароль"
                />
              </Form.Item>

              <Form.Item
                name="name"
                rules={[
                  { required: true, message: 'Введите ваше имя' },
                  { min: 2, message: 'Минимум 2 символа' },
                ]}
              >
                <Input
                  prefix={<IdcardOutlined />}
                  placeholder="Ваше имя"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  className="login-button"
                >
                  Зарегистрироваться
                </Button>
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
                <Text type="secondary">
                  Уже есть аккаунт?{' '}
                  <Link to="/login">Войти</Link>
                </Text>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
