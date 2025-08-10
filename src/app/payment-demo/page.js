'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PaymentForm from '../../components/PaymentForm';
import SubscriptionPlans from '../../components/SubscriptionPlans';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function PaymentDemoPage() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('payments');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(null);

  // Mock order data for demo
  const mockOrder = {
    _id: 'order123',
    total: 1500,
    items: [
      {
        product: {
          title: 'Fresh Tomatoes',
          price: 50
        },
        qty: 30
      }
    ],
    status: 'PLACED'
  };

  // Mock current subscription for demo
  const mockCurrentSubscription = {
    plan: 'BASIC',
    status: 'ACTIVE',
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  };

  const handlePaymentSuccess = (payment) => {
    setPaymentSuccess(payment);
    setTimeout(() => setPaymentSuccess(null), 5000);
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
  };

  const handlePlanSelect = (planData) => {
    setSelectedPlan(planData);
  };

  const handleSubscriptionSubmit = async () => {
    if (!selectedPlan) return;

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...selectedPlan,
          paymentMethod: 'BANK_TRANSFER'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Subscription creation failed');
      }

      setSubscriptionSuccess(result.subscription);
      setTimeout(() => setSubscriptionSuccess(null), 5000);
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('payments.title')} & {t('subscriptions.title')} Demo
            </h1>
            <p className="text-gray-600 mt-2">
              {t('payments.demoDescription')}
            </p>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Success Messages */}
        {paymentSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  {t('payments.success.title')}
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  {t('payments.success.message', { 
                    amount: paymentSuccess.amount,
                    method: paymentSuccess.paymentMethod 
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {subscriptionSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  {t('subscriptions.success.title')}
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  {t('subscriptions.success.message', { 
                    plan: subscriptionSuccess.plan,
                    amount: subscriptionSuccess.amount 
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setSelectedTab('payments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('payments.title')}
            </button>
            <button
              onClick={() => setSelectedTab('subscriptions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'subscriptions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('subscriptions.title')}
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div>
            {selectedTab === 'payments' ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {t('payments.demoTitle')}
                </h2>
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('payments.orderDetails')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('payments.orderId')}:</span>
                      <span className="font-medium">{mockOrder._id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('payments.orderStatus')}:</span>
                      <span className="font-medium">{mockOrder.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('payments.orderTotal')}:</span>
                      <span className="font-bold text-lg">₹{mockOrder.total}</span>
                    </div>
                  </div>
                </div>
                <PaymentForm
                  order={mockOrder}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {t('subscriptions.demoTitle')}
                </h2>
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('subscriptions.currentSubscription')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('subscriptions.plan')}:</span>
                      <span className="font-medium">{mockCurrentSubscription.plan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('subscriptions.status')}:</span>
                      <span className="font-medium">{mockCurrentSubscription.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('subscriptions.expires')}:</span>
                      <span className="font-medium">
                        {mockCurrentSubscription.endDate.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <SubscriptionPlans
                  onPlanSelect={handlePlanSelect}
                  currentSubscription={mockCurrentSubscription}
                />
              </div>
            )}
          </div>

          {/* Right Column - Instructions */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedTab === 'payments' ? t('payments.instructions.title') : t('subscriptions.instructions.title')}
              </h3>
              
              {selectedTab === 'payments' ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      {t('payments.instructions.features')}
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• {t('payments.instructions.cod')}</li>
                      <li>• {t('payments.instructions.bankTransfer')}</li>
                      <li>• {t('payments.instructions.commission')}</li>
                      <li>• {t('payments.instructions.payouts')}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      {t('payments.instructions.api')}
                    </h4>
                    <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                      POST /api/payments<br />
                      GET /api/payments<br />
                      PUT /api/payments/[id]
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      {t('subscriptions.instructions.features')}
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• {t('subscriptions.instructions.plans')}</li>
                      <li>• {t('subscriptions.instructions.billing')}</li>
                      <li>• {t('subscriptions.instructions.features')}</li>
                      <li>• {t('subscriptions.instructions.analytics')}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      {t('subscriptions.instructions.api')}
                    </h4>
                    <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                      POST /api/subscriptions<br />
                      GET /api/subscriptions<br />
                      GET /api/admin/revenue
                    </div>
                  </div>
                  {selectedPlan && (
                    <div className="mt-6">
                      <button
                        onClick={handleSubscriptionSubmit}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {t('subscriptions.createSubscription')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
