import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Spin, Row, Col } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { customersApi } from '../api';

const { Title } = Typography;

export const CustomerEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchCustomer = async () => {
      setLoading(true);
      try {
        const data = await customersApi.getById(parseInt(id));
        form.setFieldsValue({
          full_name: data.full_name,
          phone: data.phone,
        });
      } catch (error: unknown) {
        const axiosError = error as { response?: { status: number } };
        if (axiosError.response?.status === 404) {
          message.error('Клиент не найден');
        } else {
          message.error('Ошибка при загрузке клиента');
        }
        navigate('/customers');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id, form, navigate]);

  const onFinish = async (values: any) => {
    if (!id) return;

    setSaving(true);
    try {
      await customersApi.update(parseInt(id), values);
      message.success('Клиент обновлен');
      navigate('/customers');
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } } };
      if (axiosError.response?.status === 404) {
        message.error('Клиент не найден');
        navigate('/customers');
      } else if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || 'Ошибка в данных');
      } else {
        message.error('Ошибка при обновлении клиента');
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
        onClick={() => navigate('/customers')}
        style={{ marginBottom: 16 }}
      >
        Назад к списку
      </Button>

      <Row justify="center">
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          <Card>
            <Title level={3} style={{ textAlign: 'center', marginBottom: 24, marginTop: 0 }}>
              <UserOutlined /> Редактирование клиента #{id}
            </Title>

            <Form
              form={form}
              name="editCustomer"
              onFinish={onFinish}
              autoComplete="off"
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="full_name"
                label="Полное имя"
                rules={[{ required: true, message: 'Введите полное имя клиента' }]}
              >
                <Input placeholder="Например: Иванов Иван Иванович" prefix={<UserOutlined />} />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Телефон"
              >
                <Input placeholder="+992123456789" prefix={<PhoneOutlined />} />
              </Form.Item>

              <Form.Item style={{ marginTop: 24 }}>
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
