import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Card, message, Popconfirm, Tabs, Form, Select, InputNumber, Row, Col, type TableProps, Modal, Input, Tag, Spin, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { DeleteOutlined, SaveOutlined, TeamOutlined, PlusOutlined, SearchOutlined, DollarOutlined, CalendarOutlined, UserOutlined, RotateLeftOutlined } from '@ant-design/icons';
import { returnsApi, customersApi, productsApi, type Return, type ReturnItem, type CreateReturnRequest, type Customer, type Product } from '../api';

interface CreateReturnItemLocal {
  product_id: number;
  quantity: number;
  unit_price: number;
}

const { Title } = Typography;
const { Option } = Select;

export const Returns = () => {
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
        message.error('Требуется авторизация');
      } else {
        message.error('Ошибка загрузки возвратов');
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
      message.error('Ошибка загрузки клиентов');
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await productsApi.getAll();
      setProducts(data);
    } catch (error: unknown) {
      message.error('Ошибка загрузки товаров');
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
      message.error('Ошибка загрузки деталей возврата');
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
      message.success('Возврат успешно удален');
      fetchReturns();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 404) {
        message.error('Возврат не найден');
      } else {
        message.error('Ошибка удаления возврата');
      }
    }
  };

  const handleCreate = async (values: any) => {
    setCreating(true);
    try {
      if (returnItems.length === 0) {
        message.error('Добавьте хотя бы один товар');
        return;
      }

      // Validate each return item
      for (const item of returnItems) {
        if (!item.product_id || item.product_id === 0) {
          message.error('Выберите товар для всех позиций');
          setCreating(false);
          return;
        }
        if (!item.quantity || item.quantity <= 0) {
          message.error('Введите корректное количество для всех позиций');
          setCreating(false);
          return;
        }
        if (!item.unit_price || item.unit_price <= 0) {
          message.error('Введите корректную цену для всех позиций');
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
      message.success('Возврат успешно создан');
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
        message.error('Сервер недоступен. Проверьте подключение.');
      } else {
        message.error('Ошибка создания возврата');
      }
    } finally {
      setCreating(false);
    }
  };

  const addReturnItem = () => {
    const newItem: CreateReturnItemLocal = {
      product_id: 0,
      quantity: 1,
      unit_price: 1,
    };
    setReturnItems([...returnItems, newItem]);
  };

  const updateReturnItem = (index: number, field: keyof CreateReturnItemLocal, value: any) => {
    const updatedItems = [...returnItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setReturnItems(updatedItems);
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
      title: 'Действия',
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
            title="Просмотр деталей"
          />
          <Popconfirm
            title="Удалить возврат?"
            description="Это действие нельзя отменить, складские остатки будут уменьшены"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button danger icon={<DeleteOutlined />} size="small" title="Delete" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const itemColumns: TableProps<ReturnItem>['columns'] = [
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
      title: 'Цена за единицу',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: number) => price.toLocaleString(),
      width: 100,
    },
    {
      title: 'Сумма',
      key: 'total',
      render: (_, record: ReturnItem) => (
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
          Список возвратов
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Поиск возвратов..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
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
          Создать возврат
        </span>
      ),
      children: (
        <Row justify="center">
          <Col xs={24} sm={24} md={20} lg={16} xl={12}>
            <Card>
              <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
                <RotateLeftOutlined /> Новый возврат
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

                <Form.Item label="Positions">
                  <div style={{ marginBottom: 16 }}>
                    <Button
                      type="dashed"
                      onClick={addReturnItem}
                      icon={<PlusOutlined />}
                      block
                    >
                      Добавить позицию
                    </Button>
                  </div>
                  
                  {returnItems.map((item, index) => (
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
                          onClick={() => removeReturnItem(index)}
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
                              onChange={(value) => updateReturnItem(index, 'product_id', value)}
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
                                      На складе: {product.stock_quantity}
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
                              onChange={(value) => updateReturnItem(index, 'quantity', value || 1)}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                          <Form.Item
                            label="Цена за единицу"
                            required
                          >
                            <InputNumber
                              placeholder="Цена"
                              min={0}
                              step={0.01}
                              value={item.unit_price || undefined}
                              onChange={(value) => updateReturnItem(index, 'unit_price', value || 1)}
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
                    Создать возврат
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
                  Сумма: {selectedReturn.total_amount.toLocaleString()}
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
