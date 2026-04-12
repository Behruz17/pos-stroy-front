import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Card, message, Popconfirm, Tabs, Form, Input, Row, Col, type TableProps, Image, Upload } from 'antd';
import { EditOutlined, DeleteOutlined, SaveOutlined, TeamOutlined, PlusOutlined, ShoppingOutlined, BarcodeOutlined, InboxOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { productsApi, type Product } from '../api';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [creating, setCreating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productsApi.getAll();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error('Требуется авторизация');
      } else {
        message.error('Ошибка при загрузке товаров');
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
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await productsApi.delete(id);
      message.success('Товар удален');
      fetchProducts();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 404) {
        message.error('Товар не найден');
      } else {
        message.error('Ошибка при удалении товара');
      }
    }
  };

  const handleCreate = async (values: any) => {
    setCreating(true);
    try {
      await productsApi.create(values);
      message.success('Товар успешно создан');
      form.resetFields();
      setImagePreview(null);
      setActiveTab('list');
      fetchProducts();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } }; message?: string };
      if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || 'Проверьте обязательные поля');
      } else if (axiosError.message?.includes('Network Error')) {
        message.error('Сервер недоступен. Проверьте подключение.');
      } else {
        message.error('Ошибка при создании товара');
      }
    } finally {
      setCreating(false);
    }
  };

  const columns: TableProps<Product>['columns'] = [
    {
      title: '№',
      key: 'rowNumber',
      width: 60,
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: 'Изображение',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (image: string | undefined) => (
        image ? (
          <Image
            src={`http://localhost:3000${image}`}
            alt="товар"
            style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
            preview={false}
          />
        ) : (
          <div style={{ width: 50, height: 50, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <InboxOutlined style={{ color: '#999' }} />
          </div>
        )
      ),
    },
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Код',
      dataIndex: 'product_code',
      key: 'product_code',
      render: (code: string | undefined) => code || '-',
    },
    {
      title: 'Остаток',
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
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Product) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/products/${record.id}/edit`)}
            size="small"
          />
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
          <Col xs={24} sm={20} md={16} lg={12} xl={8}>
            <Card>
              <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
                <ShoppingOutlined /> Новый товар
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
                  label="Наименование"
                  rules={[{ required: true, message: 'Введите наименование товара' }]}
                >
                  <Input placeholder="Например: Цемент М500" prefix={<ShoppingOutlined />} />
                </Form.Item>

                <Form.Item
                  name="manufacturer"
                  label="Производитель"
                >
                  <Input placeholder="Например: Таджикцемент" prefix={<TeamOutlined />} />
                </Form.Item>

                <Form.Item
                  name="product_code"
                  label="Код товара"
                >
                  <Input placeholder="Например: CEM-500-001" prefix={<BarcodeOutlined />} />
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
                  label="Изображение"
                >
                  <Upload
                    name="image"
                    listType="picture-card"
                    className="avatar-uploader"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/webp';
                      if (!isJpgOrPng) {
                        message.error('Можно загружать только JPEG, PNG, GIF или WEBP файлы!');
                        return false;
                      }
                      const isLt5M = file.size / 1024 / 1024 < 5;
                      if (!isLt5M) {
                        message.error('Изображение должно быть меньше 5MB!');
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
                        <div style={{ marginBottom: 8 }}>Изменить изображение</div>
                        <UploadOutlined />
                      </div>
                    ) : (
                      <div>
                        <UploadOutlined />
                        <div style={{ marginTop: 8 }}>Загрузить</div>
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
                    Создать товар
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
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>Товары</Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </div>
  );
};
