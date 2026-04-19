import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Card, message, Popconfirm, Tabs, Form, Select, InputNumber, Row, Col, type TableProps, Modal, Input, Tag, Spin, DatePicker } from 'antd';
import { EditOutlined, DeleteOutlined, SaveOutlined, TeamOutlined, PlusOutlined, SearchOutlined, ShoppingCartOutlined, DollarOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { salesApi, customersApi, productsApi, type Sale, type SaleItem, type CreateSaleRequest, type UpdateSaleItem, type Customer, type Product } from '../api';
import dayjs from 'dayjs';

interface CreateSaleItemLocal {
  product_id: number;
  quantity: number;
  unit_price: number;
}

const { Title } = Typography;
const { Option } = Select;

export const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [creating, setCreating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saleItems, setSaleItems] = useState<CreateSaleItemLocal[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [loadingSaleDetails, setLoadingSaleDetails] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [stockErrorModal, setStockErrorModal] = useState<{ visible: boolean; productName: string }>({ visible: false, productName: '' });
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editSaleItems, setEditSaleItems] = useState<UpdateSaleItem[]>([]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params: any = {};
      
      // If date is selected, use only date
      if (selectedDate) {
        params.date = selectedDate;
      }
      
      console.log('Fetching sales with params:', params);
      const data = await salesApi.getAll(params);
      setSales(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error('Требуется авторизация');
      } else {
        message.error('Ошибка при загрузке продаж');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await customersApi.getAll();
      setCustomers(data);
    } catch (error: unknown) {
      message.error('Ошибка при загрузке клиентов');
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await productsApi.getAll();
      setProducts(data);
    } catch (error: unknown) {
      message.error('Ошибка при загрузке товаров');
    }
  };

  useEffect(() => {
    fetchSales();
    fetchCustomers();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [selectedDate]);

  useEffect(() => {
    if (selectedSale && detailModalVisible && !selectedSale.items) {
      loadSaleDetails(selectedSale.id);
    }
  }, [selectedSale, detailModalVisible]);

  const loadSaleDetails = async (id: number) => {
    setLoadingSaleDetails(true);
    try {
      const detailedSale = await salesApi.getById(id);
      setSelectedSale(detailedSale);
    } catch (error: unknown) {
      message.error('Ошибка при загрузке деталей продажи');
    } finally {
      setLoadingSaleDetails(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    // Note: Search is done on client side as API doesn't support search
  };

  const handleDelete = async (id: number) => {
    try {
      await salesApi.delete(id);
      message.success('Продажа удалена');
      fetchSales();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 404) {
        message.error('Продажа не найдена');
      } else {
        message.error('Ошибка при удалении продажи');
      }
    }
  };

  const handleCreate = async (values: any) => {
    setCreating(true);
    try {
      if (saleItems.length === 0) {
        message.error('Добавьте хотя бы один товар');
        return;
      }

      // Validate each sale item
      for (const item of saleItems) {
        if (!item.product_id || item.product_id === 0) {
          message.error('Выберите товар для всех позиций');
          setCreating(false);
          return;
        }
        if (!item.quantity || item.quantity <= 0) {
          message.error('Укажите корректное количество для всех позиций');
          setCreating(false);
          return;
        }
        if (!item.unit_price || item.unit_price <= 0) {
          message.error('Укажите корректную цену для всех позиций');
          setCreating(false);
          return;
        }
      }

      const createData: CreateSaleRequest = {
        customer_id: values.customer_id,
        payment_status: values.payment_status,
        items: saleItems,
      };

      console.log('Creating sale with data:', createData);
      await salesApi.create(createData);
      message.success('Продажа создана успешно');
      form.resetFields();
      setSaleItems([]);
      setActiveTab('list');
      fetchSales();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string; error?: string } }; message?: string };
      console.log('Server error response:', axiosError.response);
      console.log('Error message:', axiosError.response?.data?.message);
      console.log('Error data:', axiosError.response?.data);
      if (axiosError.response?.status === 400) {
        const errorMessage = axiosError.response.data?.message || axiosError.response.data?.error || 'Проверьте обязательные поля';
        console.log('Final error message:', errorMessage);
        
        // Handle specific stock error - check multiple possible formats
        if (errorMessage.includes('Insufficient stock') || errorMessage.includes('insufficient stock') || errorMessage.includes('недостаточно')) {
          let productId = null;
          
          // Try different regex patterns
          const match1 = errorMessage.match(/product (\d+)/);
          const match2 = errorMessage.match(/товара? (\d+)/);
          const match3 = errorMessage.match(/(\d+)/);
          
          if (match1) productId = match1[1];
          else if (match2) productId = match2[1];
          else if (match3) productId = match3[1];
          
          if (productId) {
            const product = products.find(p => p.id === parseInt(productId));
            const productName = product?.name || `товар #${productId}`;
            setStockErrorModal({ visible: true, productName });
          } else {
            setStockErrorModal({ visible: true, productName: 'товара' });
          }
        } else {
          message.error(errorMessage);
        }
      } else if (axiosError.message?.includes('Network Error')) {
        message.error('Сервер недоступен. Проверьте подключение.');
      } else {
        message.error('Ошибка при создании продажи');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (sale: Sale) => {
    setEditingSale(sale);
    setEditModalVisible(true);
    form.setFieldsValue({
      customer_id: sale.customer_id,
      payment_status: sale.payment_status,
    });
    
    // Load sale details to get items
    setLoadingSaleDetails(true);
    try {
      const saleDetails = await salesApi.getById(sale.id);
      if (saleDetails.items) {
        const items: UpdateSaleItem[] = saleDetails.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }));
        setEditSaleItems(items);
      }
    } catch (error) {
      message.error('Ошибка при загрузке деталей продажи');
    } finally {
      setLoadingSaleDetails(false);
    }
  };

  const handleUpdate = async (values: any) => {
    if (!editingSale) return;
    
    if (editSaleItems.length === 0) {
      message.error('Добавьте хотя бы один товар');
      return;
    }

    // Validate items
    for (const item of editSaleItems) {
      if (!item.product_id || item.product_id === 0) {
        message.error('Выберите товар для всех позиций');
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        message.error('Укажите корректное количество для всех позиций');
        return;
      }
      if (!item.unit_price || item.unit_price <= 0) {
        message.error('Укажите корректную цену для всех позиций');
        return;
      }
    }

    setEditing(true);
    try {
      const updateData = {
        customer_id: values.customer_id,
        payment_status: values.payment_status,
        items: editSaleItems,
      };

      await salesApi.update(editingSale.id, updateData);
      message.success('Продажа успешно обновлена');
      setEditModalVisible(false);
      setEditingSale(null);
      setEditSaleItems([]);
      form.resetFields();
      fetchSales();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string; productName?: string } }; message?: string };
      if (axiosError.response?.status === 400) {
        const errorMessage = axiosError.response.data?.message || 'Ошибка при обновлении продажи';
        if (axiosError.response.data?.productName) {
          setStockErrorModal({
            visible: true,
            productName: axiosError.response.data.productName,
          });
        } else {
          message.error(errorMessage);
        }
      } else if (axiosError.message?.includes('Network Error')) {
        message.error('Сервер недоступен. Проверьте подключение.');
      } else {
        message.error('Ошибка при обновлении продажи');
      }
    } finally {
      setEditing(false);
    }
  };

  const addSaleItem = () => {
    const newItem: CreateSaleItemLocal = {
      product_id: 0,
      quantity: 1,
      unit_price: 0,
    };
    setSaleItems([...saleItems, newItem]);
  };

  const updateSaleItem = (index: number, field: keyof CreateSaleItemLocal, value: any) => {
    const updatedItems = [...saleItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setSaleItems(updatedItems);
  };

  const removeSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const columns: TableProps<Sale>['columns'] = [
    {
      title: '№',
      key: 'rowNumber',
      width: 60,
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: 'Дата',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Клиент',
      dataIndex: 'customer_name',
      key: 'customer_name',
      ellipsis: true,
    },
    {
      title: 'Общая сумма',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => (
        <span style={{ color: '#52c41a' }}>
          <DollarOutlined style={{ marginRight: 4 }} />
          {amount.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Статус оплаты',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status: string) => (
        <Tag color={status === 'PAID' ? 'green' : 'orange'}>
          {status === 'PAID' ? 'Оплачено' : 'Долг'}
        </Tag>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Sale) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record);
            }}
            size="small"
            title="Редактировать"
          />
          <Popconfirm
            title="Удалить продажу?"
            description="Это действие нельзя отменить, товары вернутся на склад"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button danger icon={<DeleteOutlined />} size="small" title="Удалить" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const itemColumns: TableProps<SaleItem>['columns'] = [
    {
      title: 'Товар',
      dataIndex: 'product_name',
      key: 'product_name',
      ellipsis: true,
    },
    {
      title: 'Код',
      dataIndex: 'product_code',
      key: 'product_code',
      width: 100,
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: 'Цена за ед.',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: number) => price.toLocaleString(),
      width: 100,
    },
    {
      title: 'Итого',
      key: 'total',
      render: (_, record: SaleItem) => (
        <strong>{(record.quantity * record.unit_price).toLocaleString()}</strong>
      ),
      width: 100,
    },
  ];

  const tabItems = [
    {
      key: 'list',
      label: (
        <span>
          <TeamOutlined />
          Список продаж
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Поиск продаж..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Фильтр по клиенту"
                value={undefined}
                onChange={() => {}}
                allowClear
                style={{ width: '100%' }}
              >
                {customers.map(customer => (
                  <Option key={customer.id} value={customer.id}>
                    {customer.full_name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <DatePicker
                placeholder="Фильтр по дате"
                value={selectedDate ? dayjs(selectedDate) : null}
                onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : '')}
                style={{ width: '100%' }}
                allowClear
              />
            </Col>
          </Row>
          <Table
            columns={columns}
            dataSource={sales.filter(sale => 
              sale.customer_name.toLowerCase().includes(searchText.toLowerCase()) ||
              sale.id.toString().includes(searchText)
            )}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            size="small"
            onRow={(record) => ({
              onClick: () => {
                setSelectedSale(record);
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
          Создать
        </span>
      ),
      children: (
        <Row justify="center">
          <Col xs={24} sm={24} md={20} lg={16} xl={12}>
            <Card>
              <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
                <ShoppingCartOutlined /> Новая продажа
              </Title>
              <Form
                form={form}
                name="createSale"
                onFinish={handleCreate}
                autoComplete="off"
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="customer_id"
                  label="Клиент"
                  rules={[{ required: true, message: 'Выберите клиента' }]}
                >
                  <Select placeholder="Выберите клиента" prefix={<UserOutlined />}>
                    {customers.map(customer => (
                      <Option key={customer.id} value={customer.id}>
                        {customer.full_name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="payment_status"
                  label="Статус оплаты"
                  rules={[{ required: true, message: 'Выберите статус оплаты' }]}
                >
                  <Select placeholder="Выберите статус оплаты">
                    <Option value="PAID">Оплачено</Option>
                    <Option value="DEBT">Долг</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Позиции">
                  <div style={{ marginBottom: 16 }}>
                    <Button
                      type="dashed"
                      onClick={addSaleItem}
                      icon={<PlusOutlined />}
                      block
                    >
                      Добавить позицию
                    </Button>
                  </div>
                  
                  {saleItems.map((item, index) => (
                    <Card
                      key={index}
                      size="small"
                      style={{ marginBottom: 16 }}
                      title={`Позиция ${index + 1}`}
                      extra={
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeSaleItem(index)}
                        />
                      }
                    >
                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Товар"
                            required
                          >
                            <Select
                              placeholder="Выберите товар"
                              value={item.product_id || undefined}
                              onChange={(value) => updateSaleItem(index, 'product_id', value)}
                              showSearch
                              filterOption={(input, option) =>
                            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                          }
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
                        <Col xs={12} sm={6}>
                          <Form.Item
                            label="Количество"
                            required
                          >
                            <InputNumber
                              placeholder="Кол-во"
                              min={1}
                              value={item.quantity}
                              onChange={(value) => updateSaleItem(index, 'quantity', value || 1)}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                          <Form.Item
                            label="Цена за ед."
                            required
                          >
                            <InputNumber
                              placeholder="Цена"
                              min={0}
                              step={0.01}
                              value={item.unit_price || undefined}
                              onChange={(value) => updateSaleItem(index, 'unit_price', value || 0)}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
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
                    Создать продажу
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
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>Продажи</Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <Modal
        title={`Продажа #${selectedSale?.id} - Детали`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedSale && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Tag color="blue" icon={<CalendarOutlined />}>
                  {new Date(selectedSale.created_at).toLocaleDateString()}
                </Tag>
              </Col>
              <Col span={6}>
                <Tag color="green" icon={<UserOutlined />}>
                  {selectedSale.customer_name}
                </Tag>
              </Col>
              <Col span={6}>
                <Tag color="orange" icon={<DollarOutlined />}>
                  Сумма: {selectedSale.total_amount.toLocaleString()}
                </Tag>
              </Col>
              <Col span={6}>
                <Tag color={selectedSale.payment_status === 'PAID' ? 'green' : 'orange'}>
                  {selectedSale.payment_status === 'PAID' ? 'Оплачено' : 'Долг'}
                </Tag>
              </Col>
            </Row>
            
            {loadingSaleDetails ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin size="large" />
                <div style={{ marginTop: 8 }}>Загрузка позиций...</div>
              </div>
            ) : (
              <Table
                columns={itemColumns}
                dataSource={selectedSale.items || []}
                rowKey="id"
                pagination={false}
                scroll={{ x: 'max-content' }}
                size="small"
              />
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="Недостаточно товара на складе"
        open={stockErrorModal.visible}
        onCancel={() => setStockErrorModal({ visible: false, productName: '' })}
        footer={[
          <Button key="ok" type="primary" onClick={() => setStockErrorModal({ visible: false, productName: '' })}>
            Понятно
          </Button>
        ]}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 16, marginBottom: 16 }}>
            <span style={{ color: '#ff4d4f', fontSize: 24 }}>⚠️</span>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.5 }}>
            Недостаточно товара <strong>"{stockErrorModal.productName}"</strong> на складе.
          </p>
          <p style={{ fontSize: 14, color: '#666', marginTop: 12 }}>
            Пожалуйста, проверьте остатки или пополните склад через приходы.
          </p>
        </div>
      </Modal>

      <Modal
        title="Редактировать продажу"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingSale(null);
          setEditSaleItems([]);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setEditModalVisible(false);
            setEditingSale(null);
            setEditSaleItems([]);
            form.resetFields();
          }}>
            Отмена
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()} loading={editing}>
            Обновить
          </Button>,
        ]}
        width={800}
      >
        <Spin spinning={loadingSaleDetails}>
          <Form
            form={form}
            name="editSale"
            onFinish={handleUpdate}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              label="Клиент"
              name="customer_id"
              rules={[{ required: true, message: 'Выберите клиента' }]}
            >
              <Select placeholder="Выберите клиента" prefix={<UserOutlined />}>
                {customers.map(customer => (
                  <Option key={customer.id} value={customer.id}>
                    {customer.full_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Статус оплаты"
              name="payment_status"
              rules={[{ required: true, message: 'Выберите статус оплаты' }]}
            >
              <Select placeholder="Выберите статус">
                <Option value="PAID">Оплачено</Option>
                <Option value="DEBT">В долг</Option>
              </Select>
            </Form.Item>

            <div style={{ marginBottom: 16 }}>
              <Title level={5}>Товары</Title>
              {editSaleItems.map((item, index) => (
                <Row key={index} gutter={[8, 8]} style={{ marginBottom: 8 }} align="middle">
                  <Col flex="auto">
                    <Select
                      placeholder="Выберите товар"
                      value={item.product_id || undefined}
                      onChange={(value) => {
                        const newItems = [...editSaleItems];
                        newItems[index] = {
                          ...newItems[index],
                          product_id: value,
                        };
                        setEditSaleItems(newItems);
                      }}
                      style={{ width: '100%' }}
                    >
                      {products.map(product => (
                        <Option key={product.id} value={product.id}>
                          {product.name} (Остаток: {product.stock_quantity})
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col flex="100px">
                    <InputNumber
                      placeholder="Кол-во"
                      min={1}
                      value={item.quantity}
                      onChange={(value) => {
                        const newItems = [...editSaleItems];
                        newItems[index] = { ...newItems[index], quantity: value || 1 };
                        setEditSaleItems(newItems);
                      }}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col flex="120px">
                    <InputNumber
                      placeholder="Цена"
                      min={0.01}
                      step={0.01}
                      value={item.unit_price}
                      onChange={(value) => {
                        const newItems = [...editSaleItems];
                        newItems[index] = { ...newItems[index], unit_price: value || 0 };
                        setEditSaleItems(newItems);
                      }}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col flex="40px">
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        setEditSaleItems(editSaleItems.filter((_, i) => i !== index));
                      }}
                    />
                  </Col>
                </Row>
              ))}
              <Button
                type="dashed"
                onClick={() => {
                  setEditSaleItems([...editSaleItems, { product_id: 0, quantity: 1, unit_price: 0 }]);
                }}
                icon={<PlusOutlined />}
                style={{ width: '100%', marginTop: 8 }}
              >
                Добавить товар
              </Button>
            </div>

            <div style={{ textAlign: 'right', fontSize: 18, fontWeight: 'bold' }}>
              Итого: {editSaleItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
            </div>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
};
