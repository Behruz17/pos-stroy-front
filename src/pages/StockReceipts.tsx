import { useEffect, useState } from 'react';
import { Table, Button, Typography, Card, message, Tabs, Form, Select, InputNumber, Row, Col, type TableProps, Modal, Input, Tag, Spin, DatePicker } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { SaveOutlined, TeamOutlined, PlusOutlined, SearchOutlined, ShoppingCartOutlined, DollarOutlined, ShopOutlined, DeleteOutlined, ClockCircleOutlined, SwapOutlined } from '@ant-design/icons';
import { stockReceiptsApi, suppliersApi, productsApi, type StockReceipt, type CreateStockReceiptRequest, type CreateStockReceiptItem, type Supplier, type Product, type StockReceiptItem } from '../api';

const { Title } = Typography;
const { Option } = Select;

export const StockReceipts = () => {
  const { t } = useTranslation();
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
  const [deliveryCost, setDeliveryCost] = useState<number | undefined>();
  const [formCurrency, setFormCurrency] = useState<string>('TJS');
  const [formRate, setFormRate] = useState<number>(1);
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
        message.error(t('errors.unauthorized'));
      } else {
        message.error(t('stockReceipts.errorLoading', { defaultValue: 'Ошибка при загрузке приходов' }));
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
      message.error(t('suppliers.errorLoading', { defaultValue: 'Ошибка при загрузке поставщиков' }));
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await productsApi.getAll();
      setProducts(data);
    } catch (error: unknown) {
      message.error(t('products.errorLoading'));
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
      message.error(t('stockReceipts.errorLoadingDetails', { defaultValue: 'Ошибка при загрузке деталей прихода' }));
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
        message.error(t('sales.addAtLeastOneItem', { defaultValue: 'Добавьте хотя бы один товар' }));
        return;
      }

      // Validate all items have product_id selected
      const invalidItems = receiptItems.filter(item => !item.product_id || item.product_id <= 0);
      if (invalidItems.length > 0) {
        message.error('Выберите товар для всех позиций');
        return;
      }

      // Validate calculation method for each item
      for (const item of receiptItems) {
        const hasTonnageCalculation = item.tonnage && item.price_per_ton;
        const hasDirectCost = item.purchase_cost && item.purchase_cost > 0;
        
        if (!hasTonnageCalculation && !hasDirectCost) {
          message.error('Для каждой позиции укажите либо (Тонна + Цена за тонну), либо Цену закупки');
          return;
        }
        
        if (!item.selling_price || item.selling_price <= 0) {
          message.error('Для каждой позиции укажите цену продажи');
          return;
        }
      }

      // Подготавливаем товары для отправки, удаляя ненужные поля
      const preparedItems = receiptItems.map(item => {
        const hasTonnageCalculation = item.tonnage && item.price_per_ton;
        
        if (hasTonnageCalculation) {
          // Расчет по тоннам - отправляем тонна и цена за тонну
          return {
            product_id: item.product_id,
            quantity: item.quantity,
            purchase_cost: item.purchase_cost,
            actual_cost: item.actual_cost,
            selling_price: item.selling_price,
            tonnage: item.tonnage,
            price_per_ton: item.price_per_ton,
            batch_code: item.batch_code
          };
        } else {
          // Прямая цена закупки - отправляем tonnage и price_per_ton как null
          return {
            product_id: item.product_id,
            quantity: item.quantity,
            purchase_cost: item.purchase_cost,
            actual_cost: item.actual_cost,
            selling_price: item.selling_price,
            tonnage: null,
            price_per_ton: null,
            batch_code: item.batch_code
          };
        }
      });

      console.log('Form values before create:', values);
      console.log('Delivery cost from form:', values.delivery_cost);
      console.log('Delivery cost from state:', deliveryCost);
      
      const createData: CreateStockReceiptRequest = {
        supplier_id: values.supplier_id,
        currency: values.currency,
        rate: values.currency !== 'TJS' ? values.rate : 1,
        delivery_cost: values.delivery_cost || undefined,
        items: preparedItems,
      };

      // Рассчитываем общую сумму для проверки
      const calculatedTotal = preparedItems.reduce((sum, item) => 
        sum + (item.purchase_cost * item.quantity), 0
      );
      console.log('Calculated total amount:', calculatedTotal);
      
      console.log('Creating stock receipt with data:', createData);
      console.log('Prepared items:', preparedItems);
      preparedItems.forEach((item, index) => {
        console.log(`Item ${index}:`, {
          product_id: item.product_id,
          quantity: item.quantity,
          purchase_cost: item.purchase_cost,
          selling_price: item.selling_price,
          tonnage: item.tonnage,
          price_per_ton: item.price_per_ton
        });
      });
      await stockReceiptsApi.create(createData);
      message.success(t('stockReceipts.receiptCreated', { defaultValue: 'Приход успешно создан' }));
      form.resetFields();
      setReceiptItems([]);
      setDeliveryCost(undefined);
      setFormCurrency('TJS');
      setFormRate(1);
      setActiveTab('list');
      fetchStockReceipts();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data?: { message?: string; errors?: any } }; message?: string };
      if (axiosError.response?.status === 400) {
        console.error('400 Error details:', axiosError.response.data);
        message.error(axiosError.response.data?.message || t('errors.required'));
      } else if (axiosError.message?.includes('Network Error')) {
        message.error(t('errors.networkError'));
      } else {
        message.error(t('stockReceipts.errorCreating', { defaultValue: 'Ошибка при создании прихода' }));
      }
    } finally {
      setCreating(false);
    }
  };

  const addReceiptItem = () => {
    const newItem: CreateStockReceiptItem = {
      product_id: 0,
      quantity: 0,
      purchase_cost: 0,
      actual_cost: 0,
      selling_price: 0,
    };
    setReceiptItems([...receiptItems, newItem]);
  };

  const updateReceiptItem = (index: number, field: keyof CreateStockReceiptItem, value: any) => {
    console.log(`Before update - item ${index}:`, receiptItems[index]);
    const updatedItems = [...receiptItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Автоматический расчет цен при использовании тоннажа и цены за тонну
    const item = updatedItems[index];
    if (item.tonnage && item.price_per_ton && item.quantity && 
        (field === 'tonnage' || field === 'price_per_ton' || field === 'quantity')) {
      // Расчет базовой цены: (tonnage × price_per_ton) / quantity
      const purchaseCost = (item.tonnage * item.price_per_ton) / item.quantity;
      
      // Расчет себестоимости с доставкой
      let actualCost = purchaseCost;
      
      // Добавляем долю доставки если она есть
      if (deliveryCost && deliveryCost > 0) {
        // Конвертируем доставку из TJS в валюту прихода
        const deliveryCostInCurrency = formCurrency === 'TJS' ? deliveryCost : deliveryCost / formRate;
        
        const totalQuantity = updatedItems.reduce((sum, item) => 
          item.quantity ? sum + item.quantity : sum, 0
        );
        
        if (totalQuantity > 0 && item.quantity) {
          const deliveryShare = (item.quantity / totalQuantity) * deliveryCostInCurrency;
          actualCost = purchaseCost + (deliveryShare / item.quantity);
        }
      }
      
      updatedItems[index] = { 
        ...item, 
        purchase_cost: purchaseCost,
        actual_cost: actualCost
      };
      console.log(`Calculated costs for item ${index}:`, { purchaseCost, actualCost });
    }
    
    // Если вводится прямая цена закупки, очищаем тоннаж и цену за тонну
    if (field === 'purchase_cost' && value && value > 0) {
      updatedItems[index] = { 
        ...item, 
        tonnage: undefined, 
        price_per_ton: undefined,
        actual_cost: value // Себестоимость равна цене закупки (без доставки)
      };
    }
    
    console.log(`After update - item ${index}:`, updatedItems[index]);
    setReceiptItems(updatedItems);
  };

  const removeReceiptItem = (index: number) => {
    setReceiptItems(receiptItems.filter((_, i) => i !== index));
  };

  // Функция для обработки потери фокуса поля цены закупки (без автоматического расчета доставки)
  const handlePurchaseCostBlur = (index: number, value: number) => {
    // Просто сохраняем введенную цену без добавления доставки
    console.log(`Purchase cost set manually for item ${index}:`, value);
  };

  // Функция для перерасчета цен закупки с учетом доставки
  const recalculatePurchaseCostsWithDelivery = (newDeliveryCost: number | undefined, overrideRate?: number) => {
    if (!newDeliveryCost || newDeliveryCost <= 0) {
      // Если доставки нет, пересчитываем только по тоннам
      const updatedItems = receiptItems.map(item => {
        if (item.tonnage && item.price_per_ton && item.quantity) {
          const calculatedCost = (item.tonnage * item.price_per_ton) / item.quantity;
          return { ...item, purchase_cost: calculatedCost };
        }
        return item;
      });
      setReceiptItems(updatedItems);
      return;
    }

    // Конвертируем доставку из TJS в валюту прихода
    const currentRate = overrideRate !== undefined ? overrideRate : formRate;
    const deliveryCostInCurrency = formCurrency === 'TJS' ? newDeliveryCost : newDeliveryCost / currentRate;
    console.log('Delivery cost conversion:', { 
      newDeliveryCost, 
      formCurrency, 
      formRate, 
      deliveryCostInCurrency 
    });

    // Распределяем доставку пропорционально между товарами
    const totalQuantity = receiptItems.reduce((sum, item) => 
      item.quantity ? sum + item.quantity : sum, 0
    );
    
    const updatedItems = receiptItems.map(item => {
      if (!item.quantity) return item;
      
      // Обрабатываем только товары с расчетом по тоннам
      if (item.tonnage && item.price_per_ton) {
        const purchaseCost = (item.tonnage * item.price_per_ton) / item.quantity;
        
        if (totalQuantity > 0) {
          // Доля доставки пропорционально метражу (quantity)
          const deliveryShare = (item.quantity / totalQuantity) * deliveryCostInCurrency;
          
          // Себестоимость с доставкой
          const actualCost = purchaseCost + (deliveryShare / item.quantity);
          
          return { 
            ...item, 
            purchase_cost: purchaseCost,
            actual_cost: actualCost
          };
        }
      }
      
      // Товары с прямой ценой закупки - добавляем доставку к actual_cost
      if (item.purchase_cost && !item.tonnage && !item.price_per_ton) {
        if (totalQuantity > 0) {
          // Доля доставки пропорционально метражу (quantity)
          const deliveryShare = (item.quantity / totalQuantity) * deliveryCostInCurrency;
          
          // Себестоимость с доставкой
          const actualCost = item.purchase_cost + (deliveryShare / item.quantity);
          
          return { 
            ...item, 
            actual_cost: actualCost
          };
        }
      }
      
      return item;
    });
    
    setReceiptItems(updatedItems);
  };

  
  const columns: TableProps<StockReceipt>['columns'] = [
    {
      title: '№',
      key: 'rowNumber',
      width: 60,
      render: (_: unknown, __: any, index: number) => index + 1,
    },
    {
      title: t('common.date'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: t('common.supplier'),
      dataIndex: 'supplier_name',
      key: 'supplier_name',
      ellipsis: true,
    },
    {
      title: t('common.totalAmount'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: string, record: StockReceipt) => (
        <span style={{ color: '#52c41a' }}>
          <DollarOutlined style={{ marginRight: 4 }} />
          {parseFloat(amount).toLocaleString()} {record.currency}
        </span>
      ),
    },
    {
      title: t('common.currency'),
      dataIndex: 'currency',
      key: 'currency',
      width: 80,
      render: (currency: string) => (
        <Tag color={currency === 'TJS' ? 'green' : currency === 'USD' ? 'blue' : 'orange'}>
          {currency}
        </Tag>
      ),
    },
  ];

  const getItemColumns = (currency: string): TableProps<StockReceiptItem>['columns'] => [
    {
      title: t('common.product'),
      dataIndex: 'product_name',
      key: 'product_name',
      ellipsis: true,
    },
    {
      title: 'Партия',
      dataIndex: 'batch_code',
      key: 'batch_code',
      width: 140,
      render: (code: string | null | undefined) => code || '-',
    },
    {
      title: t('common.id'),
      dataIndex: 'product_id',
      key: 'product_id',
      width: 80,
    },
    {
      title: t('common.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: t('stockReceipts.tonnage', { defaultValue: 'Тонна' }),
      dataIndex: 'tonnage',
      key: 'tonnage',
      width: 100,
      render: (tonnage: string | null | undefined) => tonnage ? parseFloat(tonnage).toFixed(3) : '-',
    },
    {
      title: t('stockReceipts.pricePerTon', { defaultValue: 'Цена/тонна' }),
      dataIndex: 'price_per_ton',
      key: 'price_per_ton',
      width: 120,
      render: (price: string | null | undefined) => price ? parseFloat(price).toLocaleString() : '-',
    },
    {
      title: t('suppliers.purchasePrice'),
      dataIndex: 'purchase_cost',
      key: 'purchase_cost',
      render: (cost: string) => parseFloat(cost).toLocaleString(),
      width: 100,
    },
    {
      title: t('stockReceipts.purchaseCostConverted', { defaultValue: 'Цена закупки (TJS)' }),
      dataIndex: 'purchase_cost_converted',
      key: 'purchase_cost_converted',
      render: (cost: string | null | undefined) => {
        if (!cost && cost !== '0') return '-';
        return (
          <span style={{ color: '#52c41a' }}>
            {parseFloat(cost).toLocaleString()} TJS
          </span>
        );
      },
      width: 120,
    },
    {
      title: t('stockReceipts.actualCost', { defaultValue: 'Себестоимость' }),
      dataIndex: 'actual_cost',
      key: 'actual_cost',
      render: (cost: string, record: StockReceiptItem) => {
        if (!cost) return '-';
        // Находим родительский приход для получения валюты
        const parentReceipt = stockReceipts.find(sr => sr.id === record.stock_receipt_id);
        const currency = parentReceipt?.currency || 'TJS';
        return (
          <span style={{ color: '#52c41a' }}>
            <DollarOutlined style={{ marginRight: 4 }} />
            {parseFloat(cost).toLocaleString()} {currency}
          </span>
        );
      },
      width: 100,
    },
    {
      title: t('suppliers.sellingPrice'),
      dataIndex: 'selling_price',
      key: 'selling_price',
      render: (price: string) => parseFloat(price).toLocaleString(),
      width: 100,
    },
    {
      title: t('common.amount'),
      key: 'total',
      render: (_, record: StockReceiptItem) => {
        const qty = record?.quantity || 0;
        const cost = parseFloat(record?.purchase_cost) || 0;
        return <strong>{(qty * cost).toLocaleString()} {currency || ''}</strong>;
      },
      width: 120,
    },
  ];

  const tabItems = [
    {
      key: 'list',
      label: (
        <span>
          <TeamOutlined />
          {t('stockReceipts.list')}
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder={t('stockReceipts.searchPlaceholder', { defaultValue: 'Поиск приходов...' })}
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder={t('stockReceipts.filterBySupplier', { defaultValue: 'Фильтр по поставщику' })}
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
                placeholder={t('common.filterByDate', { defaultValue: 'Фильтр по дате' })}
                value={selectedDate ? dayjs(selectedDate) : null}
                onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : '')}
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
            pagination={false}
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
          {t('stockReceipts.create')}
        </span>
      ),
      children: (
        <Row justify="center">
          <Col xs={24} sm={24} md={20} lg={16} xl={12}>
            <Card>
              <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
                <ShoppingCartOutlined /> {t('stockReceipts.newReceipt')}
              </Title>
              <Form
                form={form}
                name="createStockReceipt"
                onFinish={handleCreate}
                autoComplete="off"
                layout="vertical"
                size="large"
              >
                <Row gutter={16}>
                  <Col xs={24} sm={16}>
                    <Form.Item
                      name="supplier_id"
                      label={t('stockReceipts.supplier')}
                      rules={[{ required: true, message: t('stockReceipts.selectSupplier', { defaultValue: 'Выберите поставщика' }) }]}
                    >
                      <Select
                        placeholder={t('stockReceipts.selectSupplier', { defaultValue: 'Выберите поставщика' })}
                        prefix={<ShopOutlined />}
                        onChange={(value) => {
                          const supplier = suppliers.find(s => s.id === value);
                          if (supplier?.currency) {
                            form.setFieldValue('currency', supplier.currency);
                            form.setFieldValue('rate', undefined);
                            setFormCurrency(supplier.currency);
                            setFormRate(1);
                            // Пересчитываем цены с доставкой при смене поставщика (и валюты)
                            if (deliveryCost) {
                              recalculatePurchaseCostsWithDelivery(deliveryCost);
                            }
                          }
                        }}
                      >
                        {suppliers.map(supplier => (
                          <Option key={supplier.id} value={supplier.id}>
                            {supplier.name} ({supplier.currency})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name="currency"
                      label={t('common.currency')}
                      initialValue="TJS"
                    >
                      <Select disabled>
                        <Option value="TJS">TJS</Option>
                        <Option value="USD">USD</Option>
                        <Option value="RUB">RUB</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) =>
                    prevValues.currency !== currentValues.currency ||
                    prevValues.supplier_id !== currentValues.supplier_id
                  }
                >
                  {({ getFieldValue }) => {
                    const currency = getFieldValue('currency');
                    return currency !== 'TJS' ? (
                      <Form.Item
                        name="rate"
                        label={t('common.rate')}
                        rules={[{ required: true, message: t('errors.required') }]}
                      >
                        <InputNumber
                          min={0.001}
                          step={0.0001}
                          style={{ width: '100%' }}
                          prefix={<SwapOutlined />}
                          placeholder={t('stockReceipts.enterRate', { defaultValue: 'Введите курс к TJS' })}
                          parser={(value) => {
                            if (!value) return null as unknown as number;
                            return parseFloat(value.replace(',', '.')) || null as unknown as number;
                          }}
                          onChange={(value) => {
                            console.log('Rate changed:', value);
                            const newRate = value || 1;
                            setFormRate(newRate);
                            // Пересчитываем цены с доставкой при изменении курса
                            if (deliveryCost) {
                              console.log('Recalculating with delivery cost:', deliveryCost, 'new rate:', newRate);
                              recalculatePurchaseCostsWithDelivery(deliveryCost, newRate);
                            }
                          }}
                        />
                      </Form.Item>
                    ) : null;
                  }}
                </Form.Item>

                <Form.Item
                  name="delivery_cost"
                  label={t('stockReceipts.deliveryCost', { defaultValue: 'Стоимость доставки (TJS)' })}
                >
                  <InputNumber
                    min={0}
                    step={0.01}
                    precision={2}
                    style={{ width: '100%' }}
                    onChange={(value: number | string | null) => {
                      console.log('Delivery cost input changed:', value);
                      const numValue = value === null ? undefined : typeof value === 'number' ? value : parseFloat(String(value));
                      setDeliveryCost(numValue);
                      // Синхронизируем значение в форме
                      form.setFieldValue('delivery_cost', numValue);
                      recalculatePurchaseCostsWithDelivery(numValue);
                    }}
                    formatter={(value: number | string | undefined) => {
                      if (!value) return '';
                      const num = typeof value === 'number' ? value : parseFloat(String(value));
                      return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                    }}
                    parser={(value) => {
                      if (!value) return 0;
                      return parseFloat(value.replace(/,/g, '')) || 0;
                    }}
                  />
                  {deliveryCost && deliveryCost > 0 && formCurrency !== 'TJS' && (
                    <div style={{ 
                      marginTop: 8, 
                      padding: '8px 12px', 
                      backgroundColor: '#f6f8fa', 
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      💰 {t('stockReceipts.deliveryCostInCurrency', { defaultValue: 'Стоимость доставки в валюте прихода' })}: 
                      <strong style={{ color: '#1890ff', marginLeft: 4 }}>
                        {(deliveryCost / formRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {formCurrency}
                      </strong>
                    </div>
                  )}
                </Form.Item>

                <Form.Item label={t('stockReceipts.items')}>
                  <div style={{ marginBottom: 16 }}>
                    <Button
                      type="dashed"
                      onClick={addReceiptItem}
                      icon={<PlusOutlined />}
                      block
                    >
                      {t('stockReceipts.addItem')}
                    </Button>
                  </div>
                  
                  {receiptItems.map((item, index) => (
                    <Card
                      key={index}
                      size="small"
                      style={{ marginBottom: 16 }}
                      title={`${t('common.product')} ${index + 1}`}
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
                            label={t('common.product')}
                            required
                          >
                            <Select
                              placeholder={t('stockReceipts.selectProduct', { defaultValue: 'Выберите товар' })}
                              value={item.product_id || undefined}
                              onChange={(value) => {
                                console.log(`Updating item ${index} product_id to:`, value, 'type:', typeof value);
                                updateReceiptItem(index, 'product_id', value);
                                const selected = products.find(p => p.id === value);
                                if (selected?.type !== 'batch') {
                                  // Only update batch_code if it exists, don't override other fields
                                  const currentItem = receiptItems[index];
                                  if (currentItem.batch_code !== undefined) {
                                    updateReceiptItem(index, 'batch_code', undefined);
                                  }
                                }
                              }}
                              showSearch
                              status={!item.product_id || item.product_id <= 0 ? 'error' : undefined}
                              filterOption={(input, option) => {
                                const product = products.find(p => p.id === option?.value);
                                return product?.name.toLowerCase().includes(input.toLowerCase()) ?? false;
                              }}
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
                        {(() => {
                          const selectedProduct = products.find(p => p.id === item.product_id);
                          if (selectedProduct?.type !== 'batch') return null;
                          return (
                            <Col xs={24} sm={12}>
                              <Form.Item label={t('stockReceipts.batchCode', { defaultValue: 'Партия (batch_code)' })}>
                                <Input
                                  placeholder="Например: PARTY-A"
                                  value={item.batch_code}
                                  onChange={(e) => updateReceiptItem(index, 'batch_code', e.target.value)}
                                />
                              </Form.Item>
                            </Col>
                          );
                        })()}
                        <Col xs={12} sm={6}>
                          <Form.Item
                            label={t('common.quantity')}
                            required
                          >
                            <InputNumber
                              placeholder={t('stockReceipts.quantityPlaceholder', { defaultValue: 'Кол-во' })}
                              min={1}
                              value={item.quantity}
                              onChange={(value) => updateReceiptItem(index, 'quantity', value || 1)}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                          <Form.Item
                            label={t('stockReceipts.tonnage', { defaultValue: 'Тонна' })}
                          >
                            <InputNumber
                              placeholder={t('stockReceipts.tonnagePlaceholder', { defaultValue: 'Тонны' })}
                              min={0}
                              step={0.001}
                              precision={3}
                              value={item.tonnage || undefined}
                              onChange={(value) => updateReceiptItem(index, 'tonnage', value || undefined)}
                              disabled={!!(item.purchase_cost && item.purchase_cost > 0 && !item.tonnage && !item.price_per_ton)}
                              formatter={(value) => {
                                if (!value) return '';
                                const num = parseFloat(value.toString());
                                return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
                              }}
                              parser={(value) => {
                                if (!value) return 0;
                                return parseFloat(value.replace(/,/g, '')) || 0;
                              }}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                          <Form.Item
                            label={t('stockReceipts.pricePerTon', { defaultValue: 'Цена за тонну' })}
                          >
                            <InputNumber
                              placeholder={t('stockReceipts.pricePerTonPlaceholder', { defaultValue: 'Цена/тонна' })}
                              min={0}
                              step={0.01}
                              precision={2}
                              value={item.price_per_ton || undefined}
                              onChange={(value) => updateReceiptItem(index, 'price_per_ton', value || undefined)}
                              disabled={!!(item.purchase_cost && item.purchase_cost > 0 && !item.tonnage && !item.price_per_ton)}
                              formatter={(value) => {
                                if (!value) return '';
                                const num = parseFloat(value.toString());
                                return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                              }}
                              parser={(value) => {
                                if (!value) return 0;
                                return parseFloat(value.replace(/,/g, '')) || 0;
                              }}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                          <Form.Item
                            label={t('stockReceipts.purchaseCost')}
                          >
                            <InputNumber
                              placeholder={t('common.price')}
                              min={0}
                              step={0.01}
                              value={item.purchase_cost || undefined}
                              onChange={(value) => updateReceiptItem(index, 'purchase_cost', value || 0)}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value);
                                if (value && value > 0) {
                                  handlePurchaseCostBlur(index, value);
                                }
                              }}
                              disabled={!!(item.tonnage && item.price_per_ton && item.quantity && item.purchase_cost)}
                              formatter={(value) => {
                                if (!value) return '';
                                const num = parseFloat(value.toString());
                                return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                              }}
                              parser={(value) => {
                                if (!value) return 0;
                                return parseFloat(value.replace(/,/g, '')) || 0;
                              }}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                          <Form.Item
                            label={t('stockReceipts.actualCost', { defaultValue: 'Себестоимость' })}
                          >
                            <InputNumber
                              placeholder={t('common.cost')}
                              min={0}
                              step={0.01}
                              value={item.actual_cost || undefined}
                              disabled
                              style={{ width: '100%' }}
                              formatter={(value) => {
                                if (!value) return '';
                                const num = parseFloat(value.toString());
                                return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                              }}
                              parser={(value) => {
                                if (!value) return 0;
                                return parseFloat(value.replace(/,/g, '')) || 0;
                              }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                          <Form.Item
                            label={t('stockReceipts.sellingPrice')}
                            required
                            rules={[{ required: true, message: t('errors.required') }]}
                          >
                            <InputNumber
                              placeholder={t('common.price')}
                              min={0}
                              step={0.01}
                              value={item.selling_price || undefined}
                              onChange={(value) => updateReceiptItem(index, 'selling_price', value || 0)}
                              formatter={(value) => {
                                if (!value) return '';
                                const num = parseFloat(value.toString());
                                return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                              }}
                              parser={(value) => {
                                if (!value) return 0;
                                return parseFloat(value.replace(/,/g, '')) || 0;
                              }}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Form.Item
                          noStyle
                          shouldUpdate={(prevValues, currentValues) =>
                            prevValues.currency !== currentValues.currency ||
                            prevValues.rate !== currentValues.rate
                          }
                        >
                          {({ getFieldValue }) => {
                            const currency = getFieldValue('currency');
                            const rate = getFieldValue('rate') || 1;
                            const convertedPrice = currency !== 'TJS' && item.purchase_cost ? item.purchase_cost * rate : null;
                            return currency !== 'TJS' ? (
                              <Col xs={12} sm={6}>
                                <Form.Item
                                  label={t('stockReceipts.purchaseCostConverted', { defaultValue: 'Цена закупки (TJS)' })}
                                >
                                  <InputNumber
                                    value={convertedPrice}
                                    disabled
                                    style={{ width: '100%' }}
                                    formatter={(value) => `${value?.toLocaleString()} TJS`}
                                  />
                                </Form.Item>
                              </Col>
                            ) : null;
                          }}
                        </Form.Item>
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
                    {t('stockReceipts.create')}
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
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>{t('stockReceipts.title')}</Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <Modal
        title={`${t('stockReceipts.receipt')} #${selectedReceipt?.id} - ${t('common.details')}`}
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
                  {t('common.total')}: {parseFloat(selectedReceipt.total_amount).toLocaleString()} {selectedReceipt.currency}
                  {/* {selectedReceipt.currency !== 'TJS' && selectedReceipt.total_amount_converted && (
                    <> | {selectedReceipt.total_amount_converted.toFixed(2).toLocaleString()} TJS</>
                  )} */}
                </Tag>
              </Col>
              {selectedReceipt.delivery_cost && (
                <Col span={8}>
                  <Tag color="purple" icon={<DollarOutlined />}>
                    {t('stockReceipts.deliveryCost', { defaultValue: 'Доставка' })}: {parseFloat(selectedReceipt.delivery_cost).toLocaleString()} TJS
                  </Tag>
                </Col>
              )}
              {selectedReceipt.items && selectedReceipt.items.length > 0 && (
                <Col span={8}>
                  <Tag color="green" icon={<DollarOutlined />}>
                    {t('stockReceipts.totalActualCost', { defaultValue: 'Общая себестоимость' })}: {
                      selectedReceipt.items.reduce((sum, item) => 
                        sum + (parseFloat(item.actual_cost) * item.quantity), 0
                      ).toLocaleString()
                    } {selectedReceipt.currency}
                  </Tag>
                </Col>
              )}
                          </Row>
            
            {loadingReceiptDetails ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin size="large" />
                <div style={{ marginTop: 8 }}>{t('common.loading')}...</div>
              </div>
            ) : (
              <Table
                columns={getItemColumns(selectedReceipt.currency)}
                dataSource={selectedReceipt.items}
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
