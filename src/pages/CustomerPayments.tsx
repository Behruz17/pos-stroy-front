import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Card, message, Popconfirm, Form, Select, InputNumber, Row, Col, type TableProps, Modal, Input, Tag } from 'antd';
import { DeleteOutlined, PlusOutlined, SearchOutlined, DollarOutlined, UserOutlined } from '@ant-design/icons';
import { customerPaymentsApi, customersApi, type CustomerPayment, type CreateCustomerPaymentRequest, type Customer } from '../api';

const { Title } = Typography;
const { Option } = Select;

export const CustomerPayments = () => {
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState<Customer[]>([]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await customerPaymentsApi.getAll();
      setPayments(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error('Требуется авторизация');
      } else {
        message.error('Ошибка загрузки оплат');
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

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
  }, []);

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleDelete = async (id: number) => {
    try {
      await customerPaymentsApi.delete(id);
      message.success('Оплата успешно удалена');
      fetchPayments();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } } };
      if (axiosError.response?.status === 404) {
        message.error(axiosError.response.data?.message || 'Оплата не найдена');
      } else if (axiosError.response?.status === 400) {
        message.error(axiosError.response.data?.message || 'Нельзя удалить эту оплату');
      } else {
        message.error('Ошибка удаления оплаты');
      }
    }
  };

  const handleCreate = async (values: any) => {
    setCreating(true);
    try {
      const createData: CreateCustomerPaymentRequest = {
        customer_id: values.customer_id,
        sum: values.sum,
      };

      await customerPaymentsApi.create(createData);
      message.success('Оплата успешно создана');
      setModalVisible(false);
      form.resetFields();
      fetchPayments();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string; error?: string } }; message?: string };
      
      if (axiosError.response?.status === 400) {
        const errorMessage = axiosError.response.data?.message || axiosError.response.data?.error || 'Проверьте обязательные поля';
        message.error(errorMessage);
      } else if (axiosError.message?.includes('Network Error')) {
        message.error('Сервер недоступен. Проверьте подключение.');
      } else {
        message.error('Ошибка создания оплаты');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCreateModal = () => {
    setModalVisible(true);
    form.resetFields();
  };

  const columns: TableProps<CustomerPayment>['columns'] = [
    {
      title: '№',
      key: 'rowNumber',
      width: 60,
      responsive: ['md'] as ('md' | 'xxxl' | 'xxl' | 'xl' | 'lg' | 'sm' | 'xs')[],
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
      responsive: ['sm'] as ('md' | 'xxxl' | 'xxl' | 'xl' | 'lg' | 'sm' | 'xs')[],
    },
    {
      title: 'Клиент',
      dataIndex: 'customer_name',
      key: 'customer_name',
      ellipsis: true,
    },
    {
      title: 'Сумма',
      dataIndex: 'sum',
      key: 'sum',
      render: (amount: number) => (
        <span style={{ color: '#52c41a' }}>
          <DollarOutlined style={{ marginRight: 4 }} />
          {amount.toLocaleString()}
        </span>
      ),
      responsive: ['sm'] as ('md' | 'xxxl' | 'xxl' | 'xl' | 'lg' | 'sm' | 'xs')[],
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color="blue">{type}</Tag>
      ),
      width: 100,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: CustomerPayment) => (
        <Space size="small">
          <Popconfirm
            title="Удалить оплату?"
            description="Это действие нельзя отменить, баланс клиента будет восстановлен"
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

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>Оплаты клиентов</Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={16}>
            <Input
              placeholder="Поиск оплат..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateModal}
              style={{ width: '100%' }}
            >
              Добавить оплату
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={payments.filter(payment => 
          payment.customer_name.toLowerCase().includes(searchText.toLowerCase()) ||
          payment.id.toString().includes(searchText)
        )}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
        size="small"
      />

      <Modal
        title="Добавить оплату клиента"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setModalVisible(false);
            form.resetFields();
          }}>
            Отмена
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()} loading={creating}>
            Создать
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
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
            label="Сумма"
            name="sum"
            rules={[
              { required: true, message: 'Введите сумму' },
              { type: 'number', min: 0.01, message: 'Сумма должна быть больше 0' }
            ]}
          >
            <InputNumber
              placeholder="Сумма"
              min={0.01}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
              prefix={<DollarOutlined />}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
