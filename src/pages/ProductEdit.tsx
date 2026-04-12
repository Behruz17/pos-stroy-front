import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Spin, Row, Col, Image, Upload } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, ShoppingOutlined, TeamOutlined, BarcodeOutlined, UploadOutlined } from '@ant-design/icons';
import { productsApi, type Product } from '../api';

const { Title } = Typography;


export const ProductEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await productsApi.getById(parseInt(id));
        setProduct(data);
        form.setFieldsValue({
          name: data.name,
          manufacturer: data.manufacturer,
          product_code: data.product_code,
          image: data.image,
        });
      } catch (error: unknown) {
        const axiosError = error as { response?: { status: number } };
        if (axiosError.response?.status === 404) {
          message.error('Товар не найден');
        } else {
          message.error('Ошибка при загрузке товара');
        }
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, form, navigate]);

  const onFinish = async (values: any) => {
    if (!id) return;

    setSaving(true);
    try {
      await productsApi.update(parseInt(id), values);
      message.success('Товар обновлен');
      setImagePreview(null);
      navigate('/products');
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } } };
      if (axiosError.response?.status === 404) {
        message.error('Товар не найден');
        navigate('/products');
      } else if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || 'Ошибка в данных');
      } else {
        message.error('Ошибка при обновлении товара');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/products')}
        style={{ marginBottom: 16 }}
      >
        Назад к списку
      </Button>

      <Row justify="center">
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          <Card>
            <Title level={3} style={{ textAlign: 'center', marginBottom: 24, marginTop: 0 }}>
              <ShoppingOutlined /> Редактирование товара #{id}
            </Title>

            <Form
              form={form}
              name="editProduct"
              onFinish={onFinish}
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
              {product?.image && !imagePreview && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <img
                    src={`http://localhost:3000${product.image}`}
                    alt="product"
                    style={{ maxWidth: 200, maxHeight: 200, objectFit: 'cover', borderRadius: 8 }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      // Hide the container div if image fails to load
                      const container = e.currentTarget.parentElement;
                      if (container) {
                        container.style.display = 'none';
                      }
                    }}
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
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>{imagePreview ? 'Изменить изображение' : 'Загрузить новое'}</div>
                  </div>
                </Upload>
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
                  Сохранить
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
