# Razorpay Payment Gateway - Backend Integration Guide

## Overview

This document outlines what the **backend team** needs to implement to complete the Razorpay payment gateway integration. The frontend is already set up and ready.

---

## Current Status

### ✅ Frontend Implementation (Already Complete)

The frontend has been implemented with:
- Payment service that calls your backend API
- Razorpay checkout integration
- Webhook endpoint route handler (Next.js API route)
- Error handling and user feedback

### ⚠️ Backend Implementation Required

The backend needs to implement the following components to make payments work end-to-end.

---

## 1. Create Order Endpoint (Already Exists ✅)

**Endpoint:** `POST https://sb-u864.onrender.com/payments/create-order`

**Current Implementation:** ✅ Working (confirmed by user)

**Request Format:**
```json
{
  "amount": 1250,
  "currency": "INR",
  "target_tier": "basic"
}
```

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Response Format (Current):**
```json
{
  "order_id": "order_RasCTdOPYPmT0U",
  "key_id": "rzp_live_RYkfeMAtBRX7Gt",
  "amount": 500,
  "currency": "INR"
}
```

**Important Notes:**
- The `amount` in request is in **rupees** (e.g., 1250 = ₹1250)
- The `amount` in response should be in **paise** (e.g., 125000 paise = ₹1250)
- The backend should convert rupees → paise before creating the Razorpay order
- The `key_id` should be your Razorpay **Key ID** (not secret key)

---

## 2. Webhook Endpoint (Critical - Needs Implementation) ⚠️

**Endpoint:** `POST https://sb-u864.onrender.com/payments/webhook`

This is the **most critical** endpoint that validates and processes payments securely.

### Why Webhooks Are Essential

- **Security**: Only Razorpay can trigger this endpoint (server-to-server)
- **Reliability**: Confirms payment even if user closes browser
- **Trust**: Webhook signature verification prevents fraud
- **Compliance**: Required for production payments

### Implementation Requirements

#### 2.1. Webhook Signature Verification

**CRITICAL**: Always verify the webhook signature using Razorpay's webhook secret.

```python
# Python Example (adjust for your backend language)
import hmac
import hashlib

def verify_webhook_signature(payload, signature, secret):
    """
    Verify Razorpay webhook signature
    
    Args:
        payload: Raw request body as string
        signature: X-Razorpay-Signature header value
        secret: Your Razorpay Webhook Secret
    
    Returns:
        bool: True if signature is valid
    """
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)
```

#### 2.2. Webhook Event Processing

Process the following events:

**Primary Events to Handle:**
1. `payment.captured` - Payment successfully completed
2. `order.paid` - Order payment completed
3. `payment.failed` - Payment failed (optional, for logging)

**Webhook Payload Structure:**
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxxxxxxxxxxxx",
        "entity": "payment",
        "amount": 125000,
        "currency": "INR",
        "status": "captured",
        "order_id": "order_RasCTdOPYPmT0U",
        "method": "card",
        "created_at": 1234567890
      }
    }
  }
}
```

**For `order.paid` event:**
```json
{
  "event": "order.paid",
  "payload": {
    "order": {
      "entity": {
        "id": "order_RasCTdOPYPmT0U",
        "entity": "order",
        "amount": 125000,
        "amount_paid": 125000,
        "amount_due": 0,
        "status": "paid",
        "created_at": 1234567890
      }
    }
  }
}
```

#### 2.3. Implementation Steps

```python
# Pseudo-code example
def handle_webhook(request):
    # Step 1: Get webhook signature from headers
    webhook_signature = request.headers.get('X-Razorpay-Signature')
    
    # Step 2: Get raw request body
    raw_body = request.body  # Get raw bytes, not parsed JSON
    
    # Step 3: Verify signature
    webhook_secret = os.getenv('RAZORPAY_WEBHOOK_SECRET')
    if not verify_webhook_signature(raw_body, webhook_signature, webhook_secret):
        return {"error": "Invalid signature"}, 401
    
    # Step 4: Parse JSON (only after signature verification)
    payload = json.loads(raw_body)
    event_type = payload.get('event')
    
    # Step 5: Handle different event types
    if event_type == 'payment.captured':
        payment_data = payload['payload']['payment']['entity']
        order_id = payment_data['order_id']
        payment_id = payment_data['id']
        amount = payment_data['amount']  # In paise
        
        # Process payment success
        process_successful_payment(order_id, payment_id, amount)
        
    elif event_type == 'order.paid':
        order_data = payload['payload']['order']['entity']
        order_id = order_data['id']
        amount = order_data['amount']
        
        # Process order payment
        process_order_payment(order_id, amount)
    
    # Step 6: Always return 200 OK to acknowledge receipt
    return {"status": "success"}, 200
