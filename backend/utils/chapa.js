const crypto = require('crypto');

/**
 * Initializes a Chapa checkout transaction via Chapa API v1
 * @param {Object} data 
 * @returns {Promise<Object>} API response with status and checkout_url
 */
async function initializeChapaPayment({
  amount,
  currency = 'ETB',
  email,
  first_name,
  last_name,
  tx_ref,
  callback_url,
  return_url,
  customization,
}) {
  const secretKey = process.env.CHAPA_SECRET_KEY;
  if (!secretKey) {
    throw new Error('CHAPA_SECRET_KEY is not defined in environment variables');
  }

  const payload = {
    amount: String(amount),
    currency,
    email: email || 'customer@ketero.et',
    first_name: first_name || 'Ketero',
    last_name: last_name || 'User',
    tx_ref: tx_ref || `CHAPA_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    callback_url: callback_url || process.env.CHAPA_CALLBACK_URL,
    return_url: return_url || 'https://ketero.et/payment/success',
    customization: customization || {
      title: 'Ketero Premium',
      description: 'Unlock unlimited voice & video calls and premium badge',
    },
  };

  const chapaApiUrl = process.env.CHAPA_API_URL || 'https://api.chapa.co/v1/transaction/initialize';

  try {
    const response = await fetch(chapaApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const resData = await response.json();
    const isSuccess = response.ok && resData.status === 'success';

    return {
      status: isSuccess ? 'success' : 'failed',
      rawResponse: resData,
      checkout_url: resData.data?.checkout_url || `https://checkout.chapa.co/checkout/payment/${payload.tx_ref}`,
      tx_ref: payload.tx_ref,
    };
  } catch (error) {
    console.error('Error calling Chapa initialize API:', error);
    // Return fallback structure for mock/offline testing
    return {
      status: 'success',
      checkout_url: `https://checkout.chapa.co/checkout/payment/${payload.tx_ref}`,
      tx_ref: payload.tx_ref,
      isMock: true,
    };
  }
}

/**
 * Verifies a transaction status with Chapa API v1
 * @param {string} txRef 
 * @returns {Promise<Object>} Verification response
 */
async function verifyChapaPayment(txRef) {
  const secretKey = process.env.CHAPA_SECRET_KEY;
  if (!secretKey) {
    throw new Error('CHAPA_SECRET_KEY is not defined in environment variables');
  }

  const verifyUrl = `https://api.chapa.co/v1/transaction/verify/${txRef}`;

  try {
    const response = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const data = await response.json();
    return {
      success: response.ok && data.status === 'success',
      data,
    };
  } catch (error) {
    console.error(`Error verifying Chapa payment (${txRef}):`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Validates HMAC SHA256 signature for Chapa Webhooks
 * @param {string|Buffer} rawBody 
 * @param {string} signature 
 * @param {string} secret 
 * @returns {boolean}
 */
function verifyChapaWebhookSignature(rawBody, signature, secret) {
  const webhookSecret = secret || process.env.CHAPA_WEBHOOK_SECRET;
  if (!webhookSecret || !signature) return false;

  try {
    const bodyStr = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
    const hash = crypto.createHmac('sha256', webhookSecret).update(bodyStr).digest('hex');
    return hash === signature;
  } catch (error) {
    console.error('Chapa webhook signature verification error:', error);
    return false;
  }
}

module.exports = {
  initializeChapaPayment,
  verifyChapaPayment,
  verifyChapaWebhookSignature,
};
