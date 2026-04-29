import { useEffect, useState } from 'react';
import { Table, Button, Typography, Card, message, Tabs, Form, Select, InputNumber, Row, Col, type TableProps, Modal, Input, Tag, Spin, DatePicker } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { SaveOutlined, TeamOutlined, PlusOutlined, SearchOutlined, ShoppingCartOutlined, DollarOutlined, ShopOutlined, DeleteOutlined, ClockCircleOutlined, SwapOutlined } from '@ant-design/icons';
import { stockReceiptsApi, suppliersApi, productsApi, type StockReceipt, type CreateStockReceiptRequest, type CreateStockReceiptItem, type Supplier, type Product, type StockReceiptItem } from '../api';

const { Title } = Typography;
const { Option } = Select;

export const StockReceipts = () => {
  const { t } = useTranslation();
  const [stockReceipts, setStockReceipts] = useState<StockReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [creating, setCreating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<number | undefined>();
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [form] = Form.useForm();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [receiptItems, setReceiptItems] = useState<CreateStockReceiptItem[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<StockReceipt | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [loadingReceiptDetails, setLoadingReceiptDetails] = useState(false);

  const fetchStockReceipts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      
      if (selectedDate) {
        params.date = selectedDate;
      }
      
      const data = await stockReceiptsApi.getAll(params);
      setStockReceipts(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error(t('errors.unauthorized'));
      } else {
        message.error(t('stockReceipts.errorLoading', { defaultValue: 'Ошибка при загрузке приходов' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await suppliersApi.getAll();
      setSuppliers(data);
    } catch (error: unknown) {
      message.error(t('suppliers.errorLoading', { defaultValue: 'Ошибка при загрузке поставщиков' }));
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await productsApi.getAll();
      setProducts(data);
    } catch (error: unknown) {
      message.error(t('products.errorLoading'));
    }
  };

  useEffect(() => {
    fetchStockReceipts();
    fetchSuppliers();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchStockReceipts();
  }, [selectedDate]); // Re-fetch when date filters change

  useEffect(() => {
    if (selectedReceipt && detailModalVisible && !selectedReceipt.items) {
      loadReceiptDetails(selectedReceipt.id);
    }
  }, [selectedReceipt, detailModalVisible]);

  const loadReceiptDetails = async (id: number) => {
    setLoadingReceiptDetails(true);
    try {
      const detailedReceipt = await stockReceiptsApi.getById(id);
      setSelectedReceipt(detailedReceipt);
    } catch (error: unknown) {
      message.error(t('stockReceipts.errorLoadingDetails', { defaultValue: 'Ошибка при загрузке деталей прихода' }));
    } finally {
      setLoadingReceiptDetails(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    // Note: Search is done on client side as API doesn't support search
  };

  
  const handleCreate = async (values: any) => {
    setCreating(true);
    try {
      if (receiptItems.length === 0) {
        message.error(t('sales.addAtLeastOneItem', { defaultValue: 'Добавьте хотя бы один товар' }));
        return;
      }

      // Validate all items have product_id selected
      const invalidItems = receiptItems.filter(item => !item.product_id || item.product_id <= 0);
      if (invalidItems.length > 0) {
        message.error('Выберите товар для всех позиций');
        return;
      }

      const createData: CreateStockReceiptRequest = {
        supplier_id: values.supplier_id,
        currency: values.currency,
        rate: values.currency !== 'TJS' ? values.rate : 1,
        items: receiptItems,
      };

      console.log('Creating stock receipt with data:', createData);
      await stockReceiptsApi.create(createData);
      message.success(t('stockReceipts.receiptCreated', { defaultValue: 'Приход успешно создан' }));
      form.resetFields();
      setReceiptItems([]);
      setActiveTab('list');
      fetchStockReceipts();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string; errors?: any } }; message?: string };
      if (axiosError.response?.status === 400) {
        console.error('400 Error details:', axiosError.response.data);
        message.error(axiosError.response.data?.message || t('errors.required'));
      } else if (axiosError.message?.includes('Network Error')) {
        message.error(t('errors.networkError'));
      } else {
        message.error(t('stockReceipts.errorCreating', { defaultValue: 'Ошибка при создании прихода' }));
      }
    } finally {
      setCreating(false);
    }
  };

  const addReceiptItem = () => {
    const newItem: CreateStockReceiptItem = {
      product_id: 0,
      quantity: 1,
      purchase_cost: 0,
      selling_price: 0,
    };
    setReceiptItems([...receiptItems, newItem]);
  };

  const updateReceiptItem = (index: number, field: keyof CreateStockReceiptItem, value: any) => {
    console.log(`Before update - item ${index}:`, receiptItems[index]);
    const updatedItems = [...receiptItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    console.log(`After update - item ${index}:`, updatedItems[index]);
    setReceiptItems(updatedItems);
  };

  const removeReceiptItem = (index: number) => {
    setReceiptItems(receiptItems.filter((_, i) => i !== index));
  };

  
  const columns: TableProps<StockReceipt>['columns'] = [
    {
      title: '№',
      key: 'rowNumber',
      width: 60,
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: t('common.date'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: t('common.supplier'),
      dataIndex: 'supplier_name',
      key: 'supplier_name',
      ellipsis: true,
    },
    {
      title: t('common.totalAmount'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number, record: StockReceipt) => (
        <span style={{ color: '#52c41a' }}>
          <DollarOutlined style={{ marginRight: 4 }} />
          {amount.toLocaleString()} {record.currency}
        </span>
      ),
    },
    {
      title: t('common.currency'),
      dataIndex: 'currency',
      key: 'currency',
      width: 80,
      render: (currency: string) => (
        <Tag color={currency === 'TJS' ? 'green' : currency === 'USD' ? 'blue' : 'orange'}>
          {currency}
        </Tag>
      ),
    },
  ];

  const getItemColumns = (currency: string): TableProps<StockReceiptItem>['columns'] => [
    {
      title: t('common.product'),
      dataIndex: 'product_name',
      key: 'product_name',
      ellipsis: true,
    },
    {
      title: 'Партия',
      dataIndex: 'batch_code',
      key: 'batch_code',
      width: 140,
      render: (code: string | null | undefined) => code || '-',
    },
    {
      title: t('common.id'),
      dataIndex: 'product_id',
      key: 'product_id',
      width: 80,
    },
    {
      title: t('common.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: t('suppliers.purchasePrice'),
      dataIndex: 'purchase_cost',
      key: 'purchase_cost',
      render: (cost: number) => cost.toLocaleString(),
      width: 100,
    },
    {
      title: t('stockReceipts.purchaseCostConverted', { defaultValue: 'Цена закупки (TJS)' }),
      dataIndex: 'purchase_cost_converted',
      key: 'purchase_cost_converted',
      render: (cost: number | null | undefined) => {
        if (!cost && cost !== 0) return '-';
        return (
          <span style={{ color: '#52c41a' }}>
            {cost.toLocaleString()} TJS
          </span>
        );
      },
      width: 120,
    },
    {
      title: t('suppliers.sellingPrice'),
      dataIndex: 'selling_price',
      key: 'selling_price',
      render: (price: number) => price.toLocaleString(),
      width: 100,
    },
    {
      title: t('common.amount'),
      key: 'total',
      render: (_, record: StockReceiptItem) => {
        const qty = record?.quantity || 0;
        const cost = record?.purchase_cost || 0;
        return <strong>{(qty * cost).toLocaleString()} {currency || ''}</strong>;
      },
      width: 120,
    },
  ];

  const tabItems = [
    {
      key: 'list',
      label: (
        <span>
          <TeamOutlined />
          {t('stockReceipts.list')}
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder={t('stockReceipts.searchPlaceholder', { defaultValue: 'Поиск приходов...' })}
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder={t('stockReceipts.filterBySupplier', { defaultValue: 'Фильтр по поставщику' })}
                value={selectedSupplier}
                onChange={setSelectedSupplier}
                allowClear
                style={{ width: '100%' }}
              >
                {suppliers.map(supplier => (
                  <Option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={12}>
              <DatePicker
                placeholder={t('common.filterByDate', { defaultValue: 'Фильтр по дате' })}
                value={selectedDate ? dayjs(selectedDate) : null}
                onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : '')}
                style={{ width: '100%' }}
                allowClear
              />
            </Col>
          </Row>
          <Table
            columns={columns}
            dataSource={stockReceipts.filter(receipt => 
              (!selectedSupplier || receipt.supplier_id === selectedSupplier) &&
              (receipt.supplier_name.toLowerCase().includes(searchText.toLowerCase()) ||
              receipt.id.toString().includes(searchText))
            )}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            size="small"
            onRow={(record) => ({
              onClick: () => {
                setSelectedReceipt(record);
                setDetailModalVisible(true);
              },
              style: { cursor: 'pointer' }
            })}
          />
        </div>
      ),
    },
    {
      key: 'create',
      label: (
        <span>
          <PlusOutlined />
          {t('stockReceipts.create')}
        </span>
      ),
      children: (
        <Row justify="center">
          <Col xs={24} sm={24} md={20} lg={16} xl={12}>
            <Card>
              <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
                <ShoppingCartOutlined /> {t('stockReceipts.newReceipt')}
              </Title>
              <Form
                form={form}
                name="createStockReceipt"
                onFinish={handleCreate}
                autoComplete="off"
                layout="vertical"
                size="large"
              >
                <Row gutter={16}>
                  <Col xs={24} sm={16}>
                    <Form.Item
                      name="supplier_id"
                      label={t('stockReceipts.supplier')}
                      rules={[{ required: true, message: t('stockReceipts.selectSupplier', { defaultValue: 'Выберите поставщика' }) }]}
                    >
                      <Select
                        placeholder={t('stockReceipts.selectSupplier', { defaultValue: 'Выберите поставщика' })}
                        prefix={<ShopOutlined />}
                        onChange={(value) => {
                          const supplier = suppliers.find(s => s.id === value);
                          if (supplier?.currency) {
                            form.setFieldValue('currency', supplier.currency);
                          }
                        }}
                      >
                        {suppliers.map(supplier => (
                          <Option key={supplier.id} value={supplier.id}>
                            {supplier.name} ({supplier.currency})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name="currency"
                      label={t('common.currency')}
                      initialValue="TJS"
                    >
                      <Select disabled>
                        <Option value="TJS">TJS</Option>
                        <Option value="USD">USD</Option>
                        <Option value="RUB">RUB</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) =>
                    prevValues.currency !== currentValues.currency ||
                    prevValues.supplier_id !== currentValues.supplier_id
                  }
                >
                  {({ getFieldValue }) => {
                    const currency = getFieldValue('currency');
                    return currency !== 'TJS' ? (
                      <Form.Item
                        name="rate"
                        label={t('common.rate')}
                        rules={[{ required: true, message: t('errors.required') }]}
                        initialValue={1}
                      >
                        <InputNumber
                          min={0.001}
                          step={0.001}
                          precision={0}
                          style={{ width: '100%' }}
                          prefix={<SwapOutlined />}
                          placeholder={t('stockReceipts.enterRate', { defaultValue: 'Введите курс к TJS' })}
                        />
                      </Form.Item>
                    ) : null;
                  }}
                </Form.Item>

                <Form.Item label={t('stockReceipts.items')}>
                  <div style={{ marginBottom: 16 }}>
                    <Button
                      type="dashed"
                      onClick={addReceiptItem}
                      icon={<PlusOutlined />}
                      block
                    >
                      {t('stockReceipts.addItem')}
                    </Button>
                  </div>
                  
                  {receiptItems.map((item, index) => (
                    <Card
                      key={index}
                      size="small"
                      style={{ marginBottom: 16 }}
                      title={`${t('common.product')} ${index + 1}`}
                      extra={
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeReceiptItem(index)}
                        />
                      }
                    >
                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={t('common.product')}
                            required
                          >
                            <Select
                              placeholder={t('stockReceipts.selectProduct', { defaultValue: 'Выберите товар' })}
                              value={item.product_id || undefined}
                              onChange={(value) => {
                                console.log(`Updating item ${index} product_id to:`, value, 'type:', typeof value);
                                updateReceiptItem(index, 'product_id', value);
                                const selected = products.find(p => p.id === value);
                                if (selected?.type !== 'batch') {
                                  // Only update batch_code if it exists, don't override other fields
                                  const currentItem = receiptItems[index];
                                  if (currentItem.batch_code !== undefined) {
                                    updateReceiptItem(index, 'batch_code', undefined);
                                  }
                                }
                              }}
                              showSearch
                              status={!item.product_id || item.product_id <= 0 ? 'error' : undefined}
                              filterOption={(input, option) => {
                                const product = products.find(p => p.id === option?.value);
                                return product?.name.toLowerCase().includes(input.toLowerCase()) ?? false;
                              }}
                            >
                              {products.map(product => (
                                <Option key={product.id} value={product.id}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{product.name}</span>
                                    <span style={{ 
                                      color: product.stock_quantity <= 10 ? '#ff4d4f' : product.stock_quantity <= 50 ? '#faad14' : '#52c41a',
                                      fontWeight: product.stock_quantity <= 10 ? 'bold' : 'normal',
                                      fontSize: '12px'
                                    }}>
                                      Stock: {product.stock_quantity}
                                    </span>
                                  </div>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        {(() => {
                          const selectedProduct = products.find(p => p.id === item.product_id);
                          if (selectedProduct?.type !== 'batch') return null;
                          return (
                            <Col xs={24} sm={12}>
                              <Form.Item label={t('stockReceipts.batchCode', { defaultValue: 'Партия (batch_code)' })}>
                                <Input
                                  placeholder="Например: PARTY-A"
                                  value={item.batch_code}
                                  onChange={(e) => updateReceiptItem(index, 'batch_code', e.target.value)}
                                />
                              </Form.Item>
                            </Col>
                          );
                        })()}
                        <Col xs={12} sm={6}>
                          <Form.Item
                            label={t('common.quantity')}
                            required
                          >
                            <InputNumber
                              placeholder={t('stockReceipts.quantityPlaceholder', { defaultValue: 'Кол-во' })}
                              min={1}
                              value={item.quantity}
                              onChange={(value) => updateReceiptItem(index, 'quantity', value || 1)}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                          <Form.Item
                            label={t('stockReceipts.purchaseCost')}
                            required
                          >
                            <InputNumber
                              placeholder={t('common.price')}
                              min={0}
                              step={0.01}
                              value={item.purchase_cost || undefined}
                              onChange={(value) => updateReceiptItem(index, 'purchase_cost', value || 0)}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                          <Form.Item
                            label={t('stockReceipts.sellingPrice')}
                            required
                          >
                            <InputNumber
                              placeholder={t('common.price')}
                              min={0}
                              step={0.01}
                              value={item.selling_price || undefined}
                              onChange={(value) => updateReceiptItem(index, 'selling_price', value || 0)}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Form.Item
                          noStyle
                          shouldUpdate={(prevValues, currentValues) =>
                            prevValues.currency !== currentValues.currency ||
                            prevValues.rate !== currentValues.rate
                          }
                        >
                          {({ getFieldValue }) => {
                            const currency = getFieldValue('currency');
                            const rate = getFieldValue('rate') || 1;
                            const convertedPrice = currency !== 'TJS' && item.purchase_cost ? item.purchase_cost * rate : null;
                            return currency !== 'TJS' ? (
                              <Col xs={12} sm={6}>
                                <Form.Item
                                  label={t('stockReceipts.purchaseCostConverted', { defaultValue: 'Цена закупки (TJS)' })}
                                >
                                  <InputNumber
                                    value={convertedPrice}
                                    disabled
                                    style={{ width: '100%' }}
                                    formatter={(value) => `${value?.toLocaleString()} TJS`}
                                  />
                                </Form.Item>
                              </Col>
                            ) : null;
                          }}
                        </Form.Item>
                      </Row>
                    </Card>
                  ))}
                </Form.Item>

                <Form.Item style={{ marginTop: 24 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={creating}
                    icon={<SaveOutlined />}
                    block
                    size="large"
                  >
                    {t('stockReceipts.create')}
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
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>{t('stockReceipts.title')}</Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <Modal
        title={`${t('stockReceipts.receipt')} #${selectedReceipt?.id} - ${t('common.details')}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedReceipt && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Tag color="blue" icon={<ClockCircleOutlined />}>
                  {new Date(selectedReceipt.created_at).toLocaleDateString()}
                </Tag>
              </Col>
              <Col span={8}>
                <Tag color="orange" icon={<ShopOutlined />}>
                  {selectedReceipt.supplier_name}
                </Tag>
              </Col>
              <Col span={8}>
                <Tag color="orange" icon={<DollarOutlined />}>
                  {t('common.total')}: {selectedReceipt.total_amount.toLocaleString()} {selectedReceipt.currency}
                  {/* {selectedReceipt.currency !== 'TJS' && selectedReceipt.total_amount_converted && (
                    <> | {selectedReceipt.total_amount_converted.toFixed(2).toLocaleString()} TJS</>
                  )} */}
                </Tag>
              </Col>
                          </Row>
            
            {loadingReceiptDetails ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin size="large" />
                <div style={{ marginTop: 8 }}>{t('common.loading')}...</div>
              </div>
            ) : (
              <Table
                columns={getItemColumns(selectedReceipt.currency)}
                dataSource={selectedReceipt.items}
                rowKey="id"
                pagination={false}
                scroll={{ x: 'max-content' }}
                size="small"
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
