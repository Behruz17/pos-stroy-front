import { useEffect, useState } from 'react'
import { Form, Button, Typography, Card, message, Select, InputNumber, Row, Col } from 'antd'
import { SaveOutlined, ShoppingCartOutlined, UserOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { salesApi, customersApi, productsApi, type Sale, type Customer, type Product, type UpdateSaleItem } from '../api'
import dayjs from 'dayjs'

const { Title } = Typography;
const { Option } = Select;

export const SaleEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form] = Form.useForm();
  const [saleItems, setSaleItems] = useState<UpdateSaleItem[]>([]);

  const fetchSale = async () => {
    setLoading(true);
    try {
      const data = await salesApi.getById(parseInt(id));
      setSale(data);
      
      // Transform sale items to update format
      const items = data.items?.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      })) || [];
      
      setSaleItems(items);
      
      form.setFieldsValue({
        customer_id: data.customer_id,
        payment_status: data.payment_status,
        created_at: dayjs(data.created_at)
      });
    } catch (error: unknown) {
      message.error('Ошибка при загрузке продажи');
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
    fetchSale();
    fetchCustomers();
    fetchProducts();
  }, [id]);

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      if (saleItems.length === 0) {
        message.error('Добавьте хотя бы один товар');
        return;
      }

      // Validate each sale item
      for (const item of saleItems) {
        if (!item.product_id || item.product_id === 0) {
          message.error('Выберите товар для всех позиций');
          setSaving(false);
          return;
        }
        if (!item.quantity || item.quantity <= 0) {
          message.error('Укажите корректное количество для всех позиций');
          setSaving(false);
          return;
        }
        if (!item.unit_price || item.unit_price <= 0) {
          message.error('Укажите корректную цену для всех позиций');
          setSaving(false);
          return;
        }
      }

      const updateData = {
        customer_id: values.customer_id,
        payment_status: values.payment_status,
        items: saleItems
      };

      console.log('Updating sale with data:', updateData);
      await salesApi.update(parseInt(id), updateData);
      message.success('Продажа обновлена успешно');
      navigate('/sales');
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string; error?: string } }; message?: string };
      console.log('Server error response:', axiosError.response);
      
      if (axiosError.response?.status === 400) {
        const errorMessage = axiosError.response.data?.message || axiosError.response.data?.error || 'Проверьте обязательные поля';
        message.error(errorMessage);
      } else if (axiosError.response?.status === 404) {
        message.error('Продажа не найдена');
      } else if (axiosError.message?.includes('Network Error')) {
        message.error('Сервер недоступен. Проверьте подключение.');
      } else {
        message.error('Ошибка при обновлении продажи');
      }
    } finally {
      setSaving(false);
    }
  };

  const addSaleItem = () => {
    const newItem: UpdateSaleItem = {
      product_id: 0,
      quantity: 1,
      unit_price: 1,
    };
    setSaleItems([...saleItems, newItem]);
  };

  const updateSaleItem = (index: number, field: keyof UpdateSaleItem, value: any) => {
    const updatedItems = [...saleItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setSaleItems(updatedItems);
  };

  const removeSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Загрузка...</div>;
  }

  if (!sale) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Продажа не найдена</div>;
  }

  return (
    <Row justify="center">
      <Col xs={24} sm={24} md={20} lg={16} xl={12}>
        <Card>
          <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
            <ShoppingCartOutlined /> Редактирование продажи #{sale.id}
          </Title>
          <Form
            form={form}
            name="editSale"
            onFinish={handleSave}
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
                          onChange={(value) => updateSaleItem(index, 'unit_price', value || 1)}
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
                loading={saving}
                icon={<SaveOutlined />}
                block
                size="large"
              >
                Сохранить изменения
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};
