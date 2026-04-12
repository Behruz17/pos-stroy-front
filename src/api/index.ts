// API client and utilities
export { apiClient, getToken, setToken, removeToken, getUser, setUser, removeUser, isAuthenticated } from './client';

// API modules
export { authApi } from './auth';
export { usersApi } from './users';
export { suppliersApi } from './suppliers';
export { productsApi } from './products';
export { customersApi } from './customers';
export { stockReceiptsApi } from './stockReceipts';
export { salesApi } from './sales';
export { returnsApi } from './returns';
export { customerPaymentsApi } from './customerPayments';
export { supplierPaymentsApi } from './supplierPayments';
export { expensesApi } from './expenses';
export { customerOperationsApi } from './customerOperations';
export { supplierOperationsApi } from './supplierOperations';
export { debtorsApi } from './debtors';
export { debtorOperationsApi } from './debtorOperations';

// Types
export type { User, LoginRequest, LoginResponse, LogoutResponse, RegisterRequest, RegisterResponse } from './types';
export type { UserWithCreated, UpdateUserRequest, UpdateUserResponse, DeleteUserResponse } from './users';
export type { Supplier, CreateSupplierRequest, UpdateSupplierRequest, DeleteSupplierResponse } from './suppliers';
export type { Product, CreateProductRequest, UpdateProductRequest, DeleteProductResponse } from './products';
export type { Customer, CreateCustomerRequest, UpdateCustomerRequest, DeleteCustomerResponse } from './customers';
export type { StockReceipt, StockReceiptItem, CreateStockReceiptRequest, DeleteStockReceiptResponse } from './stockReceipts';
export type { Sale, SaleItem, CreateSaleRequest, UpdateSaleItem, DeleteSaleResponse } from './sales';
export type { Return, ReturnItem, CreateReturnRequest, CreateReturnItem, DeleteReturnResponse } from './returns';
export type { CustomerPayment, CreateCustomerPaymentRequest, CreateCustomerPaymentResponse } from './customerPayments';
export type { SupplierPayment, CreateSupplierPaymentRequest, CreateSupplierPaymentResponse } from './supplierPayments';
export type { Expense, CreateExpenseRequest, UpdateExpenseRequest, ExpenseFilters } from './expenses';
export type { CustomerOperation, CustomerOperationFilters } from './customerOperations';
export type { SupplierOperation, SupplierOperationFilters } from './supplierOperations';
export type { Debtor, CreateDebtorRequest, UpdateDebtorRequest, DebtorFilters } from './debtors';
export type { DebtorOperation, CreateBorrowedRequest, CreateReturnedRequest, DebtorOperationFilters } from './debtorOperations';