```

---

## 3. Payment Processing Logic

### 3.1. Database Updates Required

When a payment is confirmed via webhook, update the user's subscription:

```sql
-- Example database update (adjust to your schema)
UPDATE users
SET 
    subscription_tier = 'basic',  -- or 'pro'
    subscription_status = 'active',
    subscription_start_date = NOW(),
    subscription_end_date = DATE_ADD(NOW(), INTERVAL 1 MONTH),
    last_payment_id = 'pay_xxxxxxxxxxxxx',
    last_payment_date = NOW()
WHERE 
    id = :user_id;
```

### 3.2. Prevent Duplicate Processing

**CRITICAL**: Implement idempotency to prevent processing the same payment twice.

```python
def process_successful_payment(order_id, payment_id, amount):
    # Check if payment already processed
    existing_payment = db.query(
        "SELECT * FROM payments WHERE razorpay_payment_id = ?", 
        payment_id
    )
    
    if existing_payment:
        # Payment already processed, return early
        return {"status": "already_processed"}
    
    # Get order details to find user and tier
    order = db.query(
        "SELECT user_id, target_tier FROM orders WHERE razorpay_order_id = ?",
        order_id
    )
    
    if not order:
        # Order not found - log error
        log_error(f"Order not found: {order_id}")
        return {"error": "Order not found"}, 404
    
    # Update user subscription
    update_user_subscription(
        user_id=order['user_id'],
        tier=order['target_tier'],
        payment_id=payment_id,
        amount=amount
    )
    
    # Record payment in database
    db.insert('payments', {
        'razorpay_payment_id': payment_id,
        'razorpay_order_id': order_id,
        'user_id': order['user_id'],
        'amount': amount,
        'status': 'completed',
        'created_at': NOW()
    })
```

### 3.3. Error Handling

Handle these scenarios:
- Duplicate webhook deliveries (idempotency)
- Invalid signatures (reject)
- Unknown order IDs (log and investigate)
- Payment amount mismatch (log and investigate)

---

## 4. Environment Variables Required

Set these in your backend environment:

```bash
# Razorpay Credentials
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx  # Secret key (NOT the webhook secret)
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxx  # Separate webhook secret

# Database (your existing config)
DATABASE_URL=...
```

**Where to Find:**
- **Key ID & Secret**: Razorpay Dashboard → Settings → API Keys
- **Webhook Secret**: Razorpay Dashboard → Settings → Webhooks → Your webhook → Secret

---

## 5. Razorpay Dashboard Configuration

### 5.1. Create Webhook in Razorpay Dashboard

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to **Settings** → **Webhooks**
3. Click **+ Add New Webhook**
4. Configure:
   - **URL**: `https://sb-u864.onrender.com/payments/webhook`
   - **Active Events**: 
     - ✅ `payment.captured`
     - ✅ `order.paid`
     - ✅ `payment.failed` (optional)
   - **Secret**: Generate or use existing secret
   - **Status**: Active

5. **Copy the Webhook Secret** and add it to your environment variables

### 5.2. Test Mode vs Live Mode

- **Test Mode**: Use test credentials (`rzp_test_...`)
- **Live Mode**: Use live credentials (`rzp_live_...`)

Your current `key_id` is `rzp_live_...`, so you're in **Live Mode**.

---

## 6. Database Schema Recommendations

