# Payments & Monetization System

## Overview

The Farmers' Direct Market platform includes a comprehensive payments and monetization system that supports multiple payment methods, commission-based revenue, and subscription plans for farmers.

## Features

### Payment Methods
- **Cash on Delivery (COD)**: Pay when you receive your order
- **Bank Transfer**: Direct bank-to-bank transfers with verification
- **Stripe Integration**: Credit/debit card payments (Phase 2)
- **Razorpay Integration**: UPI and digital payments (Phase 2)
- **PayPal Integration**: International payments (Phase 2)

### Monetization Options
- **Transaction Commission**: 5% commission on all successful transactions
- **Subscription Plans**: Premium features for farmers
- **Lead Fees**: Optional fees for connecting buyers with farmers

### Subscription Plans
- **Basic Plan** (₹299/month): Up to 10 products, 5 images per product
- **Premium Plan** (₹799/month): Up to 50 products, priority listing, analytics
- **Enterprise Plan** (₹1999/month): Up to 200 products, advanced features

## File Structure

```
src/
├── models/
│   ├── Payment.js          # Payment transaction model
│   └── Subscription.js     # Subscription plans model
├── lib/
│   └── payment.js          # Payment utilities and gateway configs
├── app/api/
│   ├── payments/
│   │   ├── route.js        # Payment creation and listing
│   │   └── [id]/route.js   # Individual payment operations
│   ├── subscriptions/
│   │   └── route.js        # Subscription management
│   └── admin/
│       └── revenue/
│           └── route.js    # Revenue analytics
├── components/
│   ├── PaymentForm.js      # Payment form component
│   └── SubscriptionPlans.js # Subscription plans display
└── app/
    └── payment-demo/
        └── page.js         # Demo page for testing
```

## Database Models

### Payment Model
```javascript
{
  order: ObjectId,           // Reference to order
  buyer: ObjectId,           // Reference to buyer
  farmer: ObjectId,          // Reference to farmer
  amount: Number,            // Payment amount
  currency: String,          // Currency (INR, USD, EUR)
  paymentMethod: String,     // COD, BANK_TRANSFER, STRIPE, etc.
  status: String,            // PENDING, COMPLETED, FAILED, etc.
  commission: {
    amount: Number,          // Commission amount
    percentage: Number       // Commission percentage (5%)
  },
  farmerPayout: {
    amount: Number,          // Amount to pay farmer
    status: String,          // PENDING, PROCESSED, FAILED
    processedAt: Date
  },
  gatewayTransactionId: String,
  gatewayResponse: Mixed,
  metadata: Mixed,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Subscription Model
```javascript
{
  farmer: ObjectId,          // Reference to farmer
  plan: String,              // BASIC, PREMIUM, ENTERPRISE
  status: String,            // ACTIVE, CANCELLED, EXPIRED
  amount: Number,            // Subscription amount
  currency: String,          // Currency
  billingCycle: String,      // MONTHLY, QUARTERLY, YEARLY
  startDate: Date,
  endDate: Date,
  features: {
    priorityListing: Boolean,
    analytics: Boolean,
    marketingTools: Boolean,
    customerSupport: Boolean,
    maxProducts: Number,
    maxImagesPerProduct: Number
  },
  paymentMethod: String,
  paymentStatus: String,
  autoRenew: Boolean,
  cancelledAt: Date,
  cancelledBy: ObjectId
}
```

## API Endpoints

### Payments

#### Create Payment
```http
POST /api/payments
Content-Type: application/json
Authorization: Bearer <token>

{
  "orderId": "order123",
  "paymentMethod": "COD",
  "transferDetails": {
    "transactionId": "TXN123",
    "bankName": "SBI",
    "accountNumber": "1234567890",
    "amount": 1500
  }
}
```

#### List Payments
```http
GET /api/payments?page=1&limit=10&status=COMPLETED
Authorization: Bearer <token>
```

#### Get Payment Details
```http
GET /api/payments/[id]
Authorization: Bearer <token>
```

#### Update Payment
```http
PUT /api/payments/[id]
Content-Type: application/json
Authorization: Bearer <token>

