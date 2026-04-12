import { useEffect, useState } from 'react';
import { Table, Button, Typography, Card, message, Select, Input, DatePicker, Row, Col, type TableProps, Tag, Modal, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { supplierOperationsApi, stockReceiptsApi, type SupplierOperation, type SupplierOperationFilters, type StockReceipt } from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

export const SupplierOperations = () => {
  const [operations, setOperations] = useState<SupplierOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<SupplierOperationFilters>({ date: dayjs().format('YYYY-MM-DD') });
  const [selectedOperation, setSelectedOperation] = useState<SupplierOperation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState<StockReceipt | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  const fetchOperations = async () => {
    setLoading(true);
    try {
      const data = await supplierOperationsApi.getAll(filters);
      setOperations(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error('Требуется авторизация');
      } else {
        message.error('Ошибка загрузки операций поставщиков');
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


  const handleRowClick = async (record: SupplierOperation) => {
    setSelectedOperation(record);
    
    // If it's a receipt operation, fetch the receipt details with items
    if (record.type === 'RECEIPT' && record.receipt_id) {
      setLoadingReceipt(true);
      try {
        const receiptData = await stockReceiptsApi.getById(record.receipt_id);
        setReceiptDetails(receiptData);
      } catch (error: unknown) {
        message.error('Ошибка при загрузке деталей прихода');
        setReceiptDetails(null);
      } finally {
        setLoadingReceipt(false);
      }
    } else {
      setReceiptDetails(null);
    }
    
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedOperation(null);
    setReceiptDetails(null);
  };

  const getOperationTypeColor = (type: string) => {
    switch (type) {
      case 'RECEIPT': return 'green';
      case 'PAYMENT': return 'blue';
      default: return 'default';
    }
  };

  const getOperationTypeText = (type: string) => {
    switch (type) {
      case 'RECEIPT': return 'Приход';
      case 'PAYMENT': return 'Платёж';
      default: return type;
    }
  };

  const columns: TableProps<SupplierOperation>['columns'] = [
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
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
      responsive: ['sm'] as ('md' | 'xxxl' | 'xxl' | 'xl' | 'lg' | 'sm' | 'xs')[],
    },
    {
      title: 'Поставщик',
      dataIndex: 'supplier_name',
      key: 'supplier_name',
      ellipsis: true,
      responsive: ['sm'] as ('md' | 'xxxl' | 'xxl' | 'xl' | 'lg' | 'sm' | 'xs')[],
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
      responsive: ['sm'] as ('md' | 'xxxl' | 'xxl' | 'xl' | 'lg' | 'sm' | 'xs')[],
    },
    {
      title: 'Сумма',
      dataIndex: 'sum',
      key: 'sum',
      render: (sum: number) => (
        <span style={{ color: '#52c41a' }}>
          {sum.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
        </span>
      ),
      responsive: ['sm'] as ('md' | 'xxxl' | 'xxl' | 'xl' | 'lg' | 'sm' | 'xs')[],
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>Операции поставщиков</Title>
      
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Поиск по имени поставщика..."
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
              <Option value="RECEIPT">Приход</Option>
              <Option value="PAYMENT">Платёж</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={operations.filter(operation => 
          operation.supplier_name.toLowerCase().includes(searchText.toLowerCase()) ||
          operation.id.toString().includes(searchText) ||
          operation.supplier_id.toString().includes(searchText)
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
        {selectedOperation && selectedOperation.type === 'RECEIPT' ? (
          <div>
            {loadingReceipt ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin size="large" />
              </div>
            ) : receiptDetails?.items && receiptDetails.items.length > 0 ? (
              <Table
                dataSource={receiptDetails.items}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ y: 400 }}
                columns={[
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
                    title: 'Кол-во',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 80,
                    align: 'right',
                  },
                  {
                    title: 'Закупка',
                    dataIndex: 'purchase_cost',
                    key: 'purchase_cost',
                    width: 100,
                    align: 'right',
                    render: (cost: number) => cost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }),
                  },
                  {
                    title: 'Продажа',
                    dataIndex: 'selling_price',
                    key: 'selling_price',
                    width: 100,
                    align: 'right',
                    render: (price: number) => price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }),
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
