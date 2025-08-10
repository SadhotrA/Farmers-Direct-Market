'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Star, TrendingUp, Users, BarChart3, Headphones } from 'lucide-react';

const SubscriptionPlans = ({ onPlanSelect, currentSubscription, className = '' }) => {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState('MONTHLY');

  const plans = [
    {
      id: 'BASIC',
      name: t('subscriptions.plans.basic.name'),
      price: 299,
      currency: 'INR',
      description: t('subscriptions.plans.basic.description'),
      features: [
        t('subscriptions.features.maxProducts', { count: 10 }),
        t('subscriptions.features.maxImagesPerProduct', { count: 5 }),
        t('subscriptions.features.basicSupport'),
        t('subscriptions.features.standardListing')
      ],
      icon: Users,
      popular: false
    },
    {
      id: 'PREMIUM',
      name: t('subscriptions.plans.premium.name'),
      price: 799,
      currency: 'INR',
      description: t('subscriptions.plans.premium.description'),
      features: [
        t('subscriptions.features.maxProducts', { count: 50 }),
        t('subscriptions.features.maxImagesPerProduct', { count: 10 }),
        t('subscriptions.features.priorityListing'),
        t('subscriptions.features.analytics'),
        t('subscriptions.features.marketingTools'),
        t('subscriptions.features.premiumSupport')
      ],
      icon: Star,
      popular: true
    },
    {
      id: 'ENTERPRISE',
      name: t('subscriptions.plans.enterprise.name'),
      price: 1999,
      currency: 'INR',
      description: t('subscriptions.plans.enterprise.description'),
      features: [
        t('subscriptions.features.maxProducts', { count: 200 }),
        t('subscriptions.features.maxImagesPerProduct', { count: 20 }),
        t('subscriptions.features.priorityListing'),
        t('subscriptions.features.advancedAnalytics'),
        t('subscriptions.features.advancedMarketingTools'),
        t('subscriptions.features.dedicatedSupport'),
        t('subscriptions.features.customFeatures')
      ],
      icon: TrendingUp,
      popular: false
    }
  ];

  const billingCycles = [
    { id: 'MONTHLY', name: t('subscriptions.billing.monthly'), discount: 0 },
    { id: 'QUARTERLY', name: t('subscriptions.billing.quarterly'), discount: 10 },
    { id: 'YEARLY', name: t('subscriptions.billing.yearly'), discount: 20 }
  ];

  const calculatePrice = (basePrice, cycle) => {
    const cycleData = billingCycles.find(c => c.id === cycle);
    if (!cycleData) return basePrice;

    let multiplier = 1;
    switch (cycle) {
      case 'QUARTERLY':
        multiplier = 3;
        break;
      case 'YEARLY':
        multiplier = 12;
        break;
    }

    return Math.round(basePrice * multiplier * (1 - cycleData.discount / 100));
  };

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    onPlanSelect?.({
      plan: planId,
      billingCycle: selectedBillingCycle,
      amount: calculatePrice(plans.find(p => p.id === planId)?.price || 0, selectedBillingCycle)
    });
  };

  const isCurrentPlan = (planId) => {
    return currentSubscription?.plan === planId && currentSubscription?.status === 'ACTIVE';
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Billing Cycle Selection */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('subscriptions.selectBillingCycle')}
        </h3>
        <div className="flex justify-center space-x-4">
          {billingCycles.map((cycle) => (
            <button
              key={cycle.id}
              onClick={() => setSelectedBillingCycle(cycle.id)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                selectedBillingCycle === cycle.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{cycle.name}</div>
              {cycle.discount > 0 && (
                <div className="text-sm text-green-600">
                  {t('subscriptions.save', { percentage: cycle.discount })}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const price = calculatePrice(plan.price, selectedBillingCycle);
          const isCurrent = isCurrentPlan(plan.id);

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-lg shadow-lg border-2 p-6 transition-all ${
                selectedPlan === plan.id
                  ? 'border-blue-500 shadow-xl'
                  : plan.popular
                  ? 'border-yellow-400'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium">
                    {t('subscriptions.mostPopular')}
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {t('subscriptions.currentPlan')}
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">₹{price}</span>
                  <span className="text-gray-500 ml-2">
                    /{t(`subscriptions.billing.${selectedBillingCycle.toLowerCase()}`)}
                  </span>
                </div>
                {selectedBillingCycle !== 'MONTHLY' && (
                  <div className="text-sm text-green-600">
                    {t('subscriptions.originalPrice', { 
                      price: plan.price * (selectedBillingCycle === 'QUARTERLY' ? 3 : 12)
                    })}
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handlePlanSelect(plan.id)}
                disabled={isCurrent}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isCurrent
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : selectedPlan === plan.id
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {isCurrent
                  ? t('subscriptions.currentPlan')
                  : selectedPlan === plan.id
                  ? t('subscriptions.selected')
                  : t('subscriptions.selectPlan')}
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected Plan Summary */}
      {selectedPlan && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-4">
            {t('subscriptions.selectedPlanSummary')}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-blue-600">{t('subscriptions.plan')}</span>
              <p className="font-medium text-blue-900">
                {plans.find(p => p.id === selectedPlan)?.name}
              </p>
            </div>
            <div>
              <span className="text-sm text-blue-600">{t('subscriptions.billingCycle')}</span>
              <p className="font-medium text-blue-900">
                {billingCycles.find(c => c.id === selectedBillingCycle)?.name}
              </p>
            </div>
            <div>
              <span className="text-sm text-blue-600">{t('subscriptions.totalAmount')}</span>
              <p className="font-medium text-blue-900">
                ₹{calculatePrice(plans.find(p => p.id === selectedPlan)?.price || 0, selectedBillingCycle)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
