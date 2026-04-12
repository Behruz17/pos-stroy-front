import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Row, Col, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, DollarOutlined, TeamOutlined, PhoneOutlined } from '@ant-design/icons';
import { suppliersApi, type Supplier } from '../api';

const { Title } = Typography;

interface EditFormData {
  name: string;
  phone: string;
}

export const SupplierEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, setSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchSupplier = async () => {
      setLoading(true);
      try {
        const data = await suppliersApi.getById(parseInt(id));
        setSupplier(data);
        form.setFieldsValue({
          name: data.name,
          phone: data.phone,
        });
      } catch (error: unknown) {
        const axiosError = error as { response?: { status: number } };
        if (axiosError.response?.status === 404) {
          message.error('Поставщик не найден');
        } else {
          message.error('Ошибка при загрузке поставщика');
        }
        navigate('/suppliers');
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [id, form, navigate]);

  const onFinish = async (values: EditFormData) => {
    if (!id) return;

    setSaving(true);
    try {
      await suppliersApi.update(parseInt(id), values);
      message.success('Поставщик обновлен');
      navigate('/suppliers');
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } } };
      if (axiosError.response?.status === 404) {
        message.error('Поставщик не найден');
        navigate('/suppliers');
      } else {
        message.error('Ошибка при обновлении поставщика');
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
        onClick={() => navigate('/suppliers')}
        style={{ marginBottom: 16 }}
      >
        Назад к списку
      </Button>

      <Row justify="center">
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          <Card>
            <Title level={3} style={{ textAlign: 'center', marginBottom: 24, marginTop: 0 }}>
              <DollarOutlined /> Редактирование поставщика #{id}
            </Title>

            <Form
              form={form}
              name="editSupplier"
              onFinish={onFinish}
              autoComplete="off"
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="name"
                label="Наименование"
                rules={[{ required: true, message: 'Введите наименование поставщика' }]}
              >
                <Input placeholder="Например: ООО Поставщик" prefix={<TeamOutlined />} />
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
