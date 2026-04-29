import { useEffect, useState } from 'react';
import { Table, Button, Typography, Card, message, Form, Row, Col, Tabs, type TableProps, InputNumber } from 'antd';
import { useTranslation } from 'react-i18next';
import { EditOutlined, ReloadOutlined, DollarOutlined } from '@ant-design/icons';
import { exchangeRatesApi, type ExchangeRate } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export const ExchangeRates = () => {
  const { t } = useTranslation();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [updateForm] = Form.useForm();
  const [updating, setUpdating] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);
  

  const fetchRates = async () => {
    setLoading(true);
    try {
      const data = await exchangeRatesApi.getAll();
      setRates(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error(t('errors.unauthorized'));
      } else {
        message.error(t('exchangeRates.errorLoading', { defaultValue: 'Ошибка загрузки курсов' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rate: ExchangeRate) => {
    setEditingRate(rate);
    updateForm.setFieldsValue({
      rate_to_tjs: rate.rate_to_tjs,
    });
    setActiveTab('edit');
  };

  const handleUpdate = async (values: { rate_to_tjs: number }) => {
    if (!editingRate) return;
    setUpdating(true);
    try {
      await exchangeRatesApi.update(editingRate.currency, values.rate_to_tjs);
      message.success(t('exchangeRates.updated', { defaultValue: 'Курс обновлен' }));
      updateForm.resetFields();
      setEditingRate(null);
      setActiveTab('list');
      fetchRates();
    } catch (error: unknown) {
      message.error(t('exchangeRates.errorUpdating', { defaultValue: 'Ошибка обновления курса' }));
    } finally {
      setUpdating(false);
    }
  };


  useEffect(() => {
    fetchRates();
  }, []);

  const columns: TableProps<ExchangeRate>['columns'] = [
    {
      title: t('common.id'),
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: t('exchangeRates.currency', { defaultValue: 'Валюта' }),
      dataIndex: 'currency',
      key: 'currency',
      width: 100,
      render: (currency: string) => (
        <Text strong style={{ fontSize: 16 }}>{currency}</Text>
      ),
    },
    {
      title: t('exchangeRates.rate', { defaultValue: 'Курс к TJS' }),
      dataIndex: 'rate_to_tjs',
      key: 'rate_to_tjs',
      width: 120,
      align: 'right',
      render: (rate: number) => (
        <Text style={{ color: '#1890ff', fontWeight: 'bold' }}>
          {rate ? Number(rate).toFixed(4) : '-'}
        </Text>
      ),
    },
    {
      title: t('exchangeRates.updatedAt', { defaultValue: 'Обновлено' }),
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 160,
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: t('common.actions', { defaultValue: 'Действия' }),
      key: 'actions',
      width: 100,
      render: (_: unknown, record: ExchangeRate) => (
        <Button
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
          size="small"
        />
      ),
    },
  ];

  const tabItems = [
    {
      key: 'list',
      label: (
        <span>
          <ReloadOutlined />
          {t('exchangeRates.allRates', { defaultValue: 'Все курсы' })}
        </span>
      ),
      children: (
        <Table
          columns={columns}
          dataSource={rates}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      ),
    },
    ...(editingRate ? [{
      key: 'edit',
      label: (
        <span>
          <EditOutlined />
          {t('exchangeRates.edit', { defaultValue: 'Изменить' })} {editingRate.currency}
        </span>
      ),
      children: (
        <Row justify="center">
          <Col xs={24} sm={20} md={16} lg={12} xl={8}>
            <Card>
              <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
                <DollarOutlined /> {t('exchangeRates.editRate', { defaultValue: 'Изменить курс' })} {editingRate.currency}
              </Title>
              <Form
                form={updateForm}
                name="updateRate"
                onFinish={handleUpdate}
                autoComplete="off"
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="rate_to_tjs"
                  label={t('exchangeRates.rateToTJS', { defaultValue: 'Курс к TJS' })}
                  rules={[
                    { required: true, message: t('exchangeRates.enterRate', { defaultValue: 'Введите курс' }) },
                    { type: 'number', min: 0.0001, message: t('exchangeRates.rateMustBePositive', { defaultValue: 'Курс должен быть положительным числом' }) }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0.0001}
                    step={0.0001}
                    precision={4}
                    placeholder={t('exchangeRates.rateExample', { defaultValue: 'Например: 10.5000' })}
                  />
                </Form.Item>

                <Form.Item style={{ marginTop: 24 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={updating}
                    icon={<EditOutlined />}
                    block
                    size="large"
                  >
                    {t('exchangeRates.update', { defaultValue: 'Обновить курс' })}
                  </Button>
                </Form.Item>
                <Button
                  onClick={() => {
                    setEditingRate(null);
                    setActiveTab('list');
                  }}
                  block
                  style={{ marginTop: 8 }}
                >
                  {t('common.cancel', { defaultValue: 'Отмена' })}
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      ),
    }] : []),
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
        {t('exchangeRates.title', { defaultValue: 'Валютные курсы' })}
      </Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </div>
  );
};
