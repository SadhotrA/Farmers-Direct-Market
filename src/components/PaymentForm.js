'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Banknote, Smartphone, Building2, CheckCircle, AlertCircle } from 'lucide-react';

const PaymentForm = ({ order, onPaymentSuccess, onPaymentError, className = '' }) => {
  const { t } = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transferDetails, setTransferDetails] = useState({
    transactionId: '',
    bankName: '',
    accountNumber: '',
    amount: ''
  });

  const paymentMethods = [
    {
      id: 'COD',
      name: t('payments.methods.cod'),
      description: t('payments.methods.codDesc'),
      icon: Banknote,
      available: true
    },
    {
      id: 'BANK_TRANSFER',
      name: t('payments.methods.bankTransfer'),
      description: t('payments.methods.bankTransferDesc'),
      icon: Building2,
      available: true
    },
    {
      id: 'STRIPE',
      name: t('payments.methods.stripe'),
      description: t('payments.methods.stripeDesc'),
      icon: CreditCard,
      available: false // Placeholder for future implementation
    },
    {
      id: 'RAZORPAY',
      name: t('payments.methods.razorpay'),
      description: t('payments.methods.razorpayDesc'),
      icon: Smartphone,
      available: false // Placeholder for future implementation
    }
  ];

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const paymentData = {
        orderId: order._id,
        paymentMethod,
        ...(paymentMethod === 'BANK_TRANSFER' && { transferDetails })
      };

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('payments.errors.submissionFailed'));
      }

      onPaymentSuccess(result.payment);
    } catch (err) {
      setError(err.message);
      onPaymentError?.(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferDetailsChange = (field, value) => {
    setTransferDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!order) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>{t('payments.errors.noOrder')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('payments.title')}
        </h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">{t('payments.orderTotal')}:</span>
            <span className="font-semibold text-lg">₹{order.total}</span>
          </div>
          <div className="text-sm text-gray-500">
            {t('payments.commissionNote', { percentage: 5 })}
          </div>
        </div>
      </div>

      <form onSubmit={handlePaymentSubmit} className="space-y-6">
        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t('payments.selectMethod')}
          </label>
          <div className="grid gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <label
                  key={method.id}
                  className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={!method.available}
                    className="sr-only"
                  />
                  <Icon className="w-6 h-6 text-gray-600 mr-3" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                      {!method.available && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {t('payments.comingSoon')}
                        </span>
                      )}
                    </div>
                  </div>
                  {paymentMethod === method.id && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Bank Transfer Details */}
        {paymentMethod === 'BANK_TRANSFER' && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-gray-900">{t('payments.bankTransferDetails')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('payments.transactionId')}
                </label>
                <input
                  type="text"
                  value={transferDetails.transactionId}
                  onChange={(e) => handleTransferDetailsChange('transactionId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('payments.transactionIdPlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('payments.bankName')}
                </label>
                <input
                  type="text"
                  value={transferDetails.bankName}
                  onChange={(e) => handleTransferDetailsChange('bankName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('payments.bankNamePlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('payments.accountNumber')}
                </label>
                <input
                  type="text"
                  value={transferDetails.accountNumber}
                  onChange={(e) => handleTransferDetailsChange('accountNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('payments.accountNumberPlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('payments.transferAmount')}
                </label>
                <input
                  type="number"
                  value={transferDetails.amount}
                  onChange={(e) => handleTransferDetailsChange('amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={order.total}
                  min={order.total}
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!paymentMethod || loading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            !paymentMethod || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {t('payments.processing')}
            </div>
          ) : (
            t('payments.proceedToPayment')
          )}
        </button>
      </form>
    </div>
  );
};

export default PaymentForm;
