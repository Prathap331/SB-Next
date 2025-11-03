// Payment service for Razorpay integration

export interface CreateOrderRequest {
  amount: number;
  currency: string;
  target_tier: string;
}

export interface CreateOrderResponse {
  order_id: string;
  key_id: string;
  amount: number;
  currency: string;
}

// Declare Razorpay type for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Load Razorpay script dynamically
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.body.appendChild(script);
  });
}

// Get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const tokenData = localStorage.getItem('sb-xncfghdikiqknuruurfh-auth-token');
  if (tokenData) {
    try {
      const parsedToken = JSON.parse(tokenData);
      return parsedToken.access_token || null;
    } catch (error) {
      console.error('Failed to parse auth token:', error);
      return null;
    }
  }
  return null;
}

// Create order on backend
// Note: Backend expects amount in rupees (e.g., 500 for ₹500)
// Backend will convert to paise internally and return the paise amount in response
export async function createOrder(amount: number, targetTier: string): Promise<CreateOrderResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('User not authenticated. Please login first.');
  }

  const response = await fetch('https://sb-u864.onrender.com/payments/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount: amount, // Amount in INR rupees (backend converts to paise)
      currency: 'INR',
      target_tier: targetTier,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error('Unauthorized. Please login again.');
    }
    throw new Error(`Failed to create order: ${errorText}`);
  }

  return await response.json();
}

// Initialize Razorpay checkout
export async function initiatePayment(
  orderId: string,
  keyId: string,
  amount: number,
  onSuccess: (paymentId: string, orderId: string) => void,
  onFailure: (error: string) => void
): Promise<void> {
  try {
    await loadRazorpayScript();
  } catch (error) {
    onFailure('Failed to load Razorpay. Please refresh and try again.');
    return;
  }

  const options = {
    key: keyId,
    amount: amount,
    currency: 'INR',
    name: 'StoryBit AI',
    description: 'Subscription Payment',
    order_id: orderId,
    handler: function (response: any) {
      // Note: This is just the frontend confirmation
      // The actual payment confirmation comes from webhook
      onSuccess(response.razorpay_payment_id, response.razorpay_order_id);
    },
    prefill: {
      // You can prefill user details if available
    },
    theme: {
      color: '#000000',
    },
    modal: {
      ondismiss: function () {
        onFailure('Payment cancelled by user');
      },
    },
  };

  try {
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    console.error('Razorpay initialization error:', error);
    onFailure('Failed to initialize payment. Please try again.');
  }
}

// Complete payment flow
export async function processPayment(
  amount: number, // Amount in INR rupees (e.g., 1250 for ₹1250)
  targetTier: string,
  onSuccess: (paymentId: string, orderId: string) => void,
  onFailure: (error: string) => void
): Promise<void> {
  try {
    // Step 1: Create order on backend
    // Backend will convert rupees to paise and return order details
    const orderData = await createOrder(amount, targetTier);
    
    // Step 2: Open Razorpay checkout
    // Use amount from API response (already in paise as per Razorpay requirement)
    await initiatePayment(
      orderData.order_id,
      orderData.key_id,
      orderData.amount, // This is already in paise from the API response
      onSuccess,
      onFailure
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
    onFailure(errorMessage);
  }
}

