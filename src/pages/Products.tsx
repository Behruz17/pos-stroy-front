import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Card, message, Popconfirm, Tabs, Form, Input, InputNumber, Row, Col, type TableProps, Image, Upload, Modal, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { EditOutlined, DeleteOutlined, SaveOutlined, TeamOutlined, PlusOutlined, ShoppingOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { productsApi, exchangeRatesApi, stockAdjustmentsApi, stockItemsApi, type Product, type ExchangeRate, type CreateStockAdjustment, type StockItem } from '../api';

const { Title, Text } = Typography;

export const Products = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [creating, setCreating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [currentRates, setCurrentRates] = useState<ExchangeRate[]>([]);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);
  const [newStockQuantity, setNewStockQuantity] = useState<number>(0);
  const [newPrice, setNewPrice] = useState<number | undefined>(undefined);
  const [adjustingStock, setAdjustingStock] = useState(false);
  const [productStockItems, setProductStockItems] = useState<Record<number, StockItem[]>>({});
  const [batchesModalVisible, setBatchesModalVisible] = useState(false);
  const [selectedProductForBatches, setSelectedProductForBatches] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productsApi.getAll();
      setProducts(data);
      setFilteredProducts(data);
      
      // Load stock items for batch products to get their prices
      const batchProducts = data.filter(p => p.type === 'batch');
      await Promise.all(
        batchProducts.map(product => fetchProductStockItems(product.id))
      );
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error(t('errors.unauthorized'));
      } else {
        message.error(t('products.errorLoading'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(value.toLowerCase()) ||
      product.manufacturer?.toLowerCase().includes(value.toLowerCase()) ||
      product.product_code?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  useEffect(() => {
    fetchProducts();
    fetchCurrentRates();
  }, []);

  const fetchCurrentRates = async () => {
    setLoading(true);
    try {
      const data = await exchangeRatesApi.getAll();
      setCurrentRates(data);
    } catch (error: unknown) {
      console.error('Error fetching exchange rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductStockItems = async (productId: number) => {
    if (productStockItems[productId]) return; // already cached
    try {
      const response = await stockItemsApi.getByProductId(productId);
      setProductStockItems(prev => ({ ...prev, [productId]: response.batches || [] }));
    } catch (error) {
      console.error(`Failed to load stock items for product ${productId}:`, error);
    }
  };

  const handleShowBatches = async (product: Product) => {
    setSelectedProductForBatches(product);
    await fetchProductStockItems(product.id);
    setBatchesModalVisible(true);
  };

  const getCurrentRateForCurrency = (currency: string): number | null => {
    const rate = currentRates.find(r => r.currency === currency);
    return rate ? Number(rate.rate_to_tjs) : null;
  };

  const getProductPrice = (product: Product): number | null => {
    // If product has selling_price, use it
    if (product.selling_price) {
      return product.selling_price;
    }
    
    // For batch products without selling_price, get from first available batch
    if (product.type === 'batch') {
      const stockItems = productStockItems[product.id] || [];
      if (stockItems.length > 0) {
        // Find first batch with selling_price
        const batchWithPrice = stockItems.find(si => si.selling_price);
        if (batchWithPrice?.selling_price) {
          return batchWithPrice.selling_price;
        }
      }
    }
    
    return null;
  };

  const handleDelete = async (id: number) => {
    try {
      await productsApi.delete(id);
      message.success(t('products.productDeleted'));
      fetchProducts();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 404) {
        message.error(t('errors.notFound'));
      } else {
        message.error(t('products.errorDeleting'));
      }
    }
  };

  const handleCreate = async (values: any) => {
    setCreating(true);
    try {
      await productsApi.create(values);
      message.success(t('products.productCreated'));
      form.resetFields();
      setImagePreview(null);
      setActiveTab('list');
      fetchProducts();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } }; message?: string };
      if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || t('errors.required'));
      } else if (axiosError.message?.includes('Network Error')) {
        message.error(t('errors.networkError'));
      } else {
        message.error(t('products.errorCreating'));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditModalVisible(true);
    setEditImagePreview(`http://localhost:3000${product.image}`);
    form.setFieldsValue({
      name: product.name,
    });
  };

  const handleUpdate = async (values: any) => {
    if (!editingProduct) return;

    setEditing(true);
    try {
      await productsApi.update(editingProduct.id, values);
      message.success(t('products.productUpdated'));
      setEditModalVisible(false);
      setEditingProduct(null);
      setEditImagePreview(null);
      form.resetFields();
      fetchProducts();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } }; message?: string };
      if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || t('products.errorUpdating'));
      } else if (axiosError.message?.includes('Network Error')) {
        message.error(t('errors.networkError'));
      } else {
        message.error(t('products.errorUpdating'));
      }
    } finally {
      setEditing(false);
    }
  };

  const handleStockAdjustment = (product: Product) => {
    setSelectedProductForStock(product);
    setNewStockQuantity(product.stock_quantity);
    setNewPrice(undefined); // Reset price
    setStockModalVisible(true);
  };

  const handleSaveStockAdjustment = async () => {
    if (!selectedProductForStock) return;

    if (newStockQuantity < 0) {
      message.error('Остаток не может быть отрицательным');
      return;
    }

    if (newPrice !== undefined && newPrice < 0) {
      message.error('Цена не может быть отрицательной');
      return;
    }

    // Check if at least one field is changed
    const quantityChanged = newStockQuantity !== selectedProductForStock.stock_quantity;
    const currentPrice = getProductPrice(selectedProductForStock);
    const priceChanged = newPrice !== undefined && newPrice !== currentPrice;
    
    if (!quantityChanged && !priceChanged) {
      message.error('Нет изменений для сохранения');
      return;
    }

    // Check price adjustment for simple products
    if (priceChanged && selectedProductForStock.type === 'simple') {
      message.error('Изменение цены доступно только для партионных товаров (batch)');
      return;
    }

    setAdjustingStock(true);
    try {
      const adjustmentData: CreateStockAdjustment = {
        product_id: selectedProductForStock.id,
        ...(quantityChanged && { new_quantity: newStockQuantity }),
        ...(priceChanged && { new_price: newPrice }),
        reason: `Корректировка${quantityChanged && priceChanged ? ' остатка и цены' : quantityChanged ? ' остатка' : ' цены'} со страницы товаров`,
      };

      await stockAdjustmentsApi.create(adjustmentData);
      message.success('Корректировка успешно сохранена');
      setStockModalVisible(false);
      setSelectedProductForStock(null);
      setNewStockQuantity(0);
      setNewPrice(undefined);
      fetchProducts();
    } catch (error: unknown) {
      console.error('Stock adjustment error:', error);
      
      const axiosError = error as { 
        response?: { 
          status: number; 
          data?: any; 
          statusText?: string;
        }; 
        message?: string;
        config?: any;
      };
      
      // Log detailed server response for 500 errors
      if (axiosError.response?.status === 500) {
        console.error('Server 500 Error Response:', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          config: {
            url: axiosError.config?.url,
            method: axiosError.config?.method,
            data: axiosError.config?.data
          }
        });
        message.error('Внутренняя ошибка сервера. Подробности в консоли.');
      } else if (axiosError.response?.status === 400) {
        console.error('Validation Error:', axiosError.response.data);
        message.error(axiosError.response.data.message || 'Ошибка валидации');
      } else if (axiosError.message?.includes('Network Error')) {
        console.error('Network Error:', axiosError.message);
        message.error('Ошибка сети');
      } else {
        console.error('Unknown Error:', error);
        message.error('Ошибка при сохранении корректировки');
      }
    } finally {
      setAdjustingStock(false);
    }
  };

  const columns: TableProps<Product>['columns'] = [
    {
      title: t('common.id'),
      key: 'rowNumber',
      width: 60,
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: t('products.image'),
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (image: string) => (
        <Image
          src={`http://localhost:3000${image}`}
          alt="товар"
          style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
          preview={false}
        />
      ),
    },
    {
      title: t('common.name'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (type: Product['type']) => (type === 'batch' ? t('products.batch') : t('products.simple')),
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('products.stock'),
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      render: (quantity: number) => (
        <span style={{ 
          color: quantity <= 10 ? '#ff4d4f' : quantity <= 50 ? '#faad14' : '#52c41a',
          fontWeight: quantity <= 10 ? 'bold' : 'normal'
        }}>
          {quantity}
        </span>
      ),
      width: 80,
    },
    {
      title: 'Цена закупки',
      dataIndex: 'purchase_cost',
      key: 'purchase_cost',
      width: 140,
      align: 'right',
      render: (cost: number | null, record: Product) => cost ? `${cost.toLocaleString()} ${record.currency || ''}` : '-',
    },
    {
      title: 'Цена продажи',
      dataIndex: 'selling_price',
      key: 'selling_price',
      width: 120,
      align: 'right',
      render: (_: number | null, record: Product) => {
        const productPrice = getProductPrice(record);
        return productPrice ? productPrice.toLocaleString() : '-';
      },
    },
    {
      title: 'Цена закупки (TJS)',
      dataIndex: 'purchase_cost_converted',
      key: 'purchase_cost_converted',
      width: 140,
      align: 'right',
      render: (cost: number | null) => cost ? cost.toLocaleString() : '-',
    },
    {
      title: 'Цена закупки (TJS) по текущему курсу',
      key: 'purchase_cost_converted_current',
      width: 180,
      align: 'right',
      render: (_: unknown, record: Product) => {
        if (!record.purchase_cost) return '-';
        if (!record.currency || record.currency === 'TJS') {
          return Number(record.purchase_cost).toLocaleString();
        }
        const currentRate = getCurrentRateForCurrency(record.currency);
        if (!currentRate) return '-';
        const convertedPrice = Number(record.purchase_cost) * currentRate;
        return convertedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      },
    },
    {
      title: 'Курс закупки',
      dataIndex: 'rate',
      key: 'rate',
      width: 80,
      align: 'right',
      render: (rate: string | null) => rate || '-',
    },
    {
      title: 'Текущий курс',
      key: 'current_rate',
      width: 120,
      align: 'right',
      render: (_: unknown, record: Product) => {
        if (!record.currency || record.currency === 'TJS') return '-';
        const rate = getCurrentRateForCurrency(record.currency);
        return rate ? `${record.currency}: ${rate.toFixed(4)}` : '-';
      },
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 150,
      render: (_: unknown, record: Product) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Button
            type="default"
            onClick={() => handleStockAdjustment(record)}
            size="small"
            title="Корректировка остатка и цены"
          >
            📦
          </Button>
          <Popconfirm
            title="Удалить товар?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'list',
      label: (
        <span>
          <TeamOutlined />
          Список
        </span>
      ),
      children: (
        <div>
          <Input
            placeholder="Поиск товаров..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ marginBottom: 16 }}
            allowClear
          />
          <Table
            columns={columns}
            dataSource={filteredProducts}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            size="small"
            onRow={(record) => ({
              onClick: () => {
                if (record.type === 'batch') {
                  handleShowBatches(record);
                }
              },
              style: record.type === 'batch' ? { cursor: 'pointer', backgroundColor: '#f5f5f5' } : {}
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
          {t('common.create')}
        </span>
      ),
      children: (
        <Row justify="center">
          <Col xs={24} sm={20} md={16} lg={12} xl={8}>
            <Card>
              <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
                <ShoppingOutlined /> {t('products.create')}
              </Title>
              <Form
                form={form}
                name="createProduct"
                onFinish={handleCreate}
                autoComplete="off"
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="name"
                  label={t('common.name')}
                  rules={[{ required: true, message: t('errors.required') }]}
                >
                  <Input placeholder={t('products.namePlaceholder', { defaultValue: 'Например: Цемент М500' })} prefix={<ShoppingOutlined />} />
                </Form.Item>


                <Form.Item name="type" label="Тип товара" initialValue="simple">
                  <Select
                    options={[
                      { value: 'simple', label: t('products.simple') },
                      { value: 'batch', label: t('products.batch') },
                    ]}
                  />
                </Form.Item>


                {imagePreview && (
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Image
                      src={imagePreview}
                      alt="preview"
                      style={{ maxWidth: 200, maxHeight: 200, objectFit: 'cover', borderRadius: 8 }}
                      preview={false}
                    />
                  </div>
                )}
                <Form.Item
                  name="image"
                  label={t('products.image')}
                >
                  <Upload
                    name="image"
                    listType="picture-card"
                    className="avatar-uploader"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/webp';
                      if (!isJpgOrPng) {
                        message.error(t('products.imageTypeError', { defaultValue: 'Можно загружать только JPEG, PNG, GIF или WEBP файлы!' }));
                        return false;
                      }
                      const isLt5M = file.size / 1024 / 1024 < 5;
                      if (!isLt5M) {
                        message.error(t('products.imageSizeError', { defaultValue: 'Изображение должно быть меньше 5MB!' }));
                        return false;
                      }
                      
                      // Create preview
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setImagePreview(e.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                      
                      return false; // Prevent automatic upload
                    }}
                    onRemove={() => {
                      setImagePreview(null);
                    }}
                  >
                    {imagePreview ? (
                      <div>
                        <div style={{ marginBottom: 8 }}>{t('products.changeImage', { defaultValue: 'Изменить изображение' })}</div>
                        <UploadOutlined />
                      </div>
                    ) : (
                      <div>
                        <UploadOutlined />
                        <div style={{ marginTop: 8 }}>{t('products.uploadImage')}</div>
                      </div>
                    )}
                  </Upload>
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
                    {t('products.create')}
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
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>{t('products.title')}</Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <Modal
        title={t('products.edit')}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingProduct(null);
          setEditImagePreview(null);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setEditModalVisible(false);
            setEditingProduct(null);
            setEditImagePreview(null);
            form.resetFields();
          }}>
            Отмена
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()} loading={editing}>
            Обновить
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={form}
          name="editProduct"
          onFinish={handleUpdate}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            label="Наименование"
            name="name"
            rules={[{ required: true, message: 'Введите наименование товара' }]}
          >
            <Input placeholder="Введите наименование товара" prefix={<ShoppingOutlined />} />
          </Form.Item>



          {editImagePreview && (
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <Image
                src={editImagePreview}
                alt="Preview"
                style={{ maxWidth: 200, maxHeight: 200, objectFit: 'cover', borderRadius: 8 }}
                preview={false}
              />
            </div>
          )}

          <Form.Item
            name="image"
            valuePropName="file"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e[0]?.originFileObj;
              }
              return e?.fileList?.[0]?.originFileObj;
            }}
          >
            <Upload
              listType="picture-card"
              showUploadList={false}
              beforeUpload={(file) => {
                const reader = new FileReader();
                reader.onload = () => {
                  setEditImagePreview(reader.result as string);
                };
                reader.readAsDataURL(file);
                return false;
              }}
            >
              {editImagePreview ? (
                <div>
                  <div style={{ marginBottom: 8 }}>{t('products.changeImage', { defaultValue: 'Изменить изображение' })}</div>
                  <UploadOutlined />
                </div>
              ) : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>{t('products.uploadImage')}</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно корректировки остатка */}
      <Modal
        title="Корректировка остатка и цены"
        open={stockModalVisible}
        onCancel={() => {
          setStockModalVisible(false);
          setSelectedProductForStock(null);
          setNewStockQuantity(0);
          setNewPrice(undefined);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setStockModalVisible(false);
            setSelectedProductForStock(null);
            setNewStockQuantity(0);
            setNewPrice(undefined);
          }}>
            Отмена
          </Button>,
          <Button key="submit" type="primary" onClick={handleSaveStockAdjustment} loading={adjustingStock}>
            Сохранить
          </Button>,
        ]}
        width={400}
      >
        {selectedProductForStock && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>{selectedProductForStock.name}</Text>
              <br />
              <Text type="secondary">Текущий остаток: {selectedProductForStock.stock_quantity}</Text>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Text strong>Новый остаток:</Text>
              </label>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                value={newStockQuantity}
                onChange={(value) => setNewStockQuantity(value || 0)}
                placeholder="Введите новый остаток"
              />
            </div>

            {selectedProductForStock.type === 'batch' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8 }}>
                  <Text strong>Новая цена:</Text>
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                    (только для партионных товаров)
                  </Text>
                </label>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.01}
                  value={newPrice}
                  onChange={(value) => setNewPrice(value || undefined)}
                  placeholder="Введите новую цену (опционально)"
                />
                {(() => {
                  const currentPrice = getProductPrice(selectedProductForStock);
                  return currentPrice && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Текущая цена: {currentPrice}
                    </Text>
                  );
                })()}
              </div>
            )}

            {(newStockQuantity !== selectedProductForStock.stock_quantity || (newPrice !== undefined && newPrice !== selectedProductForStock.selling_price)) && (
              <div style={{ 
                padding: 12, 
                backgroundColor: '#f0f9ff', 
                borderRadius: 6,
                textAlign: 'center'
              }}>
                <Text strong>
                  Корректировка:
                  {newStockQuantity !== selectedProductForStock.stock_quantity && (
                    <span style={{ 
                      color: newStockQuantity > selectedProductForStock.stock_quantity ? '#52c41a' : '#ff4d4f',
                      marginLeft: 8
                    }}>
                      Остаток: {newStockQuantity > selectedProductForStock.stock_quantity ? '+' : ''}
                      {newStockQuantity - selectedProductForStock.stock_quantity}
                    </span>
                  )}
                  {(() => {
                    const currentPrice = getProductPrice(selectedProductForStock);
                    return newPrice !== undefined && newPrice !== currentPrice && (
                      <span style={{ 
                        color: '#1890ff',
                        marginLeft: newStockQuantity !== selectedProductForStock.stock_quantity ? 8 : 8
                      }}>
                        Цена: {newPrice > (currentPrice || 0) ? '+' : ''}
                        {(newPrice - (currentPrice || 0)).toFixed(2)}
                      </span>
                    );
                  })()}
                </Text>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Batches Modal */}
      <Modal
        title={`Партии товара: ${selectedProductForBatches?.name}`}
        open={batchesModalVisible}
        onCancel={() => {
          setBatchesModalVisible(false);
          setSelectedProductForBatches(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setBatchesModalVisible(false);
            setSelectedProductForBatches(null);
          }}>
            Закрыть
          </Button>
        ]}
        width={400}
      >
        {selectedProductForBatches && (
          <div>
            {productStockItems[selectedProductForBatches.id]?.length > 0 ? (
              <Table
                columns={[
                  {
                    title: 'Остаток',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    render: (quantity: number) => (
                      <span style={{ 
                        color: quantity <= 10 ? '#ff4d4f' : quantity <= 50 ? '#faad14' : '#52c41a',
                        fontWeight: quantity <= 10 ? 'bold' : 'normal'
                      }}>
                        {quantity}
                      </span>
                    ),
                  },
                  {
                    title: 'Цена продажи',
                    dataIndex: 'selling_price',
                    key: 'selling_price',
                    align: 'right',
                    render: (price: number) => price ? price.toLocaleString() : '-',
                  },
                ]}
                dataSource={productStockItems[selectedProductForBatches.id] || []}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                Нет партий для этого товара
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