### Orders Table
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    razorpay_order_id VARCHAR(255) UNIQUE,
    target_tier VARCHAR(50),  -- 'basic', 'pro', etc.
    amount INTEGER,  -- In paise
    currency VARCHAR(10),
    status VARCHAR(50),  -- 'created', 'paid', 'failed'
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Payments Table
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    razorpay_payment_id VARCHAR(255) UNIQUE,
    razorpay_order_id VARCHAR(255),
    amount INTEGER,  -- In paise
    currency VARCHAR(10),
    status VARCHAR(50),  -- 'pending', 'captured', 'failed'
    payment_method VARCHAR(50),
    webhook_received BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### User Subscription Update
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS (
    subscription_tier VARCHAR(50),
    subscription_status VARCHAR(50),
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    last_payment_id VARCHAR(255),
    last_payment_date TIMESTAMP
);
```

---

## 7. Testing Checklist

### 7.1. Test Mode Testing

1. ✅ **Create Order**: Test with test amount
2. ✅ **Payment Flow**: Complete payment in Razorpay test mode
3. ✅ **Webhook**: Verify webhook is received
4. ✅ **Database**: Check user subscription is updated
5. ✅ **Idempotency**: Send same webhook twice, verify no duplicate updates

### 7.2. Test Payment Methods

Use Razorpay's test cards:
- **Success**: `4111 1111 1111 1111` (any CVV, any future expiry)
- **Failure**: `4000 0000 0000 0002`
- **UPI**: `success@razorpay`

### 7.3. Webhook Testing

Test webhook signature verification:
1. Valid signature → Should process
2. Invalid signature → Should reject (401)
3. Missing signature → Should reject (401)

---

## 8. Security Best Practices

### ✅ DO:
- Always verify webhook signatures
- Use HTTPS for webhook endpoint
- Store webhook secret securely (env variables)
- Log all webhook events for audit
- Implement idempotency
- Validate payment amounts match order amounts
- Use prepared statements to prevent SQL injection

### ❌ DON'T:
- Process payments without signature verification
- Trust frontend payment confirmation alone
- Store sensitive keys in code
- Skip idempotency checks
- Process duplicate payments

---

## 9. Error Scenarios to Handle

| Scenario | Action |
|----------|--------|
| Invalid webhook signature | Return 401, log error, do not process |
| Order ID not found | Log error, return 404, investigate |
| Payment amount mismatch | Log warning, do not process, investigate |
| Duplicate webhook delivery | Return 200, skip processing (idempotent) |
| User account not found | Log error, investigate, do not process |
| Database error | Log error, return 500, Razorpay will retry |

---

## 10. Monitoring & Logging

### Log These Events:
- ✅ Webhook received (with event type)
- ✅ Signature verification result
- ✅ Payment processing start
- ✅ Payment processing success
- ✅ Payment processing failure
- ✅ Database update results

### Metrics to Track:
- Webhook delivery success rate
- Payment processing time
- Failed payment attempts
- Duplicate payment attempts

---

## 11. Frontend-Backend Flow Summary

```
┌─────────────┐
│  Frontend   │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. POST /payments/create-order
       │    { amount: 1250, target_tier: "basic" }
       │
       ▼
┌─────────────────────────────┐
│      Your Backend           │
│  /payments/create-order     │
│                             │
│  - Validates user token     │
│  - Creates Razorpay order   │
│  - Stores order in DB       │
│  - Returns order_id, etc.   │
└──────┬──────────────────────┘
       │
       │ 2. Response: { order_id, key_id, amount }
       │
       ▼
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │
       │ 3. Opens Razorpay Checkout
       │
       ▼
┌─────────────────┐
│    Razorpay     │
│   Checkout UI   │
└──────┬──────────┘
       │
       │ 4. User completes payment
       │
       ▼
┌─────────────────┐
│    Razorpay     │
│    Servers      │
└──────┬──────────┘
       │
       │ 5. POST /payments/webhook
       │    (with signature)
       │
       ▼
┌─────────────────────────────┐
│      Your Backend           │
│  /payments/webhook          │
│                             │
│  - Verifies signature ✅    │
│  - Validates payment        │
│  - Updates user subscription│
│  - Records payment in DB    │
│  - Returns 200 OK           │
└─────────────────────────────┘
```

---

## 12. Next Steps Summary

### Immediate Actions:
1. ✅ Implement webhook endpoint (`/payments/webhook`)
2. ✅ Add webhook signature verification
3. ✅ Create webhook in Razorpay Dashboard
4. ✅ Set up database tables (if not exists)
5. ✅ Implement payment processing logic
6. ✅ Add idempotency checks
7. ✅ Test in Razorpay test mode
8. ✅ Test webhook delivery

### Before Production:
1. ✅ Test with real payments (small amounts)
2. ✅ Verify webhook signature verification works
3. ✅ Test duplicate webhook handling
4. ✅ Set up error monitoring
5. ✅ Test failure scenarios
6. ✅ Document any custom logic

---

## 13. Support Resources

- **Razorpay Docs**: https://razorpay.com/docs/
- **Webhook Guide**: https://razorpay.com/docs/webhooks/
- **API Reference**: https://razorpay.com/docs/api/

---

## Questions or Issues?

If you encounter any issues during implementation:
1. Check Razorpay Dashboard → Logs for webhook delivery status
2. Verify webhook secret matches in dashboard and backend
3. Check backend logs for signature verification errors
4. Test webhook manually using Razorpay's webhook testing tool

---

**Status**: Frontend ✅ Ready | Backend ⚠️ Needs Webhook Implementation

**Priority**: 🔴 HIGH - Payments cannot complete without webhook endpoint

