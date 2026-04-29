import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Card, message, Popconfirm, Modal, Form, Select, InputNumber, DatePicker, type TableProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { PlusOutlined, DeleteOutlined, ReloadOutlined, SwapOutlined } from '@ant-design/icons';
import { conversionsApi, productsApi, stockItemsApi, type Conversion, type Product, type StockItem } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export const Conversions = () => {
  const { t } = useTranslation();
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [form] = Form.useForm();
  const [productStockItems, setProductStockItems] = useState<Record<number, StockItem[]>>({});
  const [loadingStockItems, setLoadingStockItems] = useState<Record<number, boolean>>({});

  const fetchConversions = async () => {
    setLoading(true);
    try {
      const params: { date?: string } = {};
      if (selectedDate) {
        params.date = selectedDate;
      }
      const data = await conversionsApi.getAll(params);
      setConversions(data);
    } catch (error) {
      message.error(t('conversions.errorLoading', { defaultValue: 'Ошибка при загрузке переработок' }));
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await productsApi.getAll();
      setProducts(data);
    } catch (error) {
      // Silently fail
    }
  };
  const fetchProductStockItems = async (productId: number) => {
    if (productStockItems[productId]) return; // already cached
    setLoadingStockItems(prev => ({ ...prev, [productId]: true }));
    try {
      const response = await stockItemsApi.getByProductId(productId);
      setProductStockItems(prev => ({ ...prev, [productId]: response.batches || [] }));
    } catch (error) {
      console.error(`Failed to load stock items for product ${productId}:`, error);
    } finally {
      setLoadingStockItems(prev => ({ ...prev, [productId]: false }));
    }
  };

  useEffect(() => {
    fetchConversions();
    fetchProducts();
  }, [selectedDate]);

  const handleDelete = async (id: number) => {
    try {
      await conversionsApi.delete(id);
      message.success(t('conversions.conversionDeleted', { defaultValue: 'Переработка удалена' }));
      fetchConversions();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      message.error(axiosError.response?.data?.message || t('conversions.errorDeleting', { defaultValue: 'Ошибка при удалении' }));
    }
  };

  const handleCreate = async (values: {
    from_product_id: number;
    to_product_id: number;
    from_quantity: number;
    to_quantity: number;
    selling_price?: number;
    from_stock_item_id?: number;
  }) => {
    setCreating(true);
    try {
      if (values.from_product_id === values.to_product_id) {
        message.error(t('conversions.sameProductError', { defaultValue: 'Исходный и целевой товары должны быть разными' }));
        setCreating(false);
        return;
      }

      const fromProduct = products.find(p => p.id === values.from_product_id);
      if (fromProduct?.type === 'batch' && !values.from_stock_item_id) {
        message.error('Выберите партию для исходного batch товара');
        setCreating(false);
        return;
      }

      await conversionsApi.create({
        from_product_id: values.from_product_id,
        from_stock_item_id: values.from_stock_item_id,
        to_product_id: values.to_product_id,
        from_quantity: values.from_quantity,
        to_quantity: values.to_quantity,
        selling_price: values.selling_price,
      });
      message.success(t('conversions.conversionCreated', { defaultValue: 'Переработка создана' }));
      form.resetFields();
      setModalVisible(false);
      fetchConversions();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      message.error(axiosError.response?.data?.message || t('conversions.errorCreating', { defaultValue: 'Ошибка при создании' }));
    } finally {
      setCreating(false);
    }
  };

  const columns: TableProps<Conversion>['columns'] = [
    {
      title: '№',
      key: 'rowNumber',
      width: 60,
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: t('common.date', { defaultValue: 'Дата' }),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: t('conversions.fromProduct', { defaultValue: 'Из товара' }),
      key: 'from_product',
      render: (_: unknown, record: Conversion) => (
        <div>
          <div><Text strong>{record.from_product_name}</Text></div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.from_product_code}</div>
          <div style={{ fontSize: 12, color: '#ff4d4f' }}>-{record.from_quantity} шт.</div>
        </div>
      ),
    },
    {
      title: '',
      key: 'arrow',
      width: 50,
      render: () => <SwapOutlined style={{ color: '#1890ff' }} />,
    },
    {
      title: t('conversions.toProduct', { defaultValue: 'В товар' }),
      key: 'to_product',
      render: (_: unknown, record: Conversion) => (
        <div>
          <div><Text strong>{record.to_product_name}</Text></div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.to_product_code}</div>
          <div style={{ fontSize: 12, color: '#52c41a' }}>+{record.to_quantity} шт.</div>
        </div>
      ),
    },
    {
      title: t('conversions.purchaseCost', { defaultValue: 'Себестоимость' }),
      dataIndex: 'purchase_cost',
      key: 'purchase_cost',
      render: (cost: number) => (
        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
          {cost ? `${Number(cost).toFixed(2)} TJS` : '-'}
        </span>
      ),
    },
    {
      title: t('conversions.sellingPrice', { defaultValue: 'Цена продажи' }),
      dataIndex: 'selling_price',
      key: 'selling_price',
      render: (price: number) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          {price ? `${price.toFixed(2)} TJS` : '-'}
        </span>
      ),
    },
    {
      title: t('common.actions', { defaultValue: 'Действия' }),
      key: 'actions',
      width: 100,
      render: (_: unknown, record: Conversion) => (
        <Popconfirm
          title={t('conversions.confirmDelete', { defaultValue: 'Подтвердите удаление' })}
          description={t('conversions.deleteWarning', { defaultValue: 'Товары вернутся на склад' })}
          onConfirm={() => handleDelete(record.id)}
          okText={t('common.yes', { defaultValue: 'Да' })}
          cancelText={t('common.no', { defaultValue: 'Нет' })}
        >
          <Button danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            {t('conversions.title', { defaultValue: 'Переработка товаров' })}
          </Title>
          <Space>
            <DatePicker
              value={selectedDate ? dayjs(selectedDate) : null}
              onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : '')}
              placeholder={t('conversions.selectDate', { defaultValue: 'Выберите дату' })}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchConversions}>
              {t('common.refresh', { defaultValue: 'Обновить' })}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              {t('conversions.create', { defaultValue: 'Создать переработку' })}
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={conversions}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: t('conversions.noConversions', { defaultValue: 'Нет операций переработки' }),
          }}
        />
      </Card>

      {/* Create Conversion Modal */}
      <Modal
        title={t('conversions.create', { defaultValue: 'Создать переработку' })}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={creating}
        okText={t('common.create', { defaultValue: 'Создать' })}
        cancelText={t('common.cancel', { defaultValue: 'Отмена' })}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{
            from_quantity: 1,
            to_quantity: 1,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'end', marginBottom: 16 }}>
            <Form.Item
              label={t('conversions.fromProduct', { defaultValue: 'Из товара' })}
              name="from_product_id"
              rules={[{ required: true, message: t('conversions.selectFromProduct', { defaultValue: 'Выберите исходный товар' }) }]}
            >
              <Select
                showSearch
                optionFilterProp="children"
                placeholder={t('conversions.selectProduct', { defaultValue: 'Выберите товар' })}
                onChange={(value) => {
                  const selected = products.find(p => p.id === value);
                  if (selected?.type !== 'batch') {
                    form.setFieldValue('from_stock_item_id', undefined);
                  } else {
                    fetchProductStockItems(value);
                  }
                }}
              >
                {products.map((product) => (
                  <Option key={product.id} value={product.id}>
                    {product.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <div style={{ textAlign: 'center', paddingBottom: 8 }}>
              <SwapOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            </div>

            <Form.Item
              label={t('conversions.toProduct', { defaultValue: 'В товар' })}
              name="to_product_id"
              rules={[{ required: true, message: t('conversions.selectToProduct', { defaultValue: 'Выберите целевой товар' }) }]}
            >
              <Select
                showSearch
                optionFilterProp="children"
                placeholder={t('conversions.selectProduct', { defaultValue: 'Выберите товар' })}
              >
                {products.map((product) => (
                  <Option key={product.id} value={product.id}>
                    {product.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.from_product_id !== currentValues.from_product_id}>
            {({ getFieldValue }) => {
              const fromProductId = getFieldValue('from_product_id');
              const fromProduct = products.find(p => p.id === fromProductId);
              if (fromProduct?.type !== 'batch') return null;
              const stockItems = productStockItems[fromProductId] || [];
              return (
                <Form.Item
                  label={t('sales.batchFrom')}
                  name="from_stock_item_id"
                  rules={[{ required: true, message: t('sales.selectBatch') }]}
                >
                  <Select
                    placeholder={t('sales.selectBatch')}
                    loading={loadingStockItems[fromProductId]}
                    allowClear
                  >
                    {stockItems.map(si => (
                      <Option key={si.id} value={si.id}>
                        {si.batch_code} ({t('sales.remaining')} {si.quantity})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              );
            }}
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Form.Item
              label={t('conversions.fromQuantity', { defaultValue: 'Количество (из)' })}
              name="from_quantity"
              rules={[{ required: true, min: 0.01, type: 'number', message: t('conversions.enterQuantity', { defaultValue: 'Введите количество' }) }]}
            >
              <InputNumber style={{ width: '100%' }} min={0.01} precision={2} />
            </Form.Item>

            <Form.Item
              label={t('conversions.toQuantity', { defaultValue: 'Количество (в)' })}
              name="to_quantity"
              rules={[{ required: true, min: 0.01, type: 'number', message: t('conversions.enterQuantity', { defaultValue: 'Введите количество' }) }]}
            >
              <InputNumber style={{ width: '100%' }} min={0.01} precision={2} />
            </Form.Item>
          </div>

          <Form.Item
            label={t('conversions.sellingPrice', { defaultValue: 'Цена продажи товара B' })}
            name="selling_price"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              placeholder={t('conversions.sellingPricePlaceholder', { defaultValue: 'Опционально' })}
              suffix="TJS"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