{
  "action": "verify_bank_transfer",
  "verificationData": {
    "verified": true,
    "reference": "REF123"
  }
}
```

### Subscriptions

#### Create Subscription
```http
POST /api/subscriptions
Content-Type: application/json
Authorization: Bearer <token>

{
  "plan": "PREMIUM",
  "billingCycle": "MONTHLY",
  "paymentMethod": "BANK_TRANSFER"
}
```

#### List Subscriptions
```http
GET /api/subscriptions?page=1&limit=10&status=ACTIVE
Authorization: Bearer <token>
```

### Admin Revenue

#### Get Revenue Analytics
```http
GET /api/admin/revenue?period=month&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

## Components

### PaymentForm
A React component for handling payment form submission with:
- Payment method selection
- Bank transfer details form
- Real-time validation
- Success/error handling

### SubscriptionPlans
A React component for displaying subscription plans with:
- Plan comparison
- Billing cycle selection
- Feature highlights
- Pricing calculations

## Configuration

### Environment Variables
```bash
# Payment Gateway Configurations
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox
```

### Commission Configuration
Default commission rate is 5% but can be customized in `src/lib/payment.js`:
```javascript
const calculateCommission = (amount, commissionPercentage = 5) => {
  return (amount * commissionPercentage) / 100;
};
```

## Usage Examples

### Creating a Payment
```javascript
import { createPayment } from '../lib/payment';

const payment = await createPayment(
  orderId,
  buyerId,
  farmerId,
  amount,
  'COD',
  'INR'
);
```

### Processing Farmer Payout
```javascript
import { processFarmerPayout } from '../lib/payment';

const payout = await processFarmerPayout(paymentId);
```

### Getting Payment Statistics
```javascript
import { getPaymentStats } from '../lib/payment';

const stats = await getPaymentStats(userId, 'farmer');
```

## Demo Page

Visit `/payment-demo` to test the payment and subscription functionality:
- Payment form with different methods
- Subscription plan selection
- Real-time pricing calculations
- API endpoint documentation

## Security Considerations

1. **Authentication**: All payment endpoints require valid JWT tokens
2. **Authorization**: Role-based access control for different operations
3. **Validation**: Server-side validation for all payment data
4. **Encryption**: Sensitive data should be encrypted in transit and at rest
5. **Audit Trail**: All payment operations are logged with timestamps

## Future Enhancements

### Phase 2 Features
- **Stripe Integration**: Complete credit/debit card processing
- **Razorpay Integration**: UPI and digital wallet support
- **PayPal Integration**: International payment support
- **Webhook Handling**: Real-time payment status updates
- **Refund Processing**: Automated refund handling
- **Multi-currency Support**: Support for multiple currencies

### Advanced Features
- **Escrow System**: Hold payments until delivery confirmation
- **Installment Payments**: Support for payment plans
- **Loyalty Program**: Points and rewards system
- **Affiliate Marketing**: Commission sharing with partners
- **Dynamic Pricing**: Commission rates based on volume

## Testing

### Unit Tests
```bash
npm test -- --testPathPattern=payment
```

### Integration Tests
```bash
npm run test:integration -- --testPathPattern=payment
```

### Manual Testing
1. Start the development server: `npm run dev`
2. Visit `/payment-demo`
3. Test different payment methods
4. Verify commission calculations
5. Check subscription plan features

## Troubleshooting

### Common Issues

1. **Payment Creation Fails**
   - Check authentication token
   - Verify order exists and belongs to user
   - Ensure payment method is valid

2. **Commission Calculation Errors**
   - Verify amount is a valid number
   - Check commission percentage configuration

3. **Subscription Plan Issues**
   - Ensure farmer doesn't have active subscription
   - Verify plan and billing cycle are valid

### Debug Mode
Enable debug logging in `src/lib/payment.js`:
```javascript
const DEBUG = process.env.NODE_ENV === 'development';
```

## Contributing

1. Follow the existing code structure
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure security best practices are followed
5. Test with multiple payment scenarios

## License

This project is licensed under the MIT License - see the LICENSE file for details.
