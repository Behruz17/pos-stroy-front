import { useEffect, useState } from 'react';
import { Table, Typography, Card, message, Modal, Tag, Spin, Statistic, Row, Col, Button, DatePicker, InputNumber, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { WalletOutlined, CreditCardOutlined, ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, ReloadOutlined, SwapOutlined, EyeOutlined } from '@ant-design/icons';
import { accountsApi, reportsApi, type Account, type AccountTransaction, type UpdateAccountsBalancesRequest, type ConvertCurrencyRequest, type TotalBalanceResponse } from '../api';
import { Select, Divider, Descriptions } from 'antd';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export const Accounts = () => {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updateDate, setUpdateDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [usdRate, setUsdRate] = useState<number>(10.5);
  const [updating, setUpdating] = useState(false);
  
  // Convert currency modal state
  const [convertModalVisible, setConvertModalVisible] = useState(false);
  const [convertingAccount, setConvertingAccount] = useState<Account | null>(null);
  const [targetCurrency, setTargetCurrency] = useState<'TJS' | 'USD'>('USD');
  const [convertAmount, setConvertAmount] = useState<number | undefined>(undefined);
  const [converting, setConverting] = useState(false);
  
  // Total balance state
  const [totalBalance, setTotalBalance] = useState<TotalBalanceResponse | null>(null);
  const [loadingTotal, setLoadingTotal] = useState(false);
  const [totalBalanceVisible, setTotalBalanceVisible] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await accountsApi.getAll();
      setAccounts(data);
    } catch (error) {
      message.error(t('accounts.errorLoading', { defaultValue: 'Ошибка при загрузке счетов' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchTotalBalance();
  }, []);

  const fetchTotalBalance = async () => {
    setLoadingTotal(true);
    try {
      const data = await reportsApi.getTotalBalance(usdRate);
      setTotalBalance(data);
    } catch (error) {
      console.error('Error fetching total balance:', error);
    } finally {
      setLoadingTotal(false);
    }
  };

  const handleConvertCurrency = async () => {
    if (!convertingAccount) return;
    
    const amountToConvert = convertAmount ?? convertingAccount.current_balance;
    if (amountToConvert <= 0) {
      message.error(t('accounts.invalidAmount', { defaultValue: 'Сумма для конвертации должна быть больше 0' }));
      return;
    }
    
    if (amountToConvert > convertingAccount.current_balance) {
      message.error(t('accounts.insufficientBalance', { defaultValue: `Недостаточно средств. Доступно: ${convertingAccount.current_balance.toLocaleString()} ${convertingAccount.currency}` }));
      return;
    }
    
    if (targetCurrency === convertingAccount.currency) {
      message.error(t('accounts.sameCurrency', { defaultValue: 'Целевая валюта должна отличаться от текущей' }));
      return;
    }
    
    setConverting(true);
    try {
      const data: ConvertCurrencyRequest = {
        target_currency: targetCurrency,
        usd_rate: usdRate,
        amount: amountToConvert,
      };
      const result = await reportsApi.convertCurrency(convertingAccount.id, data);
      message.success(result.message);
      setConvertModalVisible(false);
      setConvertingAccount(null);
      setConvertAmount(undefined);
      fetchAccounts();
      fetchTotalBalance();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || t('accounts.errorConverting', { defaultValue: 'Ошибка при конвертации валюты' });
      message.error(errorMessage);
    } finally {
      setConverting(false);
    }
  };

  const openConvertModal = (account: Account) => {
    setConvertingAccount(account);
    setTargetCurrency(account.currency === 'TJS' ? 'USD' : 'TJS');
    setConvertAmount(undefined);
    setConvertModalVisible(true);
  };

  const handleUpdateBalances = async () => {
    setUpdating(true);
    try {
      const data: UpdateAccountsBalancesRequest = {
        date: updateDate,
        usd_rate: usdRate,
      };
      const result = await reportsApi.updateAccountsBalances(data);
      message.success(t('accounts.balancesUpdated', { defaultValue: 'Балансы обновлены', count: result.accounts_updated }));
      setUpdateModalVisible(false);
      fetchAccounts();
    } catch (error) {
      message.error(t('accounts.errorUpdatingBalances', { defaultValue: 'Ошибка при обновлении балансов' }));
    } finally {
      setUpdating(false);
    }
  };

  const handleViewDetails = async (account: Account) => {
    setLoadingDetails(true);
    try {
      const detailedAccount = await accountsApi.getById(account.id);
      setSelectedAccount(detailedAccount);
      setDetailModalVisible(true);
    } catch (error) {
      message.error(t('accounts.errorLoadingDetails', { defaultValue: 'Ошибка при загрузке деталей счета' }));
    } finally {
      setLoadingDetails(false);
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'INCOME':
        return 'green';
      case 'EXPENSE':
        return 'red';
      case 'TRANSFER':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'INCOME':
        return t('accounts.income', { defaultValue: 'Приход' });
      case 'EXPENSE':
        return t('accounts.expense', { defaultValue: 'Расход' });
      case 'TRANSFER':
        return t('accounts.transfer', { defaultValue: 'Перевод' });
      default:
        return type;
    }
  };

  const getReferenceTypeLabel = (type: string | null) => {
    if (!type) return '';
    switch (type) {
      case 'SALE':
        return t('accounts.sale', { defaultValue: 'Продажа' });
      case 'PURCHASE':
        return t('accounts.purchase', { defaultValue: 'Закупка' });
      case 'SALARY':
        return t('accounts.salary', { defaultValue: 'Зарплата' });
      case 'EXPENSE':
        return t('accounts.expenseOp', { defaultValue: 'Расход' });
      case 'CUSTOMER_PAYMENT':
        return t('accounts.customerPayment', { defaultValue: 'Оплата клиента' });
      case 'SUPPLIER_PAYMENT':
        return t('accounts.supplierPayment', { defaultValue: 'Оплата поставщику' });
      case 'TRANSFER':
        return t('accounts.transferOp', { defaultValue: 'Перевод' });
      default:
        return type;
    }
  };

  const columns = [
    {
      title: t('common.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Account) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {record.type === 'CASH' ? <WalletOutlined /> : <CreditCardOutlined />}
          <span>{name}</span>
        </div>
      ),
    },
    {
      title: t('accounts.type', { defaultValue: 'Тип' }),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'CASH' ? 'green' : 'blue'}>
          {type === 'CASH' ? t('accounts.cash', { defaultValue: 'Наличные' }) : t('accounts.electronic', { defaultValue: 'Электронный' })}
        </Tag>
      ),
    },
    {
      title: t('accounts.initialBalance', { defaultValue: 'Начальный баланс' }),
      dataIndex: 'initial_balance',
      key: 'initial_balance',
      render: (amount: number) => amount?.toLocaleString() ?? '-',
    },
    {
      title: t('accounts.transactionBalance', { defaultValue: 'Транзакции' }),
      dataIndex: 'transaction_balance',
      key: 'transaction_balance',
      render: (amount: number) => (
        <span style={{ color: amount >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {amount >= 0 ? '+' : ''}{amount?.toLocaleString() ?? '-'}
        </span>
      ),
    },
    {
      title: t('accounts.currentBalance', { defaultValue: 'Текущий баланс' }),
      dataIndex: 'current_balance',
      key: 'current_balance',
      render: (amount: number, record: Account) => (
        <div>
          <Text strong style={{ color: amount >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 16 }}>
            {amount.toLocaleString()} {record.currency}
          </Text>
          <div style={{ fontSize: 12, color: '#888' }}>
            ${record.balance_usd?.toLocaleString()} USD
          </div>
        </div>
      ),
    },
    {
      title: t('accounts.currency', { defaultValue: 'Валюта' }),
      dataIndex: 'currency',
      key: 'currency',
      render: (currency: string) => (
        <Tag color={currency === 'TJS' ? 'blue' : currency === 'USD' ? 'green' : 'orange'}>
          {currency}
        </Tag>
      ),
    },
        {
      title: t('common.actions'),
      key: 'actions',
      width: 180,
      render: (_: unknown, record: Account) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)}>
            {t('common.details', { defaultValue: 'Детали' })}
          </Button>
          <Button 
            type="link" 
            icon={<SwapOutlined />} 
            onClick={() => openConvertModal(record)}
            disabled={record.current_balance <= 0}
          >
            {t('accounts.convert', { defaultValue: 'Конвертировать' })}
          </Button>
        </Space>
      ),
    },
  ];

  const transactionColumns = [
    {
      title: t('common.date'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: t('accounts.type', { defaultValue: 'Тип' }),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getTransactionColor(type)}>
          {getTransactionLabel(type)}
        </Tag>
      ),
    },
    {
      title: t('common.amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: AccountTransaction) => (
        <Text strong style={{ color: record.type === 'INCOME' ? '#52c41a' : record.type === 'EXPENSE' ? '#ff4d4f' : '#1890ff' }}>
          {record.type === 'INCOME' ? <ArrowUpOutlined /> : record.type === 'EXPENSE' ? <ArrowDownOutlined /> : ''}
          {' '}
          {record.type === 'INCOME' ? '+' : record.type === 'EXPENSE' ? '-' : ''}{amount.toLocaleString()}
        </Text>
      ),
    },
    {
      title: t('accounts.reference', { defaultValue: 'Ссылка' }),
      dataIndex: 'reference_type',
      key: 'reference_type',
      render: (type: string | null, record: AccountTransaction) => (
        <div>
          {type && (
            <div>
              <Tag>{getReferenceTypeLabel(type)}</Tag>
              {record.reference_id && <span style={{ marginLeft: 4, fontSize: 12 }}>#{record.reference_id}</span>}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      render: (desc: string | null) => desc || '-',
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
        {t('accounts.title', { defaultValue: 'Счета и балансы' })}
      </Title>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title={t('accounts.totalBalance', { defaultValue: 'Общий баланс' })}
              value={accounts.reduce((sum, acc) => sum + Number(acc.current_balance || 0), 0)}
              precision={2}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#3f8600' }}
              loading={loading}
              formatter={(value) => Number(value).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title={t('accounts.cashAccounts', { defaultValue: 'Наличные счета' })}
              value={accounts.filter(a => a.type === 'CASH').length}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#52c41a' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title={t('accounts.electronicAccounts', { defaultValue: 'Электронные счета' })}
              value={accounts.filter(a => a.type === 'ELECTRONIC').length}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: '#1890ff' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Total Balance Section */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: totalBalanceVisible ? 16 : 0 }}>
          <Space>
            <DollarOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <Text strong style={{ fontSize: 16 }}>
              {t('accounts.totalBalanceTitle', { defaultValue: 'Общий баланс всех счетов' })}
            </Text>
            {totalBalance && !totalBalanceVisible && (
              <Tag color="blue">{totalBalance.total_usd.toLocaleString()} USD</Tag>
            )}
          </Space>
          <Space>
            <Button 
              type={totalBalanceVisible ? 'default' : 'primary'}
              icon={<EyeOutlined />}
              onClick={() => setTotalBalanceVisible(!totalBalanceVisible)}
              loading={loadingTotal}
            >
              {totalBalanceVisible 
                ? t('common.hide', { defaultValue: 'Скрыть' })
                : t('common.show', { defaultValue: 'Показать' })}
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchTotalBalance}
              loading={loadingTotal}
            />
          </Space>
        </div>
        
        {totalBalanceVisible && totalBalance && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title={t('accounts.totalTjs', { defaultValue: 'Всего в TJS' })}
                  value={totalBalance.total_tjs}
                  precision={2}
                  valueStyle={{ color: '#1890ff' }}
                  formatter={(value) => Number(value).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title={t('accounts.totalUsd', { defaultValue: 'Всего в USD' })}
                  value={totalBalance.total_usd}
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                  formatter={(value) => Number(value).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title={t('accounts.accountsCount', { defaultValue: 'Количество счетов' })}
                  value={totalBalance.accounts_count}
                  valueStyle={{ color: '#666' }}
                />
              </Col>
            </Row>
            
            <Divider style={{ margin: '16px 0' }} />
            
            <Descriptions title={t('accounts.byCurrency', { defaultValue: 'Разбивка по валютам' })} size="small" column={3}>
              {totalBalance.by_currency.TJS !== undefined && (
                <Descriptions.Item label="TJS">{totalBalance.by_currency.TJS.toLocaleString()}</Descriptions.Item>
              )}
              {totalBalance.by_currency.USD !== undefined && (
                <Descriptions.Item label="USD">{totalBalance.by_currency.USD.toLocaleString()}</Descriptions.Item>
              )}
              {totalBalance.by_currency.RUB !== undefined && (
                <Descriptions.Item label="RUB">{totalBalance.by_currency.RUB.toLocaleString()}</Descriptions.Item>
              )}
            </Descriptions>
            
            <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
              {t('accounts.usdRate', { defaultValue: 'Курс USD' })}: {totalBalance.usd_rate}
            </div>
          </>
        )}
      </Card>

      {/* Accounts Table */}
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={() => setUpdateModalVisible(true)}
          >
            {t('accounts.updateBalances', { defaultValue: 'Обновить балансы' })}
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={accounts}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
          size="small"
        />
      </Card>

      {/* Account Detail Modal */}
      <Modal
        title={selectedAccount ? `${t('accounts.account', { defaultValue: 'Счет' })}: ${selectedAccount.name}` : ''}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedAccount(null);
        }}
        footer={null}
        width={900}
      >
        {selectedAccount && (
          <div>
            {/* Account Info */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title={t('accounts.initialBalance', { defaultValue: 'Начальный баланс' })}
                    value={selectedAccount.initial_balance}
                    precision={2}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title={t('accounts.transactionBalance', { defaultValue: 'Баланс транзакций' })}
                    value={selectedAccount.transaction_balance}
                    precision={2}
                    valueStyle={{ color: selectedAccount.transaction_balance >= 0 ? '#52c41a' : '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title={t('accounts.currentBalance', { defaultValue: 'Текущий баланс' })}
                    value={selectedAccount.current_balance}
                    precision={2}
                    valueStyle={{ color: selectedAccount.current_balance >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Transactions Table */}
            <Title level={5} style={{ marginTop: 16, marginBottom: 8 }}>
              {t('accounts.allTransactions', { defaultValue: 'Все транзакции' })}
            </Title>

            {loadingDetails ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" />
                <div style={{ marginTop: 8 }}>{t('common.loading')}...</div>
              </div>
            ) : (
              <Table
                columns={transactionColumns}
                dataSource={selectedAccount.transactions || []}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content' }}
                size="small"
              />
            )}
          </div>
        )}
      </Modal>

      {/* Update Balances Modal */}
      <Modal
        title={t('accounts.updateBalances', { defaultValue: 'Обновить балансы' })}
        open={updateModalVisible}
        onCancel={() => setUpdateModalVisible(false)}
        onOk={handleUpdateBalances}
        confirmLoading={updating}
        okText={t('common.update', { defaultValue: 'Обновить' })}
        cancelText={t('common.cancel', { defaultValue: 'Отмена' })}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
              {t('dailySummary.date', { defaultValue: 'Дата' })}
            </div>
            <DatePicker
              value={dayjs(updateDate)}
              onChange={(date) => date && setUpdateDate(date.format('YYYY-MM-DD'))}
              format="DD.MM.YYYY"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
              {t('dailySummary.usdRate', { defaultValue: 'Курс USD' })}
            </div>
            <InputNumber
              value={usdRate}
              onChange={(value) => setUsdRate(value || 1)}
              min={0.01}
              step={0.1}
              precision={4}
              style={{ width: '100%' }}
              prefix="1 USD ="
              suffix="TJS"
            />
          </div>
        </Space>
      </Modal>

      {/* Convert Currency Modal */}
      <Modal
        title={t('accounts.convertCurrency', { defaultValue: 'Конвертация валюты' })}
        open={convertModalVisible}
        onCancel={() => {
          setConvertModalVisible(false);
          setConvertingAccount(null);
          setConvertAmount(undefined);
        }}
        onOk={handleConvertCurrency}
        confirmLoading={converting}
        okText={t('accounts.convert', { defaultValue: 'Конвертировать' })}
        cancelText={t('common.cancel', { defaultValue: 'Отмена' })}
      >
        {convertingAccount && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                {t('accounts.account', { defaultValue: 'Счет' })}
              </div>
              <Text strong>{convertingAccount.name}</Text>
              <div style={{ fontSize: 12, color: '#888' }}>
                {t('accounts.currentBalance', { defaultValue: 'Текущий баланс' })}: {convertingAccount.current_balance.toLocaleString()} {convertingAccount.currency}
              </div>
            </div>
            
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                {t('accounts.targetCurrency', { defaultValue: 'Целевая валюта' })}
              </div>
              <Select
                value={targetCurrency}
                onChange={(value) => setTargetCurrency(value)}
                style={{ width: '100%' }}
                options={[
                  { label: 'USD', value: 'USD' },
                  { label: 'TJS', value: 'TJS' },
                ]}
              />
            </div>
            
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                {t('dailySummary.usdRate', { defaultValue: 'Курс USD' })}
              </div>
              <InputNumber
                value={usdRate}
                onChange={(value) => setUsdRate(value || 1)}
                min={0.01}
                step={0.1}
                precision={4}
                style={{ width: '100%' }}
                prefix="1 USD ="
                suffix="TJS"
              />
            </div>
            
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                {t('accounts.convertAmount', { defaultValue: 'Сумма для конвертации (пусто = весь баланс)' })}
              </div>
              <InputNumber
                value={convertAmount}
                onChange={(value) => setConvertAmount(value || undefined)}
                min={0.01}
                max={convertingAccount.current_balance}
                step={1}
                precision={2}
                style={{ width: '100%' }}
                placeholder={t('accounts.fullBalance', { defaultValue: 'Весь баланс' })}
              />
            </div>
            
            <div style={{ padding: 12, backgroundColor: '#f6ffed', borderRadius: 4, border: '1px solid #b7eb8f' }}>
              <Text type="success">
                {t('accounts.willConvert', { defaultValue: 'Будет конвертировано' })}: {convertAmount?.toLocaleString() || convertingAccount.current_balance.toLocaleString()} {convertingAccount.currency} → {targetCurrency}
              </Text>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};
