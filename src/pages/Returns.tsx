import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Card, message, Popconfirm, Tabs, Form, Select, InputNumber, Row, Col, type TableProps, Modal, Input, Tag, Spin, DatePicker } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { DeleteOutlined, SaveOutlined, TeamOutlined, PlusOutlined, SearchOutlined, DollarOutlined, CalendarOutlined, UserOutlined, RotateLeftOutlined } from '@ant-design/icons';
import { returnsApi, customersApi, productsApi, stockItemsApi, type Return, type ReturnItem, type CreateReturnRequest, type Customer, type Product, type StockItem } from '../api';

interface CreateReturnItemLocal {
  product_id: number;
  quantity: number;
  unit_price: number;
  unit_value?: number;
  stock_item_id?: number;
}

interface ProductGroup {
  productId: number;
  stock_item_id?: number;
  items: CreateReturnItemLocal[];
}

const { Title, Text } = Typography;
const { Option } = Select;

export const Returns = () => {
  const { t } = useTranslation();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [creating, setCreating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [returnItems, setReturnItems] = useState<CreateReturnItemLocal[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [loadingReturnDetails, setLoadingReturnDetails] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [productStockItems, setProductStockItems] = useState<Record<number, StockItem[]>>({});
  const [loadingStockItems, setLoadingStockItems] = useState<Record<number, boolean>>({});
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);

  // Calculate total amount for return items
  const calculateTotalAmount = () => {
    return returnItems.reduce((sum, item) => sum + (item.quantity * item.unit_price * (item.unit_value || 1.0)), 0);
  };

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const params: any = {};
      
      // If date is selected, use only date
      if (selectedDate) {
        params.date = selectedDate;
      }
      
      console.log('Fetching returns with params:', params);
      const data = await returnsApi.getAll(params);
      setReturns(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error(t('errors.unauthorized'));
      } else {
        message.error(t('returns.errorLoading', { defaultValue: 'Ошибка загрузки возвратов' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await customersApi.getAll();
      setCustomers(data);
      
      // Автоматически выбираем клиента "Розница"
      const defaultCustomer = data.find(customer => 
        customer.full_name.toLowerCase().includes('розница')
      );
      if (defaultCustomer) {
        form.setFieldValue('customer_id', defaultCustomer.id);
      }
    } catch (error: unknown) {
      message.error(t('customers.errorLoading', { defaultValue: 'Ошибка при загрузке клиентов' }));
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

  const fetchProductStockItems = async (productId: number) => {
    if (productStockItems[productId]) return; // already cached
    setLoadingStockItems(prev => ({ ...prev, [productId]: true }));
    try {
      const product = products.find(p => p.id === productId);
      const actualProductId = product?.id || productId;
      const response = await stockItemsApi.getByProductId(actualProductId);
      setProductStockItems(prev => ({ ...prev, [productId]: response.batches || [] }));
    } catch (error) {
      console.error(`Failed to load stock items for product ${productId}:`, error);
    } finally {
      setLoadingStockItems(prev => ({ ...prev, [productId]: false }));
    }
  };

  useEffect(() => {
    fetchReturns();
    fetchCustomers();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchReturns();
  }, [selectedDate]);

  useEffect(() => {
    if (selectedReturn && detailModalVisible && !selectedReturn.items) {
      loadReturnDetails(selectedReturn.id);
    }
  }, [selectedReturn, detailModalVisible]);

  const loadReturnDetails = async (id: number) => {
    setLoadingReturnDetails(true);
    try {
      const detailedReturn = await returnsApi.getById(id);
      setSelectedReturn(detailedReturn);
    } catch (error: unknown) {
      message.error(t('returns.errorLoadingDetails', { defaultValue: 'Ошибка загрузки деталей возврата' }));
    } finally {
      setLoadingReturnDetails(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleDelete = async (id: number) => {
    try {
      await returnsApi.delete(id);
      message.success(t('returns.returnDeleted', { defaultValue: 'Возврат успешно удален' }));
      fetchReturns();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 404) {
        message.error(t('errors.notFound'));
      } else {
        message.error(t('returns.errorDeleting', { defaultValue: 'Ошибка удаления возврата' }));
      }
    }
  };

  const handleCreate = async (values: any) => {
    setCreating(true);
    try {
      if (returnItems.length === 0) {
        message.error(t('sales.addAtLeastOneItem', { defaultValue: 'Добавьте хотя бы один товар' }));
        return;
      }

      // Validate each return item
      for (const item of returnItems) {
        if (!item.product_id || item.product_id === 0) {
          message.error(t('sales.selectProductForAll', { defaultValue: 'Выберите товар для всех позиций' }));
          setCreating(false);
          return;
        }
        if (!item.quantity || item.quantity <= 0) {
          message.error(t('sales.specifyQuantity', { defaultValue: 'Укажите корректное количество для всех позиций' }));
          setCreating(false);
          return;
        }
        if (!item.unit_price || item.unit_price <= 0) {
          message.error(t('sales.specifyPrice', { defaultValue: 'Укажите корректную цену для всех позиций' }));
          setCreating(false);
          return;
        }
        const selectedProduct = products.find(p => p.id === item.product_id);
        if (selectedProduct?.type === 'batch' && !item.stock_item_id) {
          message.error(t('sales.selectBatchForAllBatchProducts', { defaultValue: 'Выберите партию для всех batch товаров' }));
          setCreating(false);
          return;
        }
      }

      const createData: CreateReturnRequest = {
        customer_id: values.customer_id,
        items: returnItems,
      };

      console.log('Creating return with data:', createData);
      await returnsApi.create(createData);
      message.success(t('returns.returnCreated', { defaultValue: 'Возврат успешно создан' }));
      form.resetFields();
      setReturnItems([]);
      setActiveTab('list');
      fetchReturns();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string; error?: string } }; message?: string };
      console.log('Server error response:', axiosError.response);
      
      if (axiosError.response?.status === 400) {
        const errorMessage = axiosError.response.data?.message || axiosError.response.data?.error || 'Проверьте обязательные поля';
        message.error(errorMessage);
      } else if (axiosError.message?.includes('Network Error')) {
        message.error(t('errors.networkError'));
      } else {
        message.error(t('returns.errorCreating', { defaultValue: 'Ошибка создания возврата' }));
      }
    } finally {
      setCreating(false);
    }
  };

  const addReturnItem = () => {
    const newItem: CreateReturnItemLocal = {
      product_id: 0,
      quantity: 1,
      unit_price: 0,
      unit_value: 1.0,
      stock_item_id: undefined,
    };
    setReturnItems([...returnItems, newItem]);
  };

  const updateReturnItem = (index: number, field: keyof CreateReturnItemLocal, value: any) => {
    const updatedItems = [...returnItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-populate unit_price from product selling_price when product changes
    if (field === 'product_id') {
      const selected = products.find(p => p.id === value);
      if (selected?.selling_price) {
        updatedItems[index].unit_price = selected.selling_price;
      }
      // Reset stock_item_id if product changes and is not batch
      if (selected?.type !== 'batch') {
        updatedItems[index].stock_item_id = undefined;
        // Remove group batch if product is not batch
        setProductGroups(prev => prev.filter(g => g.productId !== value));
      } else {
        fetchProductStockItems(value);
        // Create or update group for batch product
        setProductGroups(prev => {
          const existing = prev.find(g => g.productId === value);
          if (existing) {
            return prev.map(g => g.productId === value ? { ...g, productId: value } : g);
          } else {
            return [...prev, { productId: value, items: [] }];
          }
        });
      }
    }
    
    setReturnItems(updatedItems);
  };

  // Group return items by product for UI display
  const getGroupedReturnItems = () => {
    const groups = new Map<number, CreateReturnItemLocal[]>();
    
    returnItems.forEach(item => {
      if (!groups.has(item.product_id)) {
        groups.set(item.product_id, []);
      }
      groups.get(item.product_id)!.push(item);
    });
    
    return Array.from(groups.entries()).map(([productId, items]) => {
      const product = products.find(p => p.id === Number(productId));
      const totalMeters = items.reduce((sum, item) => sum + (item.quantity * (item.unit_value || 1.0)), 0);
      const totalPrice = items.reduce((sum, item) => sum + (item.quantity * item.unit_price * (item.unit_value || 1.0)), 0);
      const group = productGroups.find(g => g.productId === Number(productId));
      
      return {
        productId: Number(productId),
        product,
        items,
        totalMeters,
        totalPrice,
        stock_item_id: group?.stock_item_id
      };
    });
  };

  const updateProductGroupBatch = (productId: number, stockItemId: number | undefined) => {
    setProductGroups(prev => {
      const existing = prev.find(g => g.productId === productId);
      if (existing) {
        return prev.map(g => g.productId === productId ? { ...g, stock_item_id: stockItemId } : g);
      } else {
        return [...prev, { productId, stock_item_id: stockItemId, items: [] }];
      }
    });

    // Update all items of this product with the new batch
    setReturnItems(prev => prev.map(item => {
      if (item.product_id === productId) {
        const updatedItem = { ...item, stock_item_id: stockItemId };
        // Auto-populate unit_price from selected batch selling_price
        if (stockItemId) {
          const stockItems = productStockItems[productId] || [];
          const selectedBatch = stockItems.find(si => si.id === stockItemId);
          if (selectedBatch?.selling_price) {
            updatedItem.unit_price = selectedBatch.selling_price;
          }
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const removeReturnItem = (index: number) => {
    setReturnItems(returnItems.filter((_, i) => i !== index));
  };

  const columns: TableProps<Return>['columns'] = [
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
      title: t('common.customer'),
      dataIndex: 'customer_name',
      key: 'customer_name',
      ellipsis: true,
    },
    {
      title: t('common.totalAmount'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: string) => (
        <span style={{ color: '#52c41a' }}>
          <DollarOutlined style={{ marginRight: 4 }} />
          {parseFloat(amount).toLocaleString()}
        </span>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Return) => (
        <Space size="small">
          <Button
            icon={<RotateLeftOutlined />}
            onClick={() => {
              setSelectedReturn(record);
              setDetailModalVisible(true);
            }}
            size="small"
            title={t('common.viewDetails')}
          />
          <Popconfirm
            title={t('returns.confirmDelete')}
            description={t('returns.deleteWarning')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button danger icon={<DeleteOutlined />} size="small" title="Delete" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const itemColumns: TableProps<ReturnItem>['columns'] = [
    {
      title: t('common.product'),
      dataIndex: 'product_name',
      key: 'product_name',
      ellipsis: true,
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
      title: t('sales.unitValue'),
      dataIndex: 'unit_value',
      key: 'unit_value',
      width: 80,
      render: (value: number) => value?.toLocaleString() || '1',
    },
    {
      title: t('common.unitPrice'),
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: number) => price.toLocaleString(),
      width: 100,
    },
    {
      title: t('common.amount'),
      key: 'total',
      render: (_, record: ReturnItem) => (
        <strong>{(record.quantity * record.unit_price * (record.unit_value || 1.0)).toLocaleString()}</strong>
      ),
      width: 100,
    },
    {
      title: t('sales.batch'),
      key: 'batch',
      width: 120,
      render: (_, record: ReturnItem) => (
        record.product_type === 'batch' && record.batch_code ? (
          <Tag color="blue">{record.batch_code}</Tag>
        ) : (
          <span>-</span>
        )
      ),
    },
  ];

  const tabItems = [
    {
      key: 'list',
      label: (
        <span>
          <TeamOutlined />
          {t('returns.list')}
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder={t('returns.searchPlaceholder')}
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <DatePicker
                placeholder={t('common.filterByDate')}
                value={selectedDate ? dayjs(selectedDate) : null}
                onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : '')}
                style={{ width: '100%' }}
                allowClear
              />
            </Col>
          </Row>
          <Table
            columns={columns}
            dataSource={returns.filter(returnItem => 
              returnItem.customer_name.toLowerCase().includes(searchText.toLowerCase()) ||
              returnItem.id.toString().includes(searchText)
            )}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            size="small"
            onRow={(record) => ({
              onClick: () => {
                setSelectedReturn(record);
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
          {t('returns.create')}
        </span>
      ),
      children: (
        <Row justify="center">
          <Col xs={24} sm={24} md={20} lg={16} xl={12}>
            <Card>
              <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
                <RotateLeftOutlined /> {t('returns.newReturn')}
              </Title>
              <Form
                form={form}
                name="createReturn"
                onFinish={handleCreate}
                autoComplete="off"
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="customer_id"
                  label={t('common.customer')}
                  rules={[{ required: true, message: t('returns.selectCustomer') }]}
                >
                  <Select placeholder={t('returns.selectCustomer')} prefix={<UserOutlined />}>
                    {customers.map(customer => (
                      <Option key={customer.id} value={customer.id}>
                        {customer.full_name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label="Товары">
                  <div style={{ marginBottom: 16 }}>
                    <Button
                      type="dashed"
                      onClick={addReturnItem}
                      icon={<PlusOutlined />}
                      block
                    >
                      {t('returns.addItem', { defaultValue: 'Добавить позицию' })}
                    </Button>
                  </div>
                  
                  {getGroupedReturnItems().map((group) => (
                    <Card
                      key={group.productId}
                      size="small"
                      style={{ marginBottom: 16 }}
                      title={
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <Select
                            placeholder="Выберите товар"
                            value={group.productId || undefined}
                            onChange={(value) => {
                              // Update all items in this group to the new product
                              const updatedItems = returnItems.map(item => {
                                if (getGroupedReturnItems().find(g => g.productId === group.productId)?.items.includes(item)) {
                                  const selected = products.find(p => p.id === value);
                                  return {
                                    ...item,
                                    product_id: value,
                                    unit_price: selected?.selling_price || item.unit_price,
                                    stock_item_id: selected?.type === 'batch' ? item.stock_item_id : undefined
                                  };
                                }
                                return item;
                              });
                              setReturnItems(updatedItems);
                              
                              // Fetch stock items for batch products
                              const selectedProduct = products.find(p => p.id === value);
                              if (selectedProduct?.type === 'batch') {
                                fetchProductStockItems(value);
                              }
                            }}
                            showSearch
                            filterOption={(input, option) => {
                              const product = products.find(p => p.id === option?.value);
                              return product?.name.toLowerCase().includes(input.toLowerCase()) ?? false;
                            }}
                            style={{ width: '100%' }}
                          >
                            {products.map(product => (
                              <Option key={product.id} value={product.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>{product.name}</span>
                                  <span style={{ 
                                    color: '#52c41a',
                                    fontSize: '12px'
                                  }}>
                                    Цена: {product.selling_price?.toLocaleString() || 0}
                                  </span>
                                </div>
                              </Option>
                            ))}
                          </Select>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {group.product?.type === 'batch' && (
                              <Select
                                placeholder="Выберите партию"
                                value={group.stock_item_id || undefined}
                                onChange={(value) => updateProductGroupBatch(group.productId, value)}
                                loading={loadingStockItems[group.productId]}
                                style={{ flex: 1 }}
                              >
                                {(productStockItems[group.productId] || []).map(stockItem => (
                                  <Option key={stockItem.id} value={stockItem.id}>
                                    {stockItem.batch_code}
                                  </Option>
                                ))}
                              </Select>
                            )}
                            <InputNumber
                              placeholder="Цена"
                              min={0}
                              step={0.01}
                              value={group.items[0]?.unit_price || 0}
                              onChange={(value) => {
                                // Update price for all items in this group
                                const updatedItems = returnItems.map(item => {
                                  if (getGroupedReturnItems().find(g => g.productId === group.productId)?.items.includes(item)) {
                                    return { ...item, unit_price: value || 0 };
                                  }
                                  return item;
                                });
                                setReturnItems(updatedItems);
                              }}
                              style={{ flex: '0 0 120px' }}
                            />
                          </div>
                        </div>
                      }
                    >
                  {group.items.map((item, itemIndex) => {
                    const globalIndex = returnItems.findIndex(
                      ri => ri.product_id === item.product_id && 
                      ri.stock_item_id === item.stock_item_id && 
                      ri.unit_price === item.unit_price &&
                      ri.quantity === item.quantity
                    );
                    return (
                      <div key={itemIndex} style={{ marginBottom: 8 }}>
                        <Row gutter={8} align="middle">
                          <Col flex="80px">
                            <InputNumber
                              placeholder="Штук"
                              min={1}
                              value={item.quantity || undefined}
                              onChange={(value) => updateReturnItem(globalIndex, 'quantity', value || 1)}
                              style={{ width: '100%' }}
                            />
                          </Col>
                          <Col flex="80px">
                            <InputNumber
                              placeholder="Вес/объем"
                              min={0.01}
                              step={0.01}
                              value={item.unit_value || undefined}
                              onChange={(value) => updateReturnItem(globalIndex, 'unit_value', value || 1.0)}
                              style={{ width: '100%' }}
                            />
                          </Col>
                          <Col flex="120px">
                            <InputNumber
                              placeholder="Сумма"
                              value={item.quantity * item.unit_price * (item.unit_value || 1.0)}
                              disabled
                              style={{ width: '100%', backgroundColor: '#f5f5f5' }}
                            />
                          </Col>
                          <Col flex="40px">
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => removeReturnItem(globalIndex)}
                            />
                          </Col>
                        </Row>
                      </div>
                    );
                  })}
                  
                  {/* Кнопка добавления строки для этого товара */}
                  <Button
                    type="dashed"
                    onClick={() => {
                      const newItem: CreateReturnItemLocal = {
                        product_id: group.productId,
                        quantity: 1,
                        unit_price: group.items[0]?.unit_price || group.product?.selling_price || 0,
                        unit_value: group.items[0]?.unit_value || 1.0,
                        stock_item_id: group.stock_item_id,
                      };
                      setReturnItems([...returnItems, newItem]);
                    }}
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    + {t('sales.addRowForProduct', { defaultValue: 'Добавить строку для этого товара' })}
                  </Button>
                  
                  {/* Детальная информация об итогах */}
                  {group.items.length > 0 && (
                    <div style={{ 
                      marginTop: 12, 
                      padding: '8px 12px', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '4px',
                      border: '1px solid #e9ecef',
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                      color: '#333'
                    }}>
                      Итог: {group.totalMeters} ед × {group.items[0]?.unit_price || 0} = {group.totalPrice.toLocaleString()} TJS
                    </div>
                  )}
                </Card>
              ))}
                </Form.Item>

                {/* Total Amount Display */}
                {returnItems.length > 0 && (
                  <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f6ffed' }}>
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Text strong style={{ fontSize: '16px' }}>
                          <DollarOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                          {t('common.totalAmount')}:
                        </Text>
                      </Col>
                      <Col>
                        <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                          {calculateTotalAmount().toLocaleString()}
                        </Text>
                      </Col>
                    </Row>
                  </Card>
                )}

                <Form.Item style={{ marginTop: 24 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={creating}
                    icon={<SaveOutlined />}
                    block
                    size="large"
                  >
                    {t('returns.createReturn', { defaultValue: 'Создать возврат' })}
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
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>Возвраты</Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <Modal
        title={`Возврат #${selectedReturn?.id} - Детали`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedReturn && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Tag color="blue" icon={<CalendarOutlined />}>
                  {new Date(selectedReturn.created_at).toLocaleDateString()}
                </Tag>
              </Col>
              <Col span={6}>
                <Tag color="green" icon={<UserOutlined />}>
                  {selectedReturn.customer_name}
                </Tag>
              </Col>
              <Col span={6}>
                <Tag color="orange" icon={<DollarOutlined />}>
                  Сумма: {parseFloat(selectedReturn.total_amount).toLocaleString()}
                </Tag>
              </Col>
            </Row>
            
            {loadingReturnDetails ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin size="large" />
                <div style={{ marginTop: 8 }}>Загрузка позиций...</div>
              </div>
            ) : (
              <Table
                columns={itemColumns}
                dataSource={selectedReturn.items || []}
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
