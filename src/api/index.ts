// API client and utilities
export { apiClient, getToken, setToken, removeToken, getUser, setUser, removeUser, isAuthenticated } from './client';

// API modules
export { authApi } from './auth';
export { usersApi } from './users';
export { suppliersApi } from './suppliers';
export { productsApi } from './products';
export { stockItemsApi } from './stockItems';
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
export { salariesApi } from './salaries';
export { accountsApi } from './accounts';
export { reportsApi } from './reports';
export { conversionsApi } from './conversions';
export { exchangeRatesApi } from './exchangeRates';
export { stylesApi } from './styles';
export { stockAdjustmentsApi } from './stockAdjustments';
export { employeesApi } from './employees';

// Types
export type { User, LoginRequest, LoginResponse, LogoutResponse, RegisterRequest, RegisterResponse } from './types';
export type { UserWithCreated, UpdateUserRequest, UpdateUserResponse, DeleteUserResponse } from './users';
export type { Supplier, CreateSupplierRequest, UpdateSupplierRequest, DeleteSupplierResponse } from './suppliers';
export type { Product, CreateProductRequest, UpdateProductRequest, DeleteProductResponse } from './products';
export type { StockItem, StockItemsByProductResponse } from './stockItems';
export type { Customer, CreateCustomerRequest, UpdateCustomerRequest, DeleteCustomerResponse } from './customers';
export type { StockReceipt, StockReceiptItem, CreateStockReceiptRequest, CreateStockReceiptItem, DeleteStockReceiptResponse } from './stockReceipts';
export type { Sale, SaleItem, SaleStage, CreateSaleRequest, UpdateSaleItem, DeleteSaleResponse, OverdueSale, OverdueSalesSummary, OverdueSaleByCustomer, StageHistoryEntry, UpdateStageRequest, UpdateStageResponse, AddPaymentRequest, AddPaymentResponse } from './sales';
export type { Return, ReturnItem, CreateReturnRequest, CreateReturnItem, DeleteReturnResponse } from './returns';
export type { CustomerPayment, CreateCustomerPaymentRequest, CreateCustomerPaymentResponse } from './customerPayments';
export type { SupplierPayment, CreateSupplierPaymentRequest, CreateSupplierPaymentResponse } from './supplierPayments';
export type { Expense, CreateExpenseRequest, UpdateExpenseRequest, ExpenseFilters, ExpenseRecipient, CreateExpenseRecipientRequest, UpdateExpenseRecipientRequest, SyncRecipientsResponse } from './expenses';
export type { CustomerOperation, CustomerOperationFilters } from './customerOperations';
export type { SupplierOperation, SupplierOperationFilters } from './supplierOperations';
export type { Debtor, CreateDebtorRequest, UpdateDebtorRequest, DebtorFilters } from './debtors';
export type { DebtorOperation, CreateBorrowedRequest, CreateReturnedRequest, DebtorOperationFilters } from './debtorOperations';
export type { Salary, CreateSalaryRequest, CreateSalaryResponse, Payment, CreatePaymentRequest, CreatePaymentResponse, UserSalaryHistory } from './salaries';
export type { Account, AccountTransaction, CreateTransactionRequest, CreateTransactionResponse } from './accounts';
export type { 
  GeneralReportSummary, GeneralReportResponse,
  ReportSale, ReportSaleItem, SalesReportSummary, SalesReportResponse, SalesReportFilters,
  ReportArrival, ReportArrivalItem, ArrivalsReportSummary, ArrivalsReportResponse, ArrivalsReportFilters,
  ReportExpense, ExpensesReportSummary, ExpensesReportResponse, ExpensesReportFilters,
  DailySummary, DailyBalance, SaveDailyBalanceRequest, SaveDailyBalanceResponse,
  AccountWithCurrency, UpdateAccountsBalancesRequest, UpdateAccountsBalancesResponse,
  ConvertCurrencyRequest, ConvertCurrencyResponse, TotalBalanceAccount, TotalBalanceResponse
} from './reports';
export type { Conversion, CreateConversionRequest, CreateConversionResponse, DeleteConversionResponse } from './conversions';
export type { ExchangeRate, UpdateExchangeRateRequest, UpdateExchangeRateResponse, ExchangeRateFilters } from './exchangeRates';
export type { Style, CreateStyleRequest, UpdateStyleRequest } from './styles';
export type { StockAdjustment, CreateStockAdjustment } from './stockAdjustments';
export type { Employee, CreateEmployeeRequest, UpdateEmployeeRequest, EmployeeWithSalaryHistory, DeleteEmployeeResponse } from './employees';
