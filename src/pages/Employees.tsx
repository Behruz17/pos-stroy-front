import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Card, message, Popconfirm, Modal, Form, Input, type TableProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { PlusOutlined, DeleteOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';
import { employeesApi, type Employee } from '../api';

const { Title } = Typography;

export const Employees = () => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await employeesApi.getAll();
      setEmployees(data);
    } catch (error) {
      message.error(t('employees.errorLoading', { defaultValue: 'Ошибка при загрузке сотрудников' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await employeesApi.delete(id);
      message.success(t('employees.employeeDeleted', { defaultValue: 'Сотрудник удален' }));
      fetchEmployees();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      message.error(axiosError.response?.data?.message || t('employees.errorDeleting', { defaultValue: 'Ошибка при удалении' }));
    }
  };

  const handleCreate = async (values: { full_name: string }) => {
    setCreating(true);
    try {
      await employeesApi.create(values);
      message.success(t('employees.employeeCreated', { defaultValue: 'Сотрудник создан' }));
      form.resetFields();
      setModalVisible(false);
      fetchEmployees();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      message.error(axiosError.response?.data?.message || t('employees.errorCreating', { defaultValue: 'Ошибка при создании' }));
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (values: { full_name: string }) => {
    setCreating(true);
    try {
      if (!editingEmployee) return;
      
      await employeesApi.update(editingEmployee.id, values);
      message.success(t('employees.employeeUpdated', { defaultValue: 'Сотрудник обновлен' }));
      form.resetFields();
      setModalVisible(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      message.error(axiosError.response?.data?.message || t('employees.errorUpdating', { defaultValue: 'Ошибка при обновлении' }));
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    form.setFieldsValue({ full_name: employee.full_name });
    setModalVisible(true);
  };

  const openCreateModal = () => {
    setEditingEmployee(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleModalOk = () => {
    if (editingEmployee) {
      form.submit();
    } else {
      form.submit();
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingEmployee(null);
    form.resetFields();
  };

  const columns: TableProps<Employee>['columns'] = [
    {
      title: t('common.number', { defaultValue: '№' }),
      key: 'rowNumber',
      render: (_: unknown, __: unknown, index: number) => index + 1,
      width: 60,
    },
    {
      title: t('employees.fullName', { defaultValue: 'ФИО' }),
      dataIndex: 'full_name',
      key: 'full_name',
      sorter: (a: Employee, b: Employee) => a.full_name.localeCompare(b.full_name),
    },
    {
      title: t('common.actions', { defaultValue: 'Действия' }),
      key: 'actions',
      render: (_: unknown, record: Employee) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
            size="small"
            title={t('common.edit', { defaultValue: 'Изменить' })}
          />
          <Popconfirm
            title={t('employees.deleteConfirm', { defaultValue: 'Вы уверены, что хотите удалить этого сотрудника?' })}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.yes', { defaultValue: 'Да' })}
            cancelText={t('common.no', { defaultValue: 'Нет' })}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
              title={t('common.delete', { defaultValue: 'Удалить' })}
            />
          </Popconfirm>
        </Space>
      ),
      width: 80,
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            {t('employees.title', { defaultValue: 'Сотрудники' })}
          </Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchEmployees} title={t('common.refresh', { defaultValue: 'Обновить' })}>
              {t('common.refresh', { defaultValue: 'Обновить' })}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} title={t('employees.create', { defaultValue: 'Добавить сотрудника' })}>
              {t('employees.create', { defaultValue: 'Добавить сотрудника' })}
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={employees}
          loading={loading}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title={
          editingEmployee
            ? t('employees.editTitle', { defaultValue: 'Редактировать сотрудника' })
            : t('employees.createTitle', { defaultValue: 'Добавить сотрудника' })
        }
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={creating}
        footer={[
          <Button key="cancel" onClick={handleModalCancel}>
            {t('common.cancel', { defaultValue: 'Отмена' })}
          </Button>,
          <Button key="submit" type="primary" loading={creating} onClick={handleModalOk}>
            {editingEmployee
              ? t('common.update', { defaultValue: 'Обновить' })
              : t('common.create', { defaultValue: 'Создать' })}
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingEmployee ? handleUpdate : handleCreate}
          initialValues={{
            full_name: '',
          }}
        >
          <Form.Item
            name="full_name"
            label={t('employees.fullName', { defaultValue: 'ФИО' })}
            rules={[
              { required: true, message: t('employees.nameRequired', { defaultValue: 'Пожалуйста, введите ФИО сотрудника' }) },
              { max: 255, message: t('employees.nameTooLong', { defaultValue: 'ФИО не должно превышать 255 символов' }) },
            ]}
          >
            <Input placeholder={t('employees.enterName', { defaultValue: 'Введите ФИО сотрудника' })} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
