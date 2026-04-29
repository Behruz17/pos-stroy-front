import { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Typography, 
  Card, 
  message, 
  Form, 
  InputNumber, 
  Row, 
  Col, 
  type TableProps, 
  DatePicker, 
  Modal, 
  Select,
  Input,
  Collapse,
  Tag
} from 'antd';
import { useTranslation } from 'react-i18next';
import { 
  DollarOutlined, 
  PlusOutlined, 
  BankOutlined,
  UserOutlined,
  CalendarOutlined,
  MoneyCollectOutlined
} from '@ant-design/icons';
import { 
  salariesApi, 
  accountsApi,
  type CreateSalaryRequest, 
  type CreatePaymentRequest,
  type Account
} from '../api';
import { employeesApi, type Employee, type EmployeeWithSalaryHistory } from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

export const Salaries = () => {
  const { t } = useTranslation();
  const [employeesHistory, setEmployeesHistory] = useState<EmployeeWithSalaryHistory[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [createSalaryModalVisible, setCreateSalaryModalVisible] = useState(false);
  const [createPaymentModalVisible, setCreatePaymentModalVisible] = useState(false);
  const [selectedSalaryId, setSelectedSalaryId] = useState<number | null>(null);
  const [salaryForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(1);

  const fetchAccounts = async () => {
    try {
      const data = await accountsApi.getAll();
      setAccounts(data);
      const cashAccount = data.find(a => a.type === 'CASH' && a.status === 1);
      if (cashAccount) {
        setSelectedAccountId(cashAccount.id);
      } else if (data.length > 0) {
        setSelectedAccountId(data[0].id);
      }
    } catch (error) {
      // Silently fail
    }
  };

  const fetchEmployeesHistory = async () => {
    try {
      const data = await salariesApi.getEmployeesHistory();
      setEmployeesHistory(data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        message.error(t('errors.unauthorized'));
      } else {
        message.error(t('salaries.errorLoading', { defaultValue: 'Ошибка при загрузке зарплат' }));
      }
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await employeesApi.getAll();
      setEmployees(data);
    } catch (error: unknown) {
      message.error(t('salaries.errorLoadingUsers', { defaultValue: 'Erreur lors du chargement des utilisateurs' }));
    }
  };

  useEffect(() => {
    fetchEmployeesHistory();
    fetchEmployees();
    fetchAccounts();
  }, []);

  const handleCreateSalary = async (values: CreateSalaryRequest) => {
    try {
      await salariesApi.createSalary(values);
      message.success(t('salaries.salaryCreated', { defaultValue: 'Salaire créé avec succès' }));
      setCreateSalaryModalVisible(false);
      salaryForm.resetFields();
      fetchEmployeesHistory();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      message.error(axiosError.response?.data?.message || t('salaries.errorCreatingSalary', { defaultValue: 'Erreur lors de la création du salaire' }));
    }
  };

  const handleCreatePayment = async (values: CreatePaymentRequest) => {
    try {
      const paymentData: CreatePaymentRequest = {
        ...values,
        account_id: selectedAccountId
      };
      await salariesApi.createPayment(paymentData);
      message.success(t('salaries.paymentCreated', { defaultValue: 'Paiement créé avec succès' }));
      setCreatePaymentModalVisible(false);
      paymentForm.resetFields();
      setSelectedSalaryId(null);
      fetchEmployeesHistory();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      message.error(axiosError.response?.data?.message || t('salaries.errorCreatingPayment', { defaultValue: 'Erreur lors de la création du paiement' }));
    }
  };

  const openPaymentModal = (salaryId: number) => {
    setSelectedSalaryId(salaryId);
    paymentForm.setFieldsValue({
      salary_id: salaryId,
      payment_date: dayjs()
    });
    setCreatePaymentModalVisible(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getMonthName = (month: number) => {
    const months = [
      t('salaries.months.january', { defaultValue: 'January' }),
      t('salaries.months.february', { defaultValue: 'February' }),
      t('salaries.months.march', { defaultValue: 'March' }),
      t('salaries.months.april', { defaultValue: 'April' }),
      t('salaries.months.may', { defaultValue: 'May' }),
      t('salaries.months.june', { defaultValue: 'June' }),
      t('salaries.months.july', { defaultValue: 'July' }),
      t('salaries.months.august', { defaultValue: 'August' }),
      t('salaries.months.september', { defaultValue: 'September' }),
      t('salaries.months.october', { defaultValue: 'October' }),
      t('salaries.months.november', { defaultValue: 'November' }),
      t('salaries.months.december', { defaultValue: 'December' })
    ];
    return months[month - 1] || '';
  };

  const paymentColumns: TableProps<{ id: number; amount: number; payment_date: string; created_by_name: string }>['columns'] = [
    {
      title: t('salaries.amount', { defaultValue: 'Montant' }),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => formatCurrency(amount),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl']
    },
    {
      title: t('salaries.paymentDate', { defaultValue: 'Date de paiement' }),
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      responsive: ['sm', 'md', 'lg', 'xl']
    },
    {
      title: t('salaries.createdBy', { defaultValue: 'Créé par' }),
      dataIndex: 'created_by_name',
      key: 'created_by_name',
      responsive: ['md', 'lg', 'xl']
    },
    {
      title: t('salaries.createdAt', { defaultValue: 'Créé le' }),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      responsive: ['lg', 'xl']
    }
  ];

  return (
    <div style={{ padding: '0 16px' }}>
      <Row gutter={[16, 16]} justify="space-between" align="middle">
        <Col xs={24} sm={12} md={8}>
          <Title level={2}>
            <DollarOutlined /> {t('salaries.title', { defaultValue: 'Gestion des Salaires' })}
          </Title>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setCreateSalaryModalVisible(true)}
            block
          >
            {t('salaries.createSalary', { defaultValue: 'Créer un salaire' })}
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {employeesHistory.map((employeeHistory) => (
          <Col xs={24} lg={12} xl={8} key={employeeHistory.id}>
            <Card 
              title={
                <Space>
                  <UserOutlined />
                  <span>{employeeHistory.full_name}</span>
                  <Tag color={employeeHistory.total_remaining > 0 ? 'red' : 'green'}>
                    {formatCurrency(employeeHistory.total_remaining)}
                  </Tag>
                </Space>
              }
                          >
              <Collapse ghost>
                {employeeHistory.salaries.map((salary) => (
                  <Panel 
                    header={
                      <Space>
                        <CalendarOutlined />
                        <span>{getMonthName(salary.month)} {salary.year}</span>
                        <Tag color={salary.remaining_amount > 0 ? 'orange' : 'green'}>
                          {formatCurrency(salary.remaining_amount)}
                        </Tag>
                      </Space>
                    }
                    key={salary.salary_id}
                  >
                    <div style={{ marginBottom: 16 }}>
                      <Row gutter={[8, 8]}>
                        <Col xs={12}>
                          <div>
                            <strong>{t('salaries.total', { defaultValue: 'Total:' })}</strong> {formatCurrency(salary.total_amount)}
                          </div>
                        </Col>
                        <Col xs={12}>
                          <div>
                            <strong>{t('salaries.paid', { defaultValue: 'Payé:' })}</strong> {formatCurrency(salary.paid_amount)}
                          </div>
                        </Col>
                      </Row>
                    </div>
                    
                    <div style={{ marginBottom: 16 }}>
                      <Table
                        columns={paymentColumns}
                        dataSource={salary.payments}
                        pagination={false}
                        size="small"
                        scroll={{ x: true }}
                      />
                    </div>

                    {salary.remaining_amount > 0 && (
                      <Button 
                        type="primary" 
                        icon={<MoneyCollectOutlined />}
                        onClick={() => openPaymentModal(salary.salary_id)}
                        block
                      >
                        {t('salaries.addPayment', { defaultValue: 'Ajouter un paiement' })}
                      </Button>
                    )}
                  </Panel>
                ))}
              </Collapse>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Create Salary Modal */}
      <Modal
        title={t('salaries.createSalary', { defaultValue: 'Créer un salaire' })}
        open={createSalaryModalVisible}
        onCancel={() => {
          setCreateSalaryModalVisible(false);
          salaryForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={salaryForm}
          layout="vertical"
          onFinish={handleCreateSalary}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="employee_id"
                label={t('salaries.employee', { defaultValue: 'Сотрудник' })}
                rules={[{ required: true, message: t('salaries.employeeRequired', { defaultValue: 'Пожалуйста, выберите сотрудника' }) }]}
              >
                <Select
                  placeholder={t('salaries.selectUser', { defaultValue: 'Sélectionner un utilisateur' })}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={employees.map(employee => ({
                    label: employee.full_name,
                    value: employee.id
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="month"
                label={t('salaries.month', { defaultValue: 'Mois' })}
                rules={[{ required: true, message: t('salaries.monthRequired', { defaultValue: 'Veuillez sélectionner un mois' }) }]}
              >
                <Select
                  placeholder={t('salaries.selectMonth', { defaultValue: 'Sélectionner un mois' })}
                  options={[
                    { value: 1, label: t('salaries.months.january', { defaultValue: 'January' }) },
                    { value: 2, label: t('salaries.months.february', { defaultValue: 'February' }) },
                    { value: 3, label: t('salaries.months.march', { defaultValue: 'March' }) },
                    { value: 4, label: t('salaries.months.april', { defaultValue: 'April' }) },
                    { value: 5, label: t('salaries.months.may', { defaultValue: 'May' }) },
                    { value: 6, label: t('salaries.months.june', { defaultValue: 'June' }) },
                    { value: 7, label: t('salaries.months.july', { defaultValue: 'July' }) },
                    { value: 8, label: t('salaries.months.august', { defaultValue: 'August' }) },
                    { value: 9, label: t('salaries.months.september', { defaultValue: 'September' }) },
                    { value: 10, label: t('salaries.months.october', { defaultValue: 'October' }) },
                    { value: 11, label: t('salaries.months.november', { defaultValue: 'November' }) },
                    { value: 12, label: t('salaries.months.december', { defaultValue: 'December' }) }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="year"
                label={t('salaries.year', { defaultValue: 'Année' })}
                rules={[{ required: true, message: t('salaries.yearRequired', { defaultValue: 'Veuillez entrer une année' }) }]}
              >
                <InputNumber
                  placeholder={t('salaries.enterYear', { defaultValue: 'Entrer une année' })}
                  min={2000}
                  max={2100}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="total_amount"
                label={t('salaries.totalAmount', { defaultValue: 'Montant total' })}
                rules={[{ required: true, message: t('salaries.amountRequired', { defaultValue: 'Veuillez entrer le montant' }) }]}
              >
                <InputNumber
                  placeholder={t('salaries.enterAmount', { defaultValue: 'Entrer le montant' })}
                  min={0.01}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%' }}
                  addonBefore="EUR"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<BankOutlined />}>
                {t('salaries.create', { defaultValue: 'Créer' })}
              </Button>
              <Button onClick={() => {
                setCreateSalaryModalVisible(false);
                salaryForm.resetFields();
              }}>
                {t('common.cancel', { defaultValue: 'Annuler' })}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Payment Modal */}
      <Modal
        title={t('salaries.createPayment', { defaultValue: 'Créer un paiement' })}
        open={createPaymentModalVisible}
        onCancel={() => {
          setCreatePaymentModalVisible(false);
          paymentForm.resetFields();
          setSelectedSalaryId(null);
        }}
        footer={null}
        width={500}
      >
        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={handleCreatePayment}
          initialValues={{ salary_id: selectedSalaryId }}
        >
          <Form.Item
            name="salary_id"
            hidden
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="amount"
            label={t('salaries.amount', { defaultValue: 'Montant' })}
            rules={[{ required: true, message: t('salaries.amountRequired', { defaultValue: 'Veuillez entrer le montant' }) }]}
          >
            <InputNumber
              placeholder={t('salaries.enterAmount', { defaultValue: 'Entrer le montant' })}
              min={0.01}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
              addonBefore="EUR"
            />
          </Form.Item>
          <Form.Item
            name="payment_date"
            label={t('salaries.paymentDate', { defaultValue: 'Date de paiement' })}
            rules={[{ required: true, message: t('salaries.dateRequired', { defaultValue: 'Veuillez sélectionner une date' }) }]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              format="DD/MM/YYYY HH:mm"
              placeholder={t('salaries.selectDate', { defaultValue: 'Sélectionner une date' })}
            />
          </Form.Item>
          <Form.Item
            label={t('salaries.account', { defaultValue: 'Счет оплаты' })}
          >
            <Select
              value={selectedAccountId}
              onChange={(value) => setSelectedAccountId(value)}
              style={{ width: '100%' }}
            >
              {accounts.map(account => (
                <Option key={account.id} value={account.id}>
                  {account.name} ({account.type === 'CASH' ? t('accounts.cash', { defaultValue: 'Наличные' }) : t('accounts.electronic', { defaultValue: 'Электронный' })}) - {account.current_balance.toLocaleString()}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<MoneyCollectOutlined />}>
                {t('salaries.createPayment', { defaultValue: 'Créer un paiement' })}
              </Button>
              <Button onClick={() => {
                setCreatePaymentModalVisible(false);
                paymentForm.resetFields();
                setSelectedSalaryId(null);
              }}>
                {t('common.cancel', { defaultValue: 'Annuler' })}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
