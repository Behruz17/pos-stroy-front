import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, message, Select, Space, Table, Tabs, Tag, Typography, type TableProps } from 'antd';
import { AuditOutlined, SaveOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { productsApi, stockAdjustmentsApi, type CreateStockAdjustment, type Product, type StockAdjustment } from '../api';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const StockRevision = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productsApi.getAll();
      setProducts(data);
    } catch (error: unknown) {
      message.error(t('products.errorLoading', { defaultValue: 'Ошибка при загрузке товаров' }));
    } finally {
      setLoading(false);
    }
  };

  const fetchAdjustments = async () => {
    setHistoryLoading(true);
    try {
      const data = await stockAdjustmentsApi.getAll();
      setAdjustments(data);
    } catch (error: unknown) {
      message.error('Ошибка при загрузке истории ревизий');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchAdjustments();
  }, []);

  const handleProductChange = (productId: number) => {
    const product = products.find(item => item.id === productId) || null;
    setSelectedProduct(product);
    form.setFieldsValue({
      new_quantity: product?.stock_quantity,
    });
  };

  const handleCreateRevision = async (values: { product_id: number; new_quantity: number; reason: string }) => {
    const product = products.find(item => item.id === values.product_id);
    if (!product) {
      message.error('Выберите товар');
      return;
    }

    if (values.new_quantity === product.stock_quantity) {
      message.error('Новый остаток совпадает с текущим');
      return;
    }

    setSaving(true);
    try {
      const payload: CreateStockAdjustment = {
        product_id: values.product_id,
        new_quantity: values.new_quantity,
        reason: values.reason,
      };

      await stockAdjustmentsApi.create(payload);
      message.success('Ревизия успешно сохранена');
      form.resetFields();
      setSelectedProduct(null);
      await Promise.all([fetchProducts(), fetchAdjustments()]);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      message.error(axiosError.response?.data?.message || 'Ошибка при сохранении ревизии');
    } finally {
      setSaving(false);
    }
  };

  const filteredAdjustments = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    if (!normalized) return adjustments;

    return adjustments.filter(item =>
      item.product_name?.toLowerCase().includes(normalized) ||
      item.reason?.toLowerCase().includes(normalized) ||
      item.user_name?.toLowerCase().includes(normalized)
    );
  }, [adjustments, searchText]);

  const selectedNewQuantity = Form.useWatch('new_quantity', form);
  const adjustmentPreview = selectedProduct && typeof selectedNewQuantity === 'number'
    ? selectedNewQuantity - selectedProduct.stock_quantity
    : null;

  const historyColumns: TableProps<StockAdjustment>['columns'] = [
    {
      title: 'Дата',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Товар',
      dataIndex: 'product_name',
      key: 'product_name',
      ellipsis: true,
    },
    {
      title: 'Было',
      dataIndex: 'previous_quantity',
      key: 'previous_quantity',
      width: 100,
      align: 'right',
      render: (value: number) => Number(value).toLocaleString(),
    },
    {
      title: 'Стало',
      dataIndex: 'new_quantity',
      key: 'new_quantity',
      width: 100,
      align: 'right',
      render: (value: number) => Number(value).toLocaleString(),
    },
    {
      title: 'Разница',
      dataIndex: 'adjustment',
      key: 'adjustment',
      width: 110,
      align: 'right',
      render: (value: number) => (
        <Tag color={value > 0 ? 'green' : 'red'}>
          {value > 0 ? '+' : ''}{Number(value).toLocaleString()}
        </Tag>
      ),
    },
    {
      title: 'Причина',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Пользователь',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 140,
      ellipsis: true,
    },
  ];

  return (
    <div>
      <Title level={2}>
        <AuditOutlined /> Ревизия остатков
      </Title>

      <Tabs
        items={[
          {
            key: 'edit',
            label: 'Изменить остаток',
            children: (
              <Card>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleCreateRevision}
                  autoComplete="off"
                >
                  <Form.Item
                    name="product_id"
                    label="Товар"
                    rules={[{ required: true, message: 'Выберите товар' }]}
                  >
                    <Select
                      showSearch
                      loading={loading}
                      placeholder="Выберите товар"
                      optionFilterProp="label"
                      onChange={handleProductChange}
                      options={products.map(product => ({
                        value: product.id,
                        label: `${product.name} (${product.type === 'batch' ? 'Партия' : 'Обычный'}) - остаток: ${product.stock_quantity}`,
                      }))}
                    />
                  </Form.Item>

                  {selectedProduct && (
                    <Alert
                      type={selectedProduct.type === 'batch' ? 'warning' : 'info'}
                      showIcon
                      style={{ marginBottom: 16 }}
                      message={
                        selectedProduct.type === 'batch'
                          ? 'Batch-товар: при уменьшении остатка списание пойдет по FIFO из старых партий, при увеличении будет создана новая партия.'
                          : 'Обычный товар: остаток будет изменен напрямую.'
                      }
                      description={
                        <Space direction="vertical" size={2}>
                          <Text>Текущий остаток: <Text strong>{selectedProduct.stock_quantity.toLocaleString()}</Text></Text>
                          <Text>Тип товара: <Text strong>{selectedProduct.type === 'batch' ? 'Партия' : 'Обычный'}</Text></Text>
                        </Space>
                      }
                    />
                  )}

                  <Form.Item
                    name="new_quantity"
                    label="Новый остаток"
                    rules={[{ required: true, message: 'Введите новый остаток' }]}
                  >
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="Введите новый остаток" />
                  </Form.Item>

                  {adjustmentPreview !== null && (
                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary">Корректировка: </Text>
                      <Tag color={adjustmentPreview > 0 ? 'green' : adjustmentPreview < 0 ? 'red' : 'default'}>
                        {adjustmentPreview > 0 ? '+' : ''}{adjustmentPreview.toLocaleString()}
                      </Tag>
                    </div>
                  )}

                  <Form.Item
                    name="reason"
                    label="Причина"
                    rules={[
                      { required: true, message: 'Введите причину ревизии' },
                      { max: 500, message: 'Максимум 500 символов' },
                    ]}
                  >
                    <TextArea rows={4} placeholder="Например: Инвентаризация - выявлена недостача" />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={saving}
                  >
                    Сохранить ревизию
                  </Button>
                </Form>
              </Card>
            ),
          },
          {
            key: 'history',
            label: 'История ревизий',
            children: (
              <Card>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="Поиск"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  style={{ width: 260, marginBottom: 16 }}
                />
                <Table
                  columns={historyColumns}
                  dataSource={filteredAdjustments}
                  rowKey="id"
                  loading={historyLoading}
                  size="small"
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};
