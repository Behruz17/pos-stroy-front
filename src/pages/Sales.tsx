import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Card, message, Popconfirm, Tabs, Form, Select, InputNumber, Row, Col, type TableProps, Modal, Input, Tag, Spin, DatePicker, Statistic } from 'antd';
import { useTranslation } from 'react-i18next';
import { EditOutlined, DeleteOutlined, SaveOutlined, TeamOutlined, PlusOutlined, SearchOutlined, ShoppingCartOutlined, DollarOutlined, CalendarOutlined, UserOutlined, PrinterOutlined, HistoryOutlined, CheckCircleOutlined, CarOutlined, ShoppingOutlined, CheckCircleFilled } from '@ant-design/icons';
import { salesApi, customersApi, productsApi, stockItemsApi, stylesApi, type Sale, type SaleItem, type SaleStage, type UpdateSaleItem, type Customer, type Product, type OverdueSale, type StageHistoryEntry, type StockItem, type Style } from '../api';
import dayjs from 'dayjs';
import '../components/Receipt.css';

interface CreateSaleItemLocal {
  product_id: number;
  quantity: number;
  unit_price: number;
  unit_value?: number;
  stock_item_id?: number;
  style_id?: number;
}

const { Title, Text } = Typography;
const { Option } = Select;

export const Sales = () => {
  const { t } = useTranslation();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [creating, setCreating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'DEBT' | 'PARTIAL'>('PAID');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [saleItems, setSaleItems] = useState<CreateSaleItemLocal[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [loadingSaleDetails, setLoadingSaleDetails] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [stockErrorModal, setStockErrorModal] = useState<{ visible: boolean; productName: string }>({ visible: false, productName: '' });
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editSaleItems, setEditSaleItems] = useState<UpdateSaleItem[]>([]);
  const [overdueSales, setOverdueSales] = useState<OverdueSale[]>([]);
  const [loadingOverdue, setLoadingOverdue] = useState(false);
  const [selectedOverdueSale, setSelectedOverdueSale] = useState<Sale | null>(null);
  const [overdueDetailModalVisible, setOverdueDetailModalVisible] = useState(false);
  const [loadingOverdueDetails, setLoadingOverdueDetails] = useState(false);
    const [stageHistoryModalVisible, setStageHistoryModalVisible] = useState(false);
  const [stageHistory, setStageHistory] = useState<StageHistoryEntry[]>([]);
  const [loadingStageHistory, setLoadingStageHistory] = useState(false);
  const [selectedSaleForStage, setSelectedSaleForStage] = useState<Sale | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [addingPayment, setAddingPayment] = useState(false);
  const [productStockItems, setProductStockItems] = useState<Record<number, StockItem[]>>({});
  const [loadingStockItems, setLoadingStockItems] = useState<Record<number, boolean>>({});

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
        message.error(t('errors.unauthorized'));
      } else {
        message.error(t('sales.errorLoading'));
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
      message.error(t('customers.errorLoading', { defaultValue: 'Ошибка при загрузке клиентов' }));
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

  const fetchStyles = async () => {
    try {
      const data = await stylesApi.getAll();
      setStyles(data);
    } catch (error: unknown) {
      message.error(t('styles.errorLoading', { defaultValue: 'Ошибка при загрузке стилей' }));
    }
  };
  const fetchProductStockItems = async (productId: number) => {
    if (productStockItems[productId]) return; // already cached
    setLoadingStockItems(prev => ({ ...prev, [productId]: true }));
    try {
      const response = await stockItemsApi.getByProductId(productId);
      setProductStockItems(prev => ({ ...prev, [productId]: response.batches || [] }));
    } catch (error) {
      console.error(`Failed to load stock items for product ${productId}:`, error);
    } finally {
      setLoadingStockItems(prev => ({ ...prev, [productId]: false }));
    }
  };

  const fetchOverdueSales = async () => {
    setLoadingOverdue(true);
    try {
      const data = await salesApi.getOverdueSales();
      setOverdueSales(data);
    } catch (error: unknown) {
      message.error(t('sales.errorLoadingOverdue', { defaultValue: 'Ошибка при загрузке просроченных продаж' }));
    } finally {
      setLoadingOverdue(false);
    }
  };

  const loadOverdueSaleDetails = async (id: number) => {
    setLoadingOverdueDetails(true);
    try {
      const detailedSale = await salesApi.getOverdueSaleById(id);
      setSelectedOverdueSale(detailedSale);
    } catch (error: unknown) {
      message.error(t('sales.errorLoadingDetails', { defaultValue: 'Ошибка при загрузке деталей продажи' }));
    } finally {
      setLoadingOverdueDetails(false);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchCustomers();
    fetchProducts();
    fetchStyles();
    fetchOverdueSales();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [selectedDate]);

  useEffect(() => {
    if (selectedSale && detailModalVisible && !selectedSale.items) {
      loadSaleDetails(selectedSale.id);
    }
  }, [selectedSale, detailModalVisible]);

  useEffect(() => {
    if (selectedOverdueSale && overdueDetailModalVisible && !selectedOverdueSale.items) {
      loadOverdueSaleDetails(selectedOverdueSale.id);
    }
  }, [selectedOverdueSale, overdueDetailModalVisible]);

  useEffect(() => {
    if (selectedReceiptSale && receiptModalVisible && !selectedReceiptSale.items) {
      loadSaleDetails(selectedReceiptSale.id);
    }
  }, [selectedReceiptSale, receiptModalVisible]);

  const loadSaleDetails = async (id: number) => {
    setLoadingSaleDetails(true);
    try {
      const detailedSale = await salesApi.getById(id);
      setSelectedSale(detailedSale);
      // Also update selectedReceiptSale if it's the same sale
      if (selectedReceiptSale && selectedReceiptSale.id === id) {
        setSelectedReceiptSale(detailedSale);
      }
    } catch (error: unknown) {
      message.error(t('sales.errorLoadingDetails', { defaultValue: 'Error loading sale details' }));
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
      message.success(t('sales.saleDeleted'));
      fetchSales();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 404) {
        message.error(t('errors.notFound'));
      } else {
        message.error(t('sales.errorDeleting'));
      }
    }
  };

  const handleCreate = async (values: any) => {
    setCreating(true);
    try {
      if (saleItems.length === 0) {
        message.error(t('sales.addAtLeastOneItem', { defaultValue: 'Добавьте хотя бы один товар' }));
        return;
      }

      // Validate each sale item
      for (const item of saleItems) {
        if (!item.product_id || item.product_id === 0) {
          message.error(t('sales.selectProductForAll', { defaultValue: 'Выберите товар для всех позиций' }));
          setCreating(false);
          return;
        }
        const selectedProduct = products.find(p => p.id === item.product_id);
        if (selectedProduct?.type === 'batch' && !item.stock_item_id) {
          message.error(t('sales.selectBatchForAllBatchProducts', { defaultValue: 'Выберите партию для всех batch товаров' }));
          setCreating(false);
          return;
        }
        if (!item.quantity || item.quantity <= 0) {
          message.error(t('sales.specifyQuantity', { defaultValue: 'Укажите корректное количество для всех позиций' }));
          setCreating(false);
          return;
        }
        if (!item.unit_price || item.unit_price <= 0) {
          message.error(t('sales.specifyPrice', { defaultValue: 'Укажите корректную цену для всех позиций' }));
          setCreating(false);
          return;
        }
      }

      const createData: any = {
        customer_id: values.customer_id,
        payment_status: values.payment_status,
        items: saleItems.map(({ stock_item_id, style_id, ...rest }) => ({ 
          ...rest, 
          ...(stock_item_id && { stock_item_id }), 
          ...(style_id && { style_id }) 
        })),
      };
      
      if ((values.payment_status === 'DEBT' || values.payment_status === 'PARTIAL') && values.debt_deadline) {
        createData.debt_deadline = values.debt_deadline.format('YYYY-MM-DD');
      }
      
      if (values.payment_status === 'PARTIAL') {
        // Для статуса "Частично" требуем заполнение хотя бы одного поля оплаты
        if (!values.cash_amount && !values.electronic_amount) {
          message.error(t('sales.partialPaymentRequired', { defaultValue: 'Для статуса "Частично" заполните хотя бы одно поле: Наличные или Электронные' }));
          return;
        }
        createData.cash_amount = values.cash_amount || 0;
        createData.electronic_amount = values.electronic_amount || 0;
      } else if (values.payment_status === 'PAID') {
        // Для статуса "Оплачено" требуем заполнение хотя бы одного поля оплаты
        if (!values.cash_amount && !values.electronic_amount) {
          message.error(t('sales.paymentRequired', { defaultValue: 'Для статуса "Оплачено" заполните хотя бы одно поле: Наличные или Электронные' }));
          return;
        }
        createData.cash_amount = values.cash_amount || 0;
        createData.electronic_amount = values.electronic_amount || 0;
      }
      
      
      console.log('Creating sale with data:', createData);
      await salesApi.create(createData);
      message.success(t('sales.saleCreated'));
      form.resetFields();
      setSaleItems([]);
      setPaymentStatus('PAID');
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
        message.error(t('errors.networkError'));
      } else {
        message.error(t('sales.errorCreating'));
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
      cash_amount: sale.cash_amount,
      electronic_amount: sale.electronic_amount,
      debt_deadline: sale.debt_deadline ? dayjs(sale.debt_deadline) : undefined,
    });
    
    // Load sale details to get items
    setLoadingSaleDetails(true);
    try {
      const saleDetails = await salesApi.getById(sale.id);
      if (saleDetails.items) {
        const items: UpdateSaleItem[] = saleDetails.items.map(item => ({
          product_id: item.product_id,
          stock_item_id: item.stock_item_id ?? undefined,
          quantity: item.quantity,
          unit_price: item.unit_price,
          unit_value: item.unit_value || 1.0,
        }));
        setEditSaleItems(items);
        // Preload stock items for batch products
        items.forEach(item => {
          const product = products.find(p => p.id === item.product_id);
          if (product?.type === 'batch') {
            fetchProductStockItems(item.product_id);
          }
        });
      }
    } catch (error) {
      message.error(t('sales.errorLoadingDetails', { defaultValue: 'Ошибка при загрузке деталей продажи' }));
    } finally {
      setLoadingSaleDetails(false);
    }
  };

  const handleUpdate = async (values: any) => {
    if (!editingSale) return;
    
    if (editSaleItems.length === 0) {
      message.error(t('sales.addAtLeastOneItem', { defaultValue: 'Добавьте хотя бы один товар' }));
      return;
    }

    // Validate items
    for (const item of editSaleItems) {
      if (!item.product_id || item.product_id === 0) {
        message.error(t('sales.selectProductForAll', { defaultValue: 'Выберите товар для всех позиций' }));
        return;
      }
      const selectedProduct = products.find(p => p.id === item.product_id);
      if (selectedProduct?.type === 'batch' && !item.stock_item_id) {
        message.error(t('sales.selectBatchForAllBatchProducts', { defaultValue: 'Выберите партию для всех batch товаров' }));
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        message.error(t('sales.specifyQuantity', { defaultValue: 'Укажите корректное количество для всех позиций' }));
        return;
      }
      if (!item.unit_price || item.unit_price <= 0) {
        message.error(t('sales.specifyPrice', { defaultValue: 'Укажите корректную цену для всех позиций' }));
        return;
      }
    }

    // Валидация полей оплаты для статусов PAID и PARTIAL
    if (values.payment_status === 'PAID') {
      if (!values.cash_amount && !values.electronic_amount) {
        message.error(t('sales.paymentRequired', { defaultValue: 'Для статуса "Оплачено" заполните хотя бы одно поле: Наличные или Электронные' }));
        return;
      }
    } else if (values.payment_status === 'PARTIAL') {
      if (!values.cash_amount && !values.electronic_amount) {
        message.error(t('sales.partialPaymentRequired', { defaultValue: 'Для статуса "Частично" заполните хотя бы одно поле: Наличные или Электронные' }));
        return;
      }
    }

    setEditing(true);
    try {
      // Ensure all items have proper numeric values
      const validatedItems = editSaleItems.map(item => ({
        product_id: item.product_id,
        stock_item_id: item.stock_item_id,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        unit_value: Number(item.unit_value) > 0 ? Number(item.unit_value) : 1.0,
      }));
      
      console.log('Sending update with items:', validatedItems);
      
      const updateData = {
        customer_id: values.customer_id,
        payment_status: values.payment_status,
        items: validatedItems,
        // Добавляем поля оплаты если они есть
        ...(values.cash_amount && { cash_amount: Number(values.cash_amount) }),
        ...(values.electronic_amount && { electronic_amount: Number(values.electronic_amount) }),
      };

      await salesApi.update(editingSale.id, updateData);
      message.success(t('sales.saleUpdated'));
      setEditModalVisible(false);
      setEditingSale(null);
      setEditSaleItems([]);
      form.resetFields();
      fetchSales();
    } catch (error: unknown) {
      console.error('Update sale error:', error);
      const axiosError = error as { response?: { status: number; data?: { message?: string; productName?: string; errors?: any } }; message?: string };
      console.error('Server response:', axiosError.response?.data);
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
        message.error(t('errors.networkError'));
      } else {
        message.error(t('sales.errorUpdating'));
      }
    } finally {
      setEditing(false);
    }
  };

  // Helper function to render stage tags
  const getStageTag = (stage: SaleStage) => {
    const stageConfig = {
      ordered: { color: 'default', icon: <ShoppingOutlined />, text: t('sales.ordered', { defaultValue: 'Заказан' }) },
      ready: { color: 'processing', icon: <CheckCircleOutlined />, text: t('sales.ready', { defaultValue: 'Готов' }) },
      delivered: { color: 'success', icon: <CheckCircleFilled />, text: t('sales.delivered', { defaultValue: 'Выдан' }) },
    };
    const config = stageConfig[stage];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // Handler to update sale stage
  const handleUpdateStage = async (sale: Sale, newStage: SaleStage) => {
    try {
      await salesApi.updateStage(sale.id, { stage: newStage });
      message.success(t('sales.stageUpdated', { defaultValue: 'Этап обновлен' }));
      fetchSales();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      message.error(axiosError.response?.data?.message || t('sales.stageUpdateError', { defaultValue: 'Ошибка обновления этапа' }));
    }
  };

  // Handler to view stage history
  const handleViewStageHistory = async (sale: Sale) => {
    setSelectedSaleForStage(sale);
    setStageHistoryModalVisible(true);
    setLoadingStageHistory(true);
    try {
      const data = await salesApi.getStageHistory(sale.id);
      setStageHistory(data);
    } catch (error) {
      message.error(t('sales.stageHistoryError', { defaultValue: 'Ошибка загрузки истории' }));
    } finally {
      setLoadingStageHistory(false);
    }
  };

  // Handler to open payment modal
  const handleOpenPaymentModal = (sale: Sale) => {
    setSelectedSaleForPayment(sale);
    const remaining = sale.total_amount - (sale.cash_amount + sale.electronic_amount);
    setPaymentAmount(remaining > 0 ? remaining : 0);
    setPaymentModalVisible(true);
  };

  // Handler to add payment
  const handleAddPayment = async () => {
    if (!selectedSaleForPayment || paymentAmount <= 0) return;
    
    setAddingPayment(true);
    try {
      const result = await salesApi.addPayment(selectedSaleForPayment.id, {
        amount: paymentAmount,
      });
      message.success(result.message);
      setPaymentModalVisible(false);
      fetchSales();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      message.error(axiosError.response?.data?.message || t('sales.paymentError', { defaultValue: 'Ошибка добавления оплаты' }));
    } finally {
      setAddingPayment(false);
    }
  };

  const addSaleItem = () => {
    const newItem: CreateSaleItemLocal = {
      product_id: 0,
      quantity: 1,
      unit_price: 0,
      unit_value: 1.0,
      stock_item_id: undefined,
      style_id: undefined,
    };
    setSaleItems([...saleItems, newItem]);
  };

  // Group sale items by product for UI display
  const getGroupedSaleItems = () => {
    const groups = new Map<number, CreateSaleItemLocal[]>();
    
    saleItems.forEach(item => {
      if (!groups.has(item.product_id)) {
        groups.set(item.product_id, []);
      }
      groups.get(item.product_id)!.push(item);
    });
    
    return Array.from(groups.entries()).map(([productId, items]) => {
      const product = products.find(p => p.id === Number(productId));
      const totalMeters = items.reduce((sum, item) => sum + (item.quantity * (item.unit_value || 1.0)), 0);
      const totalPrice = items.reduce((sum, item) => sum + (item.quantity * item.unit_price * (item.unit_value || 1.0)), 0);
      
      return {
        productId: Number(productId),
        product,
        items,
        totalMeters,
        totalPrice
      };
    });
  };

  const updateSaleItem = (index: number, field: keyof CreateSaleItemLocal, value: any) => {
    const updatedItems = [...saleItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Reset stock_item_id if product changes and is not batch
    if (field === 'product_id') {
      const selected = products.find(p => p.id === value);
      if (selected?.type !== 'batch') {
        updatedItems[index].stock_item_id = undefined;
      } else {
        fetchProductStockItems(value);
      }
      // Auto-populate unit_price from product selling_price
      if (selected?.selling_price) {
        updatedItems[index].unit_price = selected.selling_price;
      }
    }
    
    // Auto-populate unit_price from selected batch selling_price
    if (field === 'stock_item_id' && value) {
      const stockItems = productStockItems[updatedItems[index].product_id] || [];
      const selectedBatch = stockItems.find(si => si.id === value);
      if (selectedBatch?.selling_price) {
        updatedItems[index].unit_price = selectedBatch.selling_price;
      }
    }
    
    setSaleItems(updatedItems);
  };

  const removeSaleItem = (index: number) => {
    const updatedItems = [...saleItems];
    updatedItems.splice(index, 1);
    setSaleItems(updatedItems);
  };

  const handleViewReceipt = (sale: Sale) => {
    // Open receipt modal
    setSelectedReceiptSale(sale);
    setReceiptModalVisible(true);
  };

  const handlePrintReceipt = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      message.error('Could not open print window');
      return;
    }

    // Generate receipt HTML for printing
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title></title>
        <style>
          @font-face {
            font-family: 'Caveat';
            font-style: normal;
            font-weight: 400;
            src: local('Caveat'), local('Caveat-Regular'), url(https://fonts.gstatic.com/s/caveat/v17/Wn6H9gCx1Alz3aGl1kcA.woff2) format('woff2');
            unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
          }
          @font-face {
            font-family: 'Caveat';
            font-style: normal;
            font-weight: 600;
            src: local('Caveat'), local('Caveat-Bold'), url(https://fonts.gstatic.com/s/caveat/v17/Wn6H9gCx1Alz9aGl1kcA6wZ.woff2) format('woff2');
            unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
          }
          @font-face {
            font-family: 'Caveat';
            font-style: normal;
            font-weight: 400;
            src: url(https://fonts.gstatic.com/s/caveat/v17/Wn6H9gCx1Alz3aGl1kcA.woff2) format('woff2');
            unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
          }
          @font-face {
            font-family: 'Caveat';
            font-style: normal;
            font-weight: 600;
            src: url(https://fonts.gstatic.com/s/caveat/v17/Wn6H9gCx1Alz9aGl1kcA6wZ.woff2) format('woff2');
            unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
          }
          body {
            font-family: 'Caveat', cursive;
            font-size: 18px;
            line-height: 1.4;
            letter-spacing: 0.3px;
            color: #333;
            background: white;
            width: fit-content;
            min-width: 400px;
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 24px;
          }
          .header h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #222;
          }
          .receipt-items {
            margin-bottom: 20px;
          }
          .receipt-group {
            margin-bottom: 12px;
          }
          .receipt-group-name {
            font-weight: 600;
            color: #222;
            margin-bottom: 4px;
          }
          .receipt-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            gap: 10px;
          }
          .receipt-item-name {
            flex: 1;
            font-weight: 500;
            color: #444;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .receipt-item-details {
            text-align: right;
            color: #666;
            font-size: 16px;
            white-space: nowrap;
            flex-shrink: 0;
          }
          .receipt-total {
            text-align: center;
            margin-top: 20px;
            font-size: 20px;
            font-weight: 600;
            color: #222;
          }
          @media print {
              @page {
                margin: 0;
                size: auto;
              }
              body {
                font-size: 18px;
                line-height: 1.4;
                width: fit-content;
                min-width: 400px;
                max-width: 400px;
                margin: 0;
                padding: 15px;
              }
              @page header {
                display: none;
              }
              @page footer {
                display: none;
              }
            }
            .header {
              margin-bottom: 20px;
              padding-bottom: 12px;
            }
            .receipt-title {
              font-size: 22px;
            }
            .receipt-item {
              margin-bottom: 10px;
            }
            .receipt-item-details {
              font-size: 16px;
            }
            .receipt-total {
              font-size: 20px;
              margin-top: 16px;
              padding-top: 12px;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-items">
          ${(() => {
            if (!selectedReceiptSale?.items?.length) return '';
            // Group items by product name
            const grouped = selectedReceiptSale.items.reduce((acc, item) => {
              if (!acc[item.product_name]) {
                acc[item.product_name] = [];
              }
              acc[item.product_name].push(item);
              return acc;
            }, {} as Record<string, typeof selectedReceiptSale.items>);

            return Object.entries(grouped).map(([productName, items]) => `
              <div class="receipt-group">
                <div class="receipt-group-name">${productName}</div>
                ${items.map(item => `
                  <div class="receipt-item-details" style="text-align: right; margin-bottom: 2px;">
                    ${item.quantity}${item.unit_value ? `×${item.unit_value}` : ''} ${item.style_name ? `(${item.style_name})` : ''} × ${(item.unit_price).toLocaleString()} = ${(item.quantity * item.unit_price * (item.unit_value || 1.0)).toLocaleString()}
                  </div>
                `).join('')}
              </div>
            `).join('');
          })()}
        </div>
        
        <div class="receipt-total">
          ${t('common.totalAmount', { defaultValue: 'Total Amount' })}: ${selectedReceiptSale?.total_amount?.toLocaleString()}
        </div>
      </body>
      </html>
    `;

    // Write content to the new window
    printWindow.document.write(receiptHTML);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      // Hide print headers and footers
      setTimeout(() => {
        printWindow.document.title = '';
        printWindow.print();
        printWindow.close();
      }, 100);
    };
  };

  const columns: TableProps<Sale>['columns'] = [
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
      title: t('sales.customer'),
      dataIndex: 'customer_name',
      key: 'customer_name',
      ellipsis: true,
    },
    {
      title: t('common.totalAmount'),
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
      title: t('sales.paymentStatus', { defaultValue: 'Статус оплаты' }),
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status: string) => (
        <Tag color={status === 'PAID' ? 'green' : status === 'PARTIAL' ? 'blue' : 'orange'}>
          {status === 'PAID' ? t('sales.paid', { defaultValue: 'Оплачено' }) : status === 'PARTIAL' ? t('sales.partial', { defaultValue: 'Частично' }) : t('sales.debt', { defaultValue: 'Долг' })}
        </Tag>
      ),
    },
    {
      title: t('sales.stage', { defaultValue: 'Этап' }),
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: SaleStage) => getStageTag(stage),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 240,
      render: (_: unknown, record: Sale) => (
        <Space size="small">
          {/* Stage buttons */}
          {record.stage === 'ordered' && (
            <Button
              icon={<CheckCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStage(record, 'ready');
              }}
              size="small"
              type="primary"
              title={t('sales.markReady', { defaultValue: 'Отметить готовым' })}
            />
          )}
          {record.stage === 'ready' && (
            <Button
              icon={<CarOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStage(record, 'delivered');
              }}
              size="small"
              type="primary"
              title={t('sales.markDelivered', { defaultValue: 'Отметить выданным' })}
            />
          )}
          
          {/* Payment button for PARTIAL or DEBT */}
          {(record.payment_status === 'PARTIAL' || record.payment_status === 'DEBT') && (
            <Button
              icon={<DollarOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPaymentModal(record);
              }}
              size="small"
              title={t('sales.addPayment', { defaultValue: 'Добавить оплату' })}
            />
          )}
          
          {/* Stage history button */}
          <Button
            icon={<HistoryOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleViewStageHistory(record);
            }}
            size="small"
            title={t('sales.stageHistory', { defaultValue: 'История этапов' })}
          />
          
          <Button
            icon={<PrinterOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleViewReceipt(record);
            }}
            size="small"
            title={t('common.viewReceipt', { defaultValue: 'View Receipt' })}
            type="default"
          />
          <Button
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record);
            }}
            size="small"
            title={t('common.edit')}
          />
          <Popconfirm
            title={t('sales.confirmDelete')}
            description={t('sales.deleteWarning', { defaultValue: 'Это действие нельзя отменить, товары вернутся на склад' })}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button danger icon={<DeleteOutlined />} size="small" title={t('common.delete')} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const itemColumns: TableProps<SaleItem>['columns'] = [
    {
      title: t('common.product'),
      dataIndex: 'product_name',
      key: 'product_name',
      ellipsis: true,
    },
    {
      title: t('common.id'),
      dataIndex: 'product_id',
      key: 'product_id',
      width: 80,
    },
    {
      title: 'Стиль',
      dataIndex: 'style_name',
      key: 'style_name',
      width: 100,
      render: (style_name: string | null | undefined) => style_name || '-',
    },
    {
      title: t('common.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: t('sales.unitValue', { defaultValue: 'Единица измерения' }),
      dataIndex: 'unit_value',
      key: 'unit_value',
      width: 100,
      render: (value: number | undefined) => (value || 1.0).toLocaleString(),
    },
    {
      title: t('sales.unitPrice'),
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: number) => price.toLocaleString(),
      width: 100,
    },
    {
      title: t('common.total'),
      key: 'total',
      render: (_, record: SaleItem) => (
        <strong>{(record.quantity * record.unit_price * (record.unit_value || 1.0)).toLocaleString()}</strong>
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
          {t('sales.list')}
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder={t('sales.searchPlaceholder', { defaultValue: 'Поиск продаж...' })}
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder={t('sales.filterByCustomer', { defaultValue: 'Фильтр по клиенту' })}
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
                placeholder={t('sales.filterByDate', { defaultValue: 'Фильтр по дате' })}
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
      key: 'overdue-list',
      label: (
        <span>
          <CalendarOutlined />
          {t('sales.overdueSalesList', { defaultValue: 'Просроченные продажи' })}
        </span>
      ),
      children: (
        <div>
          <Table
            columns={[
              {
                title: '№',
                key: 'rowNumber',
                width: 60,
                render: (_: unknown, __: any, index: number) => index + 1,
              },
              {
                title: t('common.customer'),
                dataIndex: 'customer_name',
                key: 'customer_name',
                ellipsis: true,
              },
              {
                title: t('common.totalAmount'),
                dataIndex: 'total_amount',
                key: 'total_amount',
                render: (amount: number) => (
                  <span style={{ color: '#ff4d4f' }}>
                    <DollarOutlined style={{ marginRight: 4 }} />
                    {amount.toLocaleString()}
                  </span>
                ),
              },
              {
                title: t('sales.debtDeadline', { defaultValue: 'Срок долга' }),
                dataIndex: 'debt_deadline',
                key: 'debt_deadline',
                render: (date: string) => {
                  const deadline = dayjs(date);
                  const now = dayjs();
                  const daysOverdue = now.diff(deadline, 'day');
                  return (
                    <span style={{ color: daysOverdue > 0 ? '#ff4d4f' : '#52c41a' }}>
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      {deadline.format('DD.MM.YYYY')}
                      {daysOverdue > 0 && (
                        <Text style={{ marginLeft: 8, color: '#ff4d4f' }}>
                          (+{daysOverdue} {t('common.days', { defaultValue: 'дней' })})
                        </Text>
                      )}
                    </span>
                  );
                },
              },
              {
                title: t('common.date'),
                dataIndex: 'created_at',
                key: 'created_at',
                render: (date: string) => new Date(date).toLocaleDateString(),
              },
            ]}
            dataSource={overdueSales}
            rowKey="id"
            loading={loadingOverdue}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            size="small"
            onRow={(record) => ({
              onClick: () => {
                setSelectedOverdueSale(null);
                setOverdueDetailModalVisible(true);
                loadOverdueSaleDetails(record.id);
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
          {t('common.create', { defaultValue: 'Created' })}
        </span>
      ),
      children: (
        <Row justify="center">
          <Col xs={24} sm={24} md={20} lg={16} xl={12}>
            <Card>
              <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
                <ShoppingCartOutlined /> {t('sales.create')}
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
                  label={t('sales.customer')}
                >
                  <Select placeholder={t('sales.selectCustomer', { defaultValue: 'Выберите клиента' })} prefix={<UserOutlined />}>
                    {customers.map(customer => (
                      <Option key={customer.id} value={customer.id}>
                        {customer.full_name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="payment_status"
                  label={t('sales.paymentStatus', { defaultValue: 'Статус оплаты' })}
                  rules={[{ required: true, message: t('sales.selectPaymentStatus', { defaultValue: 'Выберите статус оплаты' }) }]}
                >
                  <Select
                    placeholder={t('sales.selectPaymentStatus')}
                    value={paymentStatus}
                    onChange={(value) => setPaymentStatus(value)}
                  >
                    <Option value="PAID">{t('sales.paid', { defaultValue: 'Оплачено' })}</Option>
                    <Option value="PARTIAL">{t('sales.partial', { defaultValue: 'Частично' })}</Option>
                    <Option value="DEBT">{t('sales.debt', { defaultValue: 'Долг' })}</Option>
                  </Select>
                </Form.Item>

                {(paymentStatus === 'DEBT' || paymentStatus === 'PARTIAL') && (
                  <Form.Item
                    name="debt_deadline"
                    label={t('sales.debtDeadline', { defaultValue: 'Срок долга' })}
                    rules={[{ required: true, message: t('sales.selectDebtDeadline', { defaultValue: 'Выберите срок долга' }) }]}
                  >
                    <DatePicker
                      placeholder={t('sales.selectDebtDeadline', { defaultValue: 'Выберите срок долга' })}
                      style={{ width: '100%' }}
                      format="YYYY-MM-DD"
                    />
                  </Form.Item>
                )}

                {(paymentStatus === 'PARTIAL' || paymentStatus === 'PAID') && (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="cash_amount"
                        label={t('sales.cashAmount', { defaultValue: 'Наличные' })}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          precision={2}
                          placeholder={t('sales.enterCashAmount', { defaultValue: 'Сумма наличными' })}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="electronic_amount"
                        label={t('sales.electronicAmount', { defaultValue: 'Электронные' })}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          precision={2}
                          placeholder={t('sales.enterElectronicAmount', { defaultValue: 'Сумма электронно' })}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                )}

                

                <Form.Item label={t('sales.items')}>
                  
                  {saleItems.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <Row gutter={8} align="middle">
                        <Col flex="auto">
                          <Text strong style={{ fontSize: '12px', color: '#666' }}>
                            {t('common.product')}
                          </Text>
                        </Col>
                        <Col flex="120px">
                          <Text strong style={{ fontSize: '12px', color: '#666' }}>
                            {t('sales.style')}
                          </Text>
                        </Col>
                        <Col flex="80px">
                          <Text strong style={{ fontSize: '12px', color: '#666' }}>
                            {t('common.quantity')}
                          </Text>
                        </Col>
                        <Col flex="80px">
                          <Text strong style={{ fontSize: '12px', color: '#666' }}>
                            {t('sales.unitValue', { defaultValue: 'Единица измерения' })}
                          </Text>
                        </Col>
                        <Col flex="120px">
                          <Text strong style={{ fontSize: '12px', color: '#666' }}>
                            {t('sales.unitPrice')}
                          </Text>
                        </Col>
                        <Col flex="120px">
                          <Text strong style={{ fontSize: '12px', color: '#666' }}>
                            Сумма
                          </Text>
                        </Col>
                        <Col flex="40px">
                        </Col>
                      </Row>
                    </div>
                  )}
                  
                  {getGroupedSaleItems().map((group) => (
                    <Card
                      key={group.productId}
                      size="small"
                      style={{ marginBottom: 16 }}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontWeight: 'bold', display: 'block' }}>
                              {group.product?.name || `Product #${group.productId}`}
                            </span>
                            {group.product && (
                              <span style={{ 
                                fontSize: '11px', 
                                color: group.product.stock_quantity <= 10 ? '#ff4d4f' : group.product.stock_quantity <= 50 ? '#faad14' : '#52c41a',
                                fontWeight: group.product.stock_quantity <= 10 ? 'bold' : 'normal'
                              }}>
                                Stock: {group.product.stock_quantity}
                              </span>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              Итого: {group.totalMeters.toFixed(2)} м × {group.product?.selling_price || 0} = {group.totalPrice.toLocaleString()} TJS
                            </div>
                          </div>
                        </div>
                      }
                    >
                      {/* Список строк товара */}
                      <div style={{ marginBottom: 12 }}>
                        <Text strong style={{ fontSize: '12px', color: '#666' }}>
                          Строки: {group.items.map((item) => 
                            `${item.quantity}×${(item.unit_value || 1.0).toFixed(1)}`
                          ).join(', ')}
                        </Text>
                      </div>
                      
                      {/* Поля редактирования для каждой строки */}
                      {group.items.map((item, itemIndex) => {
                        const globalIndex = saleItems.indexOf(item);
                        const isFirstItem = itemIndex === 0;
                        return (
                          <div key={globalIndex} style={{ marginBottom: 8 }}>
                            {/* Первая строка - выбор товара (только для первой строки) */}
                            {isFirstItem && (
                              <Row style={{ marginBottom: 8 }}>
                                <Col span={24}>
                                  <Form.Item
                                    required
                                    style={{ marginBottom: 0 }}
                                  >
                                    <Select
                                      placeholder={t('sales.selectProduct', { defaultValue: 'Choose product' })}
                                      value={item.product_id || undefined}
                                      onChange={(value) => updateSaleItem(globalIndex, 'product_id', value)}
                                      showSearch
                                      filterOption={(input, option) => {
                                        const productId = option?.value as number;
                                        const product = products.find(p => p.id === productId);
                                        return product?.name.toLowerCase().includes(input.toLowerCase()) || false;
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
                              </Row>
                            )}
                            
                            {/* Вторая строка - остальные поля */}
                            <Row gutter={8} align="middle">
                              {(() => {
                                const selectedProduct = products.find(p => p.id === item.product_id);
                                if (selectedProduct?.type !== 'batch') return null;
                                const stockItems = productStockItems[item.product_id] || [];
                                return (
                                  <Col flex="180px">
                                  <Form.Item style={{ marginBottom: 0 }}>
                                    <Select
                                      placeholder={t('sales.batch')}
                                      value={item.stock_item_id}
                                      onChange={(value) => updateSaleItem(globalIndex, 'stock_item_id', value)}
                                      loading={loadingStockItems[item.product_id]}
                                      allowClear
                                    >
                                        {stockItems.map(si => (
                                          <Option key={si.id} value={si.id}>
                                            {si.batch_code} ({t('sales.remaining')} {si.quantity}) - {si.selling_price ? si.selling_price.toLocaleString() : '0'} TJS
                                          </Option>
                                        ))}
                                    </Select>
                                  </Form.Item>
                                </Col>
                                );
                              })()}
                              <Col flex="120px">
                                <Form.Item style={{ marginBottom: 0 }}>
                                  <Select
                                    placeholder={t('sales.style')}
                                    value={item.style_id}
                                    onChange={(value) => updateSaleItem(globalIndex, 'style_id', value)}
                                    allowClear
                                  >
                                    {styles.map(style => (
                                      <Option key={style.id} value={style.id}>
                                        {style.name}
                                      </Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                              </Col>
                              <Col flex="80px">
                                <Form.Item
                                  required
                                  style={{ marginBottom: 0 }}
                                >
                                  <InputNumber
                                    placeholder={t('sales.quantityPlaceholder', { defaultValue: 'Кол-во' })}
                                    min={1}
                                    value={item.quantity}
                                    onChange={(value) => updateSaleItem(globalIndex, 'quantity', value || 1)}
                                    style={{ width: '100%' }}
                                  />
                                </Form.Item>
                              </Col>
                              <Col flex="80px">
                                <Form.Item
                                  style={{ marginBottom: 0 }}
                                >
                                  <InputNumber
                                    placeholder={t('sales.unitValuePlaceholder', { defaultValue: 'E din. izmer.' })}
                                    min={0.1}
                                    step={0.1}
                                    value={item.unit_value || 1.0}
                                    onChange={(value) => updateSaleItem(globalIndex, 'unit_value', value || 1.0)}
                                    style={{ width: '100%' }}
                                  />
                                </Form.Item>
                              </Col>
                              <Col flex="120px">
                                <Form.Item
                                  required
                                  style={{ marginBottom: 0 }}
                                >
                                  <InputNumber
                                    placeholder={t('common.price')}
                                    min={0}
                                    step={0.01}
                                    value={item.unit_price || undefined}
                                    onChange={(value) => updateSaleItem(globalIndex, 'unit_price', value || 0)}
                                    style={{ width: '100%' }}
                                  />
                                </Form.Item>
                              </Col>
                              <Col flex="120px">
                                <Form.Item
                                  style={{ marginBottom: 0 }}
                                >
                                  <InputNumber
                                    placeholder="Сумма"
                                    value={item.quantity * item.unit_price * (item.unit_value || 1.0)}
                                    disabled
                                    style={{ width: '100%', backgroundColor: '#f5f5f5' }}
                                  />
                                </Form.Item>
                              </Col>
                              <Col flex="40px">
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => removeSaleItem(globalIndex)}
                                />
                              </Col>
                            </Row>
                          </div>
                        );
                      })}
                      
                      {/* Кнопка добавления строки для этого товара */}
                      <Button
                        type="dashed"
                        size="small"
                        onClick={() => {
                          const newItem: CreateSaleItemLocal = {
                            product_id: group.productId,
                            quantity: 1,
                            unit_price: group.product?.selling_price || 0,
                            unit_value: 1.0,
                            stock_item_id: undefined,
                            style_id: undefined,
                          };
                          setSaleItems([...saleItems, newItem]);
                        }}
                        style={{ width: '100%' }}
                      >
                        + {t('sales.addRowForProduct')}
                      </Button>
                    </Card>
                  ))}
                </Form.Item>

                <div style={{ marginBottom: 16 }}>
                  <Button
                    type="dashed"
                    onClick={addSaleItem}
                    icon={<PlusOutlined />}
                    block
                  >
                    {t('sales.addItem', { defaultValue: 'Добавить позицию' })}
                  </Button>
                </div>

                <div style={{ textAlign: 'right', fontSize: 18, fontWeight: 'bold', marginBottom: 24 }}>
                  {t('common.total')}: {saleItems.reduce((sum, item) => sum + (item.quantity * item.unit_price * (item.unit_value || 1.0)), 0).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                </div>

                <Form.Item style={{ marginTop: 24 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={creating}
                    icon={<SaveOutlined />}
                    block
                    size="large"
                  >
                    {t('sales.createSale', { defaultValue: 'Создать продажу' })}
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
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>{t('sales.title')}</Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <Modal
        title={`${t('sales.sale')} #${selectedSale?.id} - ${t('common.details')}`}
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
                  {t('common.total')}: {selectedSale.total_amount.toLocaleString()}
                </Tag>
              </Col>
              <Col span={6}>
                <Tag color={selectedSale.payment_status === 'PAID' ? 'green' : selectedSale.payment_status === 'PARTIAL' ? 'blue' : 'orange'}>
                  {selectedSale.payment_status === 'PAID' ? t('sales.paid', { defaultValue: 'Оплачено' }) : selectedSale.payment_status === 'PARTIAL' ? t('sales.partial', { defaultValue: 'Частично' }) : t('sales.debt', { defaultValue: 'Долг' })}
                </Tag>
              </Col>
            </Row>
            
            {selectedSale.payment_status === 'PARTIAL' && (selectedSale.cash_amount > 0 || selectedSale.electronic_amount > 0) && (
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title={t('sales.cashAmount', { defaultValue: 'Наличные' })}
                      value={selectedSale.cash_amount}
                      precision={2}
                      valueStyle={{ color: '#52c41a' }}
                      suffix={t('common.currency', { defaultValue: 'TJS' })}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title={t('sales.electronicAmount', { defaultValue: 'Электронные' })}
                      value={selectedSale.electronic_amount}
                      precision={2}
                      valueStyle={{ color: '#1890ff' }}
                      suffix={t('common.currency', { defaultValue: 'TJS' })}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title={t('sales.remainingAmount', { defaultValue: 'Осталось к оплате' })}
                      value={selectedSale.total_amount - (selectedSale.cash_amount + selectedSale.electronic_amount)}
                      precision={2}
                      valueStyle={{ color: '#ff4d4f' }}
                      suffix={t('common.currency', { defaultValue: 'TJS' })}
                    />
                  </Card>
                </Col>
              </Row>
            )}
            
            {loadingSaleDetails ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin size="large" />
                <div style={{ marginTop: 8 }}>{t('common.loading')}...</div>
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
        title={`${t('sales.overdueSale', { defaultValue: 'Просроченная продажа' })} #${selectedOverdueSale?.id} - ${t('common.details')}`}
        open={overdueDetailModalVisible}
        onCancel={() => setOverdueDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedOverdueSale && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Tag color="blue" icon={<CalendarOutlined />}>
                  {new Date(selectedOverdueSale.created_at).toLocaleDateString()}
                </Tag>
              </Col>
              <Col span={6}>
                <Tag color="green" icon={<UserOutlined />}>
                  {selectedOverdueSale.customer_name}
                </Tag>
              </Col>
              <Col span={6}>
                <Tag color="red" icon={<DollarOutlined />}>
                  {t('common.total')}: {selectedOverdueSale.total_amount.toLocaleString()}
                </Tag>
              </Col>
              <Col span={6}>
                <Tag color="red">
                  {t('sales.debt', { defaultValue: 'Долг' })}
                </Tag>
              </Col>
            </Row>
            
            {selectedOverdueSale.debt_deadline && (
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <Tag color="orange" icon={<CalendarOutlined />}>
                    {t('sales.debtDeadline', { defaultValue: 'Срок долга' })}: {new Date(selectedOverdueSale.debt_deadline).toLocaleDateString()}
                  </Tag>
                </Col>
                <Col span={12}>
                  {(() => {
                    const deadline = dayjs(selectedOverdueSale.debt_deadline);
                    const now = dayjs();
                    const daysOverdue = now.diff(deadline, 'day');
                    return (
                      <Tag color={daysOverdue > 0 ? 'red' : 'green'}>
                        {daysOverdue > 0 ? `+${daysOverdue} ${t('common.days', { defaultValue: 'дней' })} просрочки` : 'Не просрочено'}
                      </Tag>
                    );
                  })()}
                </Col>
              </Row>
            )}
            
            {loadingOverdueDetails ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin size="large" />
                <div style={{ marginTop: 8 }}>{t('common.loading')}...</div>
              </div>
            ) : (
              <Table
                columns={itemColumns}
                dataSource={selectedOverdueSale.items || []}
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
        title={t('sales.stockErrorTitle', { defaultValue: 'Недостаточно товара на складе' })}
        open={stockErrorModal.visible}
        onCancel={() => setStockErrorModal({ visible: false, productName: '' })}
        footer={[
          <Button key="ok" type="primary" onClick={() => setStockErrorModal({ visible: false, productName: '' })}>
            {t('common.ok', { defaultValue: 'Понятно' })}
          </Button>
        ]}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 16, marginBottom: 16 }}>
            <span style={{ color: '#ff4d4f', fontSize: 24 }}>⚠️</span>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.5 }}>
            {t('sales.stockErrorMessage', { defaultValue: `Недостаточно товара "${stockErrorModal.productName}" на складе.` })}
          </p>
          <p style={{ fontSize: 14, color: '#666', marginTop: 12 }}>
            {t('sales.stockErrorHint', { defaultValue: 'Пожалуйста, проверьте остатки или пополните склад через приходы.' })}
          </p>
        </div>
      </Modal>

      <Modal
        title={t('sales.edit')}
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
              label={t('sales.customer')}
              name="customer_id"
            >
              <Select placeholder={t('sales.selectCustomer', { defaultValue: 'Выберите клиента' })} prefix={<UserOutlined />}>
                {customers.map(customer => (
                  <Option key={customer.id} value={customer.id}>
                    {customer.full_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={t('sales.paymentStatus', { defaultValue: 'Payment Status' })}
              name="payment_status"
              rules={[{ required: true, message: t('sales.selectPaymentStatus', { defaultValue: 'Choose payment status' }) }]}
            >
              <Select placeholder={t('sales.selectPaymentStatus')}>
                <Option value="PAID">{t('sales.paid', { defaultValue: 'Оплачено' })}</Option>
                <Option value="PARTIAL">{t('sales.partial', { defaultValue: 'Частично' })}</Option>
                <Option value="DEBT">{t('sales.debt', { defaultValue: 'В долг' })}</Option>
              </Select>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.payment_status !== currentValues.payment_status}
            >
              {({ getFieldValue }) => {
                const paymentStatus = getFieldValue('payment_status');
                if (paymentStatus === 'PAID' || paymentStatus === 'PARTIAL') {
                  return (
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          label={t('sales.cashAmount', { defaultValue: 'Наличные' })}
                          name="cash_amount"
                        >
                          <InputNumber
                            placeholder={t('sales.cashAmountPlaceholder', { defaultValue: 'Сумма наличными' })}
                            min={0}
                            step={0.01}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label={t('sales.electronicAmount', { defaultValue: 'Электронные' })}
                          name="electronic_amount"
                        >
                          <InputNumber
                            placeholder={t('sales.electronicAmountPlaceholder', { defaultValue: 'Сумма электронными' })}
                            min={0}
                            step={0.01}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  );
                }
                return null;
              }}
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.payment_status !== currentValues.payment_status}
            >
              {({ getFieldValue }) => {
                const paymentStatus = getFieldValue('payment_status');
                if (paymentStatus === 'DEBT' || paymentStatus === 'PARTIAL') {
                  return (
                    <Form.Item
                      label={t('sales.debtDeadline', { defaultValue: 'Срок долга' })}
                      name="debt_deadline"
                    >
                      <DatePicker
                        placeholder={t('sales.selectDebtDeadline', { defaultValue: 'Выберите срок долга' })}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  );
                }
                return null;
              }}
            </Form.Item>

            <div style={{ marginBottom: 16 }}>
              <Title level={5}>{t('sales.items')}</Title>
              {editSaleItems.map((item, index) => (
                <Row key={index} gutter={[8, 8]} style={{ marginBottom: 8 }} align="middle">
                  <Col flex="auto">
                    <Select
                      placeholder={t('sales.selectProduct', { defaultValue: 'Choose product' })}
                      value={item.product_id || undefined}
                      onChange={(value) => {
                        const newItems = [...editSaleItems];
                        const selected = products.find(p => p.id === value);
                        newItems[index] = {
                          ...newItems[index],
                          product_id: value,
                          stock_item_id: selected?.type === 'batch' ? undefined : newItems[index].stock_item_id,
                          unit_price: selected?.selling_price || newItems[index].unit_price,
                        };
                        setEditSaleItems(newItems);
                        if (selected?.type === 'batch') {
                          fetchProductStockItems(value);
                        }
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
                  {(() => {
                    const selectedProduct = products.find(p => p.id === item.product_id);
                    if (selectedProduct?.type !== 'batch') return null;
                    const stockItems = productStockItems[item.product_id] || [];
                    return (
                      <Col flex="180px">
                        <Select
                          placeholder={t('sales.batch')}
                          value={item.stock_item_id}
                          onChange={(value) => {
                            const newItems = [...editSaleItems];
                            newItems[index] = { ...newItems[index], stock_item_id: value };
                            
                            // Auto-populate unit_price from selected batch selling_price
                            if (value) {
                              const stockItems = productStockItems[item.product_id] || [];
                              const selectedBatch = stockItems.find(si => si.id === value);
                              if (selectedBatch?.selling_price) {
                                newItems[index].unit_price = selectedBatch.selling_price;
                              }
                            }
                            
                            setEditSaleItems(newItems);
                          }}
                          loading={loadingStockItems[item.product_id]}
                          allowClear
                          style={{ width: '100%' }}
                        >
                          {stockItems.map(si => (
                            <Option key={si.id} value={si.id}>
                              {si.batch_code} ({t('sales.remaining')} {si.quantity}) - {si.selling_price ? si.selling_price.toLocaleString() : '0'} TJS
                            </Option>
                          ))}
                        </Select>
                      </Col>
                    );
                  })()}
                  <Col flex="80px">
                    <InputNumber
                      placeholder={t('sales.quantityPlaceholder', { defaultValue: 'Кол-во' })}
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
                  <Col flex="100px">
                    <InputNumber
                      placeholder={t('sales.unitValuePlaceholder', { defaultValue: 'E din. izmer.' })}
                      min={0.1}
                      step={0.1}
                      value={item.unit_value || 1.0}
                      onChange={(value) => {
                        const newItems = [...editSaleItems];
                        newItems[index] = { ...newItems[index], unit_value: value || 1.0 };
                        setEditSaleItems(newItems);
                      }}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col flex="120px">
                    <InputNumber
                      placeholder={t('common.price')}
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
                  <Col flex="120px">
                    <InputNumber
                      placeholder="Сумма"
                      value={item.quantity * item.unit_price * (item.unit_value || 1.0)}
                      disabled
                      style={{ width: '100%', backgroundColor: '#f5f5f5' }}
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
                  setEditSaleItems([...editSaleItems, { product_id: 0, quantity: 1, unit_price: 0, unit_value: 1.0, stock_item_id: undefined }]);
                }}
                icon={<PlusOutlined />}
                style={{ width: '100%', marginTop: 8 }}
              >
                {t('sales.addProduct', { defaultValue: 'Добавить товар' })}
              </Button>
            </div>

            <div style={{ textAlign: 'right', fontSize: 18, fontWeight: 'bold' }}>
              {t('common.total', { defaultValue: 'Итого' })}: {editSaleItems.reduce((sum, item) => sum + (item.quantity * item.unit_price * (item.unit_value || 1.0)), 0).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
            </div>
          </Form>
        </Spin>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        title={false}
        open={receiptModalVisible}
        onCancel={() => {
          setReceiptModalVisible(false);
          setSelectedReceiptSale(null);
        }}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrintReceipt}>
            {t('common.print', { defaultValue: 'Print' })}
          </Button>,
          <Button key="close" onClick={() => {
            setReceiptModalVisible(false);
            setSelectedReceiptSale(null);
          }}>
            {t('common.close')}
          </Button>
        ]}
        width={'fit-content'}
        className="receipt-modal"
      >
        {selectedReceiptSale && (
          <div className="receipt-content">
            {loadingSaleDetails ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" />
                <div style={{ marginTop: 8, fontFamily: 'Arial, sans-serif' }}>{t('common.loading')}...</div>
              </div>
            ) : (
              <>
                {/* Receipt Items */}
                <div style={{ marginBottom: 20 }}>
                  {selectedReceiptSale.items && selectedReceiptSale.items.length > 0 ? (
                    (() => {
                      // Group items by product name
                      const grouped = selectedReceiptSale.items.reduce((acc, item) => {
                        if (!acc[item.product_name]) {
                          acc[item.product_name] = [];
                        }
                        acc[item.product_name].push(item);
                        return acc;
                      }, {} as Record<string, typeof selectedReceiptSale.items>);

                      return Object.entries(grouped).map(([productName, items]) => (
                        <div key={productName} style={{ marginBottom: 12 }}>
                          <div style={{
                            fontWeight: 600,
                            color: '#222',
                            marginBottom: 4,
                            textAlign: 'center'
                          }}>
                            {productName}
                          </div>
                          {items.map((item, idx) => (
                            <div key={idx} style={{
                              textAlign: 'left',
                              color: '#666',
                              fontSize: '16px',
                              marginBottom: 2
                            }}>
                              {item.quantity}{item.unit_value ? `×${item.unit_value}` : ''} {item.style_name ? `(${item.style_name})` : ''} × {item.unit_price.toLocaleString()} = {(item.quantity * item.unit_price * (item.unit_value || 1.0)).toLocaleString()}
                            </div>
                          ))}
                        </div>
                      ));
                    })()
                  ) : (
                    <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                      {t('sales.noItems', { defaultValue: 'No items in this sale' })}
                    </div>
                  )}
                </div>

                {/* Receipt Total */}
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: 20, 
                  fontSize: '20px', 
                  fontWeight: 600, 
                  color: '#222' 
                }}>
                  {t('common.totalAmount', { defaultValue: 'Total Amount' })}: {selectedReceiptSale.total_amount.toLocaleString()}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Stage History Modal */}
      <Modal
        title={`${t('sales.stageHistory', { defaultValue: 'История этапов' })} ${selectedSaleForStage ? `#${selectedSaleForStage.id}` : ''}`}
        open={stageHistoryModalVisible}
        onCancel={() => setStageHistoryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setStageHistoryModalVisible(false)}>
            {t('common.close', { defaultValue: 'Закрыть' })}
          </Button>,
        ]}
        width={600}
      >
        {loadingStageHistory ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Spin size="large" />
          </div>
        ) : stageHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#8c8c8c' }}>
            {t('sales.noStageHistory', { defaultValue: 'Нет истории изменений этапов' })}
          </div>
        ) : (
          <Table
            dataSource={stageHistory}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              {
                title: t('common.date', { defaultValue: 'Дата' }),
                dataIndex: 'created_at',
                key: 'created_at',
                render: (date: string) => new Date(date).toLocaleString(),
              },
              {
                title: t('sales.fromStage', { defaultValue: 'С' }),
                dataIndex: 'from_stage',
                key: 'from_stage',
                render: (stage: SaleStage) => getStageTag(stage),
              },
              {
                title: t('sales.toStage', { defaultValue: 'На' }),
                dataIndex: 'to_stage',
                key: 'to_stage',
                render: (stage: SaleStage) => getStageTag(stage),
              },
              {
                title: t('sales.changedBy', { defaultValue: 'Изменил' }),
                dataIndex: 'changed_by_username',
                key: 'changed_by_username',
              },
            ]}
          />
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        title={t('sales.addPayment', { defaultValue: 'Добавить оплату' })}
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        onOk={handleAddPayment}
        confirmLoading={addingPayment}
        okText={t('common.add', { defaultValue: 'Добавить' })}
        cancelText={t('common.cancel', { defaultValue: 'Отмена' })}
      >
        {selectedSaleForPayment && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>{t('sales.saleInfo', { defaultValue: 'Информация о продаже' })}:</Text>
              <div style={{ marginTop: 8 }}>
                <div>{t('common.totalAmount', { defaultValue: 'Общая сумма' })}: <Text strong>{selectedSaleForPayment.total_amount.toLocaleString()} TJS</Text></div>
                <div>{t('sales.cashAmount', { defaultValue: 'Наличные' })}: <Text style={{ color: '#52c41a' }}>{selectedSaleForPayment.cash_amount.toLocaleString()} TJS</Text></div>
                <div>{t('sales.electronicAmount', { defaultValue: 'Электронные' })}: <Text style={{ color: '#1890ff' }}>{selectedSaleForPayment.electronic_amount.toLocaleString()} TJS</Text></div>
                <div>{t('sales.remainingAmount', { defaultValue: 'Осталось' })}: <Text style={{ color: '#ff4d4f' }}>{(selectedSaleForPayment.total_amount - (selectedSaleForPayment.cash_amount + selectedSaleForPayment.electronic_amount)).toLocaleString()} TJS</Text></div>
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Text strong>{t('sales.paymentAmount', { defaultValue: 'Сумма оплаты' })}:</Text>
              </label>
              <InputNumber
                style={{ width: '100%' }}
                min={0.01}
                max={selectedSaleForPayment.total_amount - (selectedSaleForPayment.cash_amount + selectedSaleForPayment.electronic_amount)}
                precision={2}
                value={paymentAmount}
                onChange={(value) => setPaymentAmount(value || 0)}
                suffix="TJS"
              />
            </div>

                      </div>
        )}
      </Modal>
    </div>
  );
};
