import { useEffect, useState } from 'react';
import { Table, Button, Typography, Card, message, Select, Input, DatePicker, Row, Col, type TableProps, Tag, Modal, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { customerOperationsApi, salesApi, type CustomerOperation, type CustomerOperationFilters, type Sale } from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

export const CustomerOperations = () => {
  const [operations, setOperations] = useState<CustomerOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<CustomerOperationFilters>({ date: dayjs().format('YYYY-MM-DD') });
  const [selectedOperation, setSelectedOperation] = useState<CustomerOperation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [saleDetails, setSaleDetails] = useState<Sale | null>(null);
  const [loadingSale, setLoadingSale] = useState(false);

  const fetchOperations = async () => {
    setLoading(true);
    try {
      const data = await customerOperationsApi.getAll(filters);
      setOperations(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error('Требуется авторизация');
      } else {
        message.error('Ошибка загрузки операций клиентов');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
  }, [filters]);

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters };
    
    if (key === 'date') {
      newFilters.date = value ? value.format('YYYY-MM-DD') : undefined;
    } else if (key === 'type') {
      newFilters.type = value || undefined;
    }
    
    setFilters(newFilters);
  };

  
  const handleRowClick = async (record: CustomerOperation) => {
    setSelectedOperation(record);
    
    // If it's a DEBT, PAID, or PARTIAL operation with sale_id, fetch the sale details with items
    if ((record.type === 'DEBT' || record.type === 'PAID' || record.type === 'PARTIAL') && record.sale_id) {
      setLoadingSale(true);
      try {
        const saleData = await salesApi.getById(record.sale_id);
        setSaleDetails(saleData);
      } catch (error: unknown) {
        message.error('Ошибка при загрузке деталей продажи');
        setSaleDetails(null);
      } finally {
        setLoadingSale(false);
      }
    } else {
      setSaleDetails(null);
    }
    
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedOperation(null);
    setSaleDetails(null);
  };

  const getOperationTypeColor = (type: string) => {
    switch (type) {
      case 'DEBT': return 'red';
      case 'PAID': return 'green';
      case 'PARTIAL': return 'blue';
      case 'PAYMENT': return 'cyan';
      case 'RETURN': return 'orange';
      default: return 'default';
    }
  };

  const getOperationTypeText = (type: string) => {
    switch (type) {
      case 'DEBT': return 'Долг';
      case 'PAID': return 'Оплачено';
      case 'PARTIAL': return 'Частично';
      case 'PAYMENT': return 'Платёж';
      case 'RETURN': return 'Возврат';
      default: return type;
    }
  };

  const columns: TableProps<CustomerOperation>['columns'] = [
    {
      title: '№',
      key: 'rowNumber',
      width: 60,
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Клиент',
      dataIndex: 'customer_name',
      key: 'customer_name',
      ellipsis: true,
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getOperationTypeColor(type)}>
          {getOperationTypeText(type)}
        </Tag>
      ),
    },
    {
      title: 'Сумма',
      dataIndex: 'sum',
      key: 'sum',
      render: (sum: number, record: CustomerOperation) => (
        <span style={{ color: record.type === 'DEBT' ? '#ff4d4f' : '#52c41a' }}>
          {sum.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
        </span>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>Операции клиентов</Title>
      
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Поиск по имени клиента..."
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <DatePicker
              placeholder="Фильтр по дате"
              value={filters.date ? dayjs(filters.date) : null}
              onChange={(date) => handleFilterChange('date', date)}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Тип операции"
              value={filters.type}
              onChange={(value) => handleFilterChange('type', value)}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="DEBT">Долг</Option>
              <Option value="PAID">Оплачено</Option>
              <Option value="PARTIAL">Частично</Option>
              <Option value="PAYMENT">Платёж</Option>
              <Option value="RETURN">Возврат</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={operations.filter(operation => 
          operation.customer_name.toLowerCase().includes(searchText.toLowerCase()) ||
          operation.id.toString().includes(searchText) ||
          operation.customer_id.toString().includes(searchText)
        )}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
        size="small"
        onRow={(record) => ({
          style: { cursor: 'pointer' },
          onClick: () => handleRowClick(record),
        })}
      />
      
      <Modal
        title="Товары"
        open={modalVisible}
        onCancel={handleCloseModal}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            Закрыть
          </Button>,
        ]}
        width={600}
      >
        {selectedOperation && (selectedOperation.type === 'DEBT' || selectedOperation.type === 'PAID' || selectedOperation.type === 'PARTIAL') ? (
          <div>
            {loadingSale ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin size="large" />
              </div>
            ) : saleDetails?.items && saleDetails.items.length > 0 ? (
              <Table
                dataSource={saleDetails.items}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ x: 'max-content', y: 400 }}
                columns={[
                  {
                    title: 'Товар',
                    dataIndex: 'product_name',
                    key: 'product_name',
                    ellipsis: true,
                  },
                  {
                    title: 'ID',
                    dataIndex: 'product_id',
                    key: 'product_id',
                    width: 80,
                  },
                  {
                    title: 'Кол-во',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 80,
                    align: 'right',
                  },
                  {
                    title: 'Цена',
                    dataIndex: 'unit_price',
                    key: 'unit_price',
                    width: 100,
                    align: 'right',
                    render: (price: number) => price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }),
                  },
                  {
                    title: 'Сумма',
                    dataIndex: 'total_price',
                    key: 'total_price',
                    width: 100,
                    align: 'right',
                    render: (total: number) => total.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }),
                  },
                ]}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                Нет данных о товарах
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
            Для этой операции нет данных о товарах
          </div>
        )}
      </Modal>
    </div>
  );
};
