import { useEffect, useState } from 'react';
import { Table, Button, Typography, Card, message, Tabs, Form, Select, InputNumber, Row, Col, type TableProps, Modal, Input, Tag, Spin, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { SaveOutlined, TeamOutlined, PlusOutlined, SearchOutlined, ShoppingCartOutlined, DollarOutlined, ShopOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { stockReceiptsApi, suppliersApi, productsApi, type StockReceipt, type StockReceiptItem, type CreateStockReceiptRequest, type Supplier, type Product } from '../api';

interface CreateStockReceiptItem {
  product_id: number;
  quantity: number;
  purchase_cost: number;
  selling_price: number;
}

const { Title } = Typography;
const { Option } = Select;

export const StockReceipts = () => {
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
        message.error('Requires authorization');
      } else {
        message.error('Error loading stock receipts');
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
      message.error('Ошибка при загрузке поставщиков');
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
      message.error('Ошибка при загрузке деталей прихода');
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
        message.error('Добавьте хотя бы один товар');
        return;
      }

      const createData: CreateStockReceiptRequest = {
        supplier_id: values.supplier_id,
        items: receiptItems,
      };

      await stockReceiptsApi.create(createData);
      message.success('Приход успешно создан');
      form.resetFields();
      setReceiptItems([]);
      setActiveTab('list');
      fetchStockReceipts();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } }; message?: string };
      if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || 'Проверьте обязательные поля');
      } else if (axiosError.message?.includes('Network Error')) {
        message.error('Сервер недоступен. Проверьте подключение.');
      } else {
        message.error('Ошибка при создании прихода');
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
    const updatedItems = [...receiptItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
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
      title: 'Дата',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Поставщик',
      dataIndex: 'supplier_name',
      key: 'supplier_name',
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
  ];

  const itemColumns: TableProps<StockReceiptItem>['columns'] = [
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
      title: 'Цена закупки',
      dataIndex: 'purchase_cost',
      key: 'purchase_cost',
      render: (cost: number) => cost.toLocaleString(),
      width: 100,
    },
    {
      title: 'Цена продажи',
      dataIndex: 'selling_price',
      key: 'selling_price',
      render: (price: number) => price.toLocaleString(),
      width: 100,
    },
    {
      title: 'Сумма',
      key: 'total',
      render: (_, record: StockReceiptItem) => (
        <strong>{(record.quantity * record.purchase_cost).toLocaleString()}</strong>
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
          Список приходов
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Поиск приходов..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Фильтр по поставщику"
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
                placeholder="Фильтр по дате"
                value={selectedDate ? dayjs(selectedDate) : null}
                onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : undefined)}
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
          Создать приход
        </span>
      ),
      children: (
        <Row justify="center">
          <Col xs={24} sm={24} md={20} lg={16} xl={12}>
            <Card>
              <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
                <ShoppingCartOutlined /> Новый приход
              </Title>
              <Form
                form={form}
                name="createStockReceipt"
                onFinish={handleCreate}
                autoComplete="off"
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="supplier_id"
                  label="Поставщик"
                  rules={[{ required: true, message: 'Выберите поставщика' }]}
                >
                  <Select placeholder="Выберите поставщика" prefix={<ShopOutlined />}>
                    {suppliers.map(supplier => (
                      <Option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label="Товары">
                  <div style={{ marginBottom: 16 }}>
                    <Button
                      type="dashed"
                      onClick={addReceiptItem}
                      icon={<PlusOutlined />}
                      block
                    >
                      Добавить товар
                    </Button>
                  </div>
                  
                  {receiptItems.map((item, index) => (
                    <Card
                      key={index}
                      size="small"
                      style={{ marginBottom: 16 }}
                      title={`Товар ${index + 1}`}
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
                            label="Товар"
                            required
                          >
                            <Select
                              placeholder="Выберите товар"
                              value={item.product_id || undefined}
                              onChange={(value) => updateReceiptItem(index, 'product_id', value)}
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
                              onChange={(value) => updateReceiptItem(index, 'quantity', value || 1)}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                          <Form.Item
                            label="Цена закупки"
                            required
                          >
                            <InputNumber
                              placeholder="Цена"
                              min={0}
                              step={0.01}
                              value={item.purchase_cost || undefined}
                              onChange={(value) => updateReceiptItem(index, 'purchase_cost', value || 0)}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Цена продажи"
                            required
                          >
                            <InputNumber
                              placeholder="Цена"
                              min={0}
                              step={0.01}
                              value={item.selling_price || undefined}
                              onChange={(value) => updateReceiptItem(index, 'selling_price', value || 0)}
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
                    Создать приход
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
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>Приходы</Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <Modal
        title={`Приход #${selectedReceipt?.id} - Детали`}
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
                  Сумма: {selectedReceipt.total_amount.toLocaleString()}
                </Tag>
              </Col>
            </Row>
            
            {loadingReceiptDetails ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin size="large" />
                <div style={{ marginTop: 8 }}>Загрузка товаров...</div>
              </div>
            ) : (
              <Table
                columns={itemColumns}
                dataSource={selectedReceipt.items || []}
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
