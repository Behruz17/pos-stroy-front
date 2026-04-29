import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

export const LoginForm = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  const onFinish = async (values: LoginFormData) => {
    setLoading(true);
    try {
      await login({
        login: values.username,
        password: values.password,
      });
      navigate('/', { replace: true });
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number }; message?: string };
      if (axiosError.response?.status === 401) {
        message.error(t('login.invalidCredentials', { defaultValue: 'Неверный логин или пароль' }));
      } else if (axiosError.message?.includes('Network Error')) {
        message.error(t('errors.networkError'));
      } else {
        message.error(t('login.error', { defaultValue: 'Ошибка входа. Попробуйте позже.' }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" bordered={false}>
        <Title level={3} className="login-title">{t('login.title', { defaultValue: 'Вход' })}</Title>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: t('login.enterUsername', { defaultValue: 'Введите логин' }) }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t('login.username', { defaultValue: 'Логин' })}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('login.enterPassword', { defaultValue: 'Введите пароль' }) }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('login.password', { defaultValue: 'Пароль' })}
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
              {t('login.submit', { defaultValue: 'Войти' })}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

interface LoginFormData {
  username: string;
  password: string;
}
