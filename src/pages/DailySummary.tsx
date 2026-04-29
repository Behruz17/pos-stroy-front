import { useEffect, useState } from 'react';
import { Typography, Card, message, DatePicker, Button, Statistic, Row, Col, Spin, Tag, InputNumber, Space, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { 
  DollarOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  WalletOutlined,
  SaveOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { reportsApi, type DailyBalance } from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;

export const DailySummaryPage = () => {
  const { t } = useTranslation();
  
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [usdRate, setUsdRate] = useState<number>(10.5);
  const [dailyData, setDailyData] = useState<DailyBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fromCache, setFromCache] = useState<boolean | undefined>(undefined);
  
  const fetchDailySummary = async (forceRecalculate = false) => {
    setLoading(true);
    try {
      const date = selectedDate.format('YYYY-MM-DD');
      const data = await reportsApi.getDailyBalance(date, usdRate, forceRecalculate);
      setDailyData(data);
      setFromCache(data.from_cache);
    } catch (error) {
      message.error(t('dailySummary.errorLoading', { defaultValue: 'Ошибка при загрузке итога дня' }));
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveDailyBalance = async () => {
    setSaving(true);
    try {
      const date = selectedDate.format('YYYY-MM-DD');
      const response = await reportsApi.saveDailyBalance({ date, usd_rate: usdRate });
      message.success(t('dailySummary.savedSuccess', { defaultValue: 'Итог дня сохранен' }));
      setDailyData(response.data);
      setFromCache(true);
    } catch (error) {
      message.error(t('dailySummary.errorSaving', { defaultValue: 'Ошибка при сохранении' }));
    } finally {
      setSaving(false);
    }
  };
  
  useEffect(() => {
    fetchDailySummary();
  }, [selectedDate, usdRate]);
  
  const formatCurrency = (value: number) => {
    return Number(value || 0).toLocaleString('ru-RU', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };
  
  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
        {t('dailySummary.title', { defaultValue: 'Итог дня' })}
      </Title>
      
      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                {t('dailySummary.date', { defaultValue: 'Дата' })}
              </div>
              <DatePicker
                value={selectedDate}
                onChange={(date) => date && setSelectedDate(date)}
                format="DD.MM.YYYY"
                style={{ minWidth: 140 }}
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
                style={{ width: 120 }}
                prefix="$"
              />
            </div>
            
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={() => fetchDailySummary(true)}
              loading={loading}
            >
              {t('dailySummary.recalculate', { defaultValue: 'Пересчитать' })}
            </Button>
            
            <Button 
              type="default" 
              icon={<SaveOutlined />} 
              onClick={handleSaveDailyBalance}
              loading={saving}
              disabled={!dailyData}
            >
              {t('dailySummary.save', { defaultValue: 'Сохранить' })}
            </Button>
          </div>
          
          {fromCache !== undefined && (
            <Tag color={fromCache ? 'blue' : 'orange'}>
              {fromCache 
                ? t('dailySummary.fromCache', { defaultValue: 'Из кэша' })
                : t('dailySummary.calculated', { defaultValue: 'Рассчитано' })
              }
            </Tag>
          )}
        </Space>
      </Card>
      
      <Spin spinning={loading}>
        {dailyData && (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} lg={8}>
                <Card>
                  <Statistic
                    title={t('dailySummary.income', { defaultValue: 'Доходы' })}
                    value={dailyData.income}
                    precision={2}
                    prefix={<ArrowUpOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                    formatter={(value) => formatCurrency(Number(value))}
                    suffix="TJS"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card>
                  <Statistic
                    title={t('dailySummary.expense', { defaultValue: 'Расходы' })}
                    value={dailyData.expense}
                    precision={2}
                    prefix={<ArrowDownOutlined />}
                    valueStyle={{ color: '#ff4d4f' }}
                    formatter={(value) => formatCurrency(Number(value))}
                    suffix="TJS"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card>
                  <Statistic
                    title={t('dailySummary.balance', { defaultValue: 'Баланс' })}
                    value={dailyData.balance}
                    precision={2}
                    prefix={<WalletOutlined />}
                    valueStyle={{ color: dailyData.balance >= 0 ? '#52c41a' : '#ff4d4f' }}
                    formatter={(value) => formatCurrency(Number(value))}
                    suffix="TJS"
                  />
                </Card>
              </Col>
            </Row>
            
            <Card title={t('dailySummary.usdConversion', { defaultValue: 'Конвертация в USD' })}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Statistic
                    title={t('dailySummary.balanceUsd', { defaultValue: 'Баланс в USD' })}
                    value={dailyData.balance_usd}
                    precision={2}
                    prefix={<DollarOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                    formatter={(value) => formatCurrency(Number(value))}
                    suffix="USD"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                      {t('dailySummary.usedRate', { defaultValue: 'Использованный курс' })}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                      1 USD = {dailyData.usd_rate} TJS
                    </div>
                  </div>
                </Col>
              </Row>
              <Divider />
              <div style={{ fontSize: 12, color: '#888' }}>
                {t('dailySummary.calculationFormula', { defaultValue: 'Формула: Баланс / Курс USD = Баланс USD' })}
                <br />
                {formatCurrency(dailyData.balance)} / {dailyData.usd_rate} = {formatCurrency(dailyData.balance_usd)} USD
              </div>
            </Card>
          </>
        )}
      </Spin>
    </div>
  );
};
