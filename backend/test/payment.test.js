const crypto = require('crypto');
const {
  signData,
  verifySignature,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  buildSortedParamString,
  createTelebirrH5PayPayload,
} = require('../utils/telebirr');
const {
  initializeChapaPayment,
  verifyChapaWebhookSignature,
} = require('../utils/chapa');

require('dotenv').config();

async function runTests() {
  console.log('--- RUNNING PAYMENT INTEGRATION VERIFICATION TESTS ---\n');

  // 1. Test Telebirr RSA Sign and Verification
  console.log('Test 1: Telebirr RSA-SHA256 Signing and Signature Verification');
  const testData = 'appId=123&nonce=abc&outTradeNo=TB1001&totalAmount=150';
  const privateKey = process.env.TELEBIRR_MERCHANT_PRIVATE_KEY;
  const publicKey = process.env.TELEBIRR_PUBLIC_KEY;

  if (!privateKey || !publicKey) {
    throw new Error('RSA Keys missing from environment!');
  }

  const signature = signData(testData, privateKey);
  console.log(' Generated RSA Signature:', signature.substring(0, 40) + '...');

  const isValid = verifySignature(testData, signature, publicKey);
  console.log(' Signature Verification Result:', isValid ? 'PASS' : 'FAIL');
  if (!isValid) throw new Error('RSA Signature verification failed!');

  // 2. Test Telebirr RSA Encryption and Decryption
  console.log('\nTest 2: Telebirr RSA Encryption and Decryption');
  const secretMsg = 'Telebirr_H5_DirectPay_Secret_Payload';
  const encrypted = encryptWithPublicKey(secretMsg, publicKey);
  const decrypted = decryptWithPrivateKey(encrypted, privateKey);
  console.log(' Original:', secretMsg);
  console.log(' Decrypted:', decrypted);
  console.log(' Encryption Match:', secretMsg === decrypted ? 'PASS' : 'FAIL');
  if (secretMsg !== decrypted) throw new Error('RSA Encryption/Decryption failed!');

  // 3. Test Telebirr H5 Payload Creation
  console.log('\nTest 3: Telebirr H5 Payload Generation');
  const telebirrPayload = createTelebirrH5PayPayload({
    outTradeNo: 'KTR_TB_TEST_123',
    totalAmount: 150,
  });
  console.log(' OutTradeNo:', telebirrPayload.outTradeNo);
  console.log(' Payment URL:', telebirrPayload.paymentUrl);
  console.log(' H5 Payload Sign:', telebirrPayload.sign.substring(0, 30) + '...');
  const verifyH5Sign = verifySignature(
    telebirrPayload.rawParamString,
    telebirrPayload.sign,
    publicKey
  );
  console.log(' H5 Payload Verification:', verifyH5Sign ? 'PASS' : 'FAIL');
  if (!verifyH5Sign) throw new Error('H5 Payload signature verification failed!');

  // 4. Test Chapa Webhook HMAC Verification
  console.log('\nTest 4: Chapa Webhook HMAC Signature Verification');
  const webhookBody = { tx_ref: 'KTR_CHAPA_TEST_123', status: 'success', amount: '150' };
  const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET || 'your_chapa_webhook_secret_hash';
  const hmacSign = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(webhookBody))
    .digest('hex');

  const chapaWebhookValid = verifyChapaWebhookSignature(
    webhookBody,
    hmacSign,
    webhookSecret
  );
  console.log(' Chapa HMAC Webhook Verification:', chapaWebhookValid ? 'PASS' : 'FAIL');
  if (!chapaWebhookValid) throw new Error('Chapa Webhook HMAC verification failed!');

  // 5. Test Chapa Payment Initialization
  console.log('\nTest 5: Chapa Payment Initialization Utility');
  const chapaInit = await initializeChapaPayment({
    amount: 150,
    email: 'testuser@ketero.et',
    first_name: 'Abebe',
    last_name: 'Bikila',
    tx_ref: 'KTR_CHAPA_TEST_456',
  });
  console.log(' Chapa Init Status:', chapaInit.status);
  console.log(' Chapa Checkout URL:', chapaInit.checkout_url);
  console.log(' Chapa Tx Ref:', chapaInit.tx_ref);

  console.log('\n=============================================');
  console.log(' ALL PAYMENT UTILITY TESTS PASSED SUCCESSFULLY! ');
  console.log('=============================================\n');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
