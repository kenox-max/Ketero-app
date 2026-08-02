const crypto = require('crypto');

/**
 * Normalizes PEM formatted RSA key strings from environment variables
 */
function normalizeKey(keyStr) {
  if (!keyStr) return '';
  return keyStr.replace(/\\n/g, '\n');
}

/**
 * Signs data using RSA-SHA256 private key
 * @param {string} dataString 
 * @param {string} privateKeyPem 
 * @returns {string} Base64 encoded RSA-SHA256 signature
 */
function signData(dataString, privateKeyPem) {
  const formattedKey = normalizeKey(privateKeyPem);
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(dataString, 'utf8');
  return signer.sign(formattedKey, 'base64');
}

/**
 * Verifies RSA-SHA256 signature using Telebirr public key
 * @param {string} dataString 
 * @param {string} signatureBase64 
 * @param {string} publicKeyPem 
 * @returns {boolean} True if signature is valid
 */
function verifySignature(dataString, signatureBase64, publicKeyPem) {
  try {
    const formattedKey = normalizeKey(publicKeyPem);
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(dataString, 'utf8');
    return verifier.verify(formattedKey, signatureBase64, 'base64');
  } catch (error) {
    console.error('Telebirr RSA verification error:', error);
    return false;
  }
}

/**
 * RSA Public Key Encryption
 * @param {string} dataString 
 * @param {string} publicKeyPem 
 * @returns {string} Base64 encoded string
 */
function encryptWithPublicKey(dataString, publicKeyPem) {
  const formattedKey = normalizeKey(publicKeyPem);
  const buffer = Buffer.from(dataString, 'utf8');
  const encrypted = crypto.publicEncrypt(
    {
      key: formattedKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    buffer
  );
  return encrypted.toString('base64');
}

/**
 * RSA Private Key Decryption
 * @param {string} encryptedBase64 
 * @param {string} privateKeyPem 
 * @returns {string} Decrypted string
 */
function decryptWithPrivateKey(encryptedBase64, privateKeyPem) {
  const formattedKey = normalizeKey(privateKeyPem);
  const buffer = Buffer.from(encryptedBase64, 'base64');
  const decrypted = crypto.privateDecrypt(
    {
      key: formattedKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    buffer
  );
  return decrypted.toString('utf8');
}

/**
 * Formats parameters alphabetically into key=value&key2=value2 format
 * Excludes 'sign', 'sign_type', empty strings, null, and undefined values.
 * @param {Object} params 
 * @returns {string} Formatted string
 */
function buildSortedParamString(params) {
  const filteredKeys = Object.keys(params).filter((key) => {
    const value = params[key];
    return (
      key !== 'sign' &&
      key !== 'sign_type' &&
      value !== undefined &&
      value !== null &&
      value !== ''
    );
  });

  filteredKeys.sort();

  return filteredKeys.map((key) => `${key}=${params[key]}`).join('&');
}

/**
 * Creates signed Telebirr H5 Direct Pay request payload & payment link
 * @param {Object} options 
 * @returns {Object} { outTradeNo, rawParamString, sign, paymentUrl, rawPayload }
 */
function createTelebirrH5PayPayload(options = {}) {
  const appId = options.appId || process.env.TELEBIRR_APP_ID;
  const appKey = options.appKey || process.env.TELEBIRR_APP_KEY;
  const shortCode = options.shortCode || process.env.TELEBIRR_SHORT_CODE;
  const notifyUrl = options.notifyUrl || process.env.TELEBIRR_NOTIFY_URL;
  const privateKey = options.privateKey || process.env.TELEBIRR_MERCHANT_PRIVATE_KEY;

  const outTradeNo = options.outTradeNo || `TB_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const totalAmount = String(options.totalAmount || options.amount || '150');
  const subject = options.subject || 'Ketero Premium Subscription';
  const nonce = options.nonce || crypto.randomBytes(16).toString('hex');
  const timestamp = options.timestamp || String(Date.now());
  const returnUrl = options.returnUrl || 'https://ketero.et/payment/success';
  const receiveName = options.receiveName || 'Ketero Dating';
  const timeoutExpress = options.timeoutExpress || '30m';

  const params = {
    appId,
    appKey,
    nonce,
    notifyUrl,
    outTradeNo,
    receiveName,
    returnUrl,
    shortCode,
    subject,
    timeoutExpress,
    totalAmount,
    timestamp,
  };

  const rawParamString = buildSortedParamString(params);
  let sign = '';

  if (privateKey) {
    sign = signData(rawParamString, privateKey);
  }

  const rawPayload = {
    ...params,
    sign,
    sign_type: 'RSA2',
  };

  // Base Telebirr Web Pay H5 Gateway URL
  const baseUrl = process.env.TELEBIRR_H5_GATEWAY_URL || 'https://app.telebirr.cn/pay';
  const queryParams = new URLSearchParams({
    ...params,
    sign,
    sign_type: 'RSA2',
  }).toString();

  const paymentUrl = `${baseUrl}?${queryParams}`;

  return {
    outTradeNo,
    rawParamString,
    sign,
    paymentUrl,
    rawPayload,
  };
}

module.exports = {
  normalizeKey,
  signData,
  verifySignature,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  buildSortedParamString,
  createTelebirrH5PayPayload,
};
