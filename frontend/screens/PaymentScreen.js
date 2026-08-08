import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import UpgradeModal from '../components/UpgradeModal';

export default function PaymentScreen({ token, apiBaseUrl, paywallData, onPaymentSuccess, onCancel, user }) {
  const [provider, setProvider] = useState('Telebirr'); // 'Telebirr' or 'Chapa'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulationModal, setSimulationModal] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const handlePay = async () => {
    if (provider === 'Telebirr' && !phoneNumber) {
      Alert.alert('Phone Required', 'Please enter your Telebirr phone number.');
      return;
    }

    setLoading(true);
    try {
      // 1. Ask backend for checkout session
      const response = await fetch(`${apiBaseUrl}/api/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: 150, // 150 Birr for premium
          provider,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTransactionId(data.transactionId);
        // Open the Mock payment processing modal
        setSimulationModal(true);
      } else {
        Alert.alert('Checkout Error', data.error || 'Failed to initiate checkout.');
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      Alert.alert('Network Error', 'Unable to reach payment gateway.');
    } finally {
      setLoading(false);
    }
  };

  // Simulates user entering Pin on Telebirr OTP or completing card checkout in Chapa
  const confirmMockPayment = async () => {
    setLoading(true);
    setSimulationModal(false);

    try {
      // Extract userId from token or use decoded state
      // For prototype checkout, we notify the webhook directly
      const response = await fetch(`${apiBaseUrl}/api/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          status: 'success',
          provider,
          // The backend webhook fetches the user from the payload
          // For simplicity, we pass user details so webhook upgrades the right user
          userId: paywallData?.userId || user?._id, 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert(
          'ቀጠሮ Premium Unlocked!',
          'Congratulations! You have upgraded to Ketero Premium. Video & Voice calls are now unlocked.',
          [{ text: 'Great!', onPress: onPaymentSuccess }]
        );
      } else {
        Alert.alert('Verification Failed', 'Unable to verify payment. Please try again.');
      }
    } catch (err) {
      console.error('Webhook verification failed:', err);
      Alert.alert('Verification Error', 'Failed to communicate with billing verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Paywall Header */}
        <Text style={styles.crown}>👑</Text>
        <Text style={styles.title}>Unlock Ketero Premium</Text>
        <Text style={styles.description}>
          {paywallData?.message ||
            'Get access to peer-to-peer WebRTC voice & video calls, special premium badges, and unlimited preferences filters.'}
        </Text>

        {/* Pricing tag */}
        <View style={styles.pricingCard}>
          <Text style={styles.pricingTitle}>Premium Membership</Text>
          <Text style={styles.price}>150 Birr <Text style={styles.period}>/ month</Text></Text>
          <Text style={styles.features}>✓ Unlimited Voice Calls</Text>
          <Text style={styles.features}>✓ Unlimited Video Streams</Text>
          <Text style={styles.features}>✓ Custom VIP Crown Badge</Text>
        </View>

        {/* Payment Gateways (Telebirr & Chapa) */}
        <Text style={styles.sectionLabel}>Select Local Payment Method</Text>
        <View style={styles.providerRow}>
          <TouchableOpacity
            style={[styles.providerBtn, provider === 'Telebirr' && styles.providerBtnActive]}
            onPress={() => setProvider('Telebirr')}
          >
            <Text style={styles.providerEmoji}>📱</Text>
            <Text style={[styles.providerName, provider === 'Telebirr' && styles.providerNameActive]}>
              Telebirr
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.providerBtn, provider === 'Chapa' && styles.providerBtnActive]}
            onPress={() => setProvider('Chapa')}
          >
            <Text style={styles.providerEmoji}>💳</Text>
            <Text style={[styles.providerName, provider === 'Chapa' && styles.providerNameActive]}>
              Chapa
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Details based on provider */}
        {provider === 'Telebirr' ? (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Telebirr Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 0911223344"
              placeholderTextColor="#555"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Chapa Credit / Debit Card & Mobile Pay</Text>
            <Text style={styles.chapaHelp}>
              You will be redirected to Chapa's secured payment gateway page to checkout.
            </Text>
          </View>
        )}

        {/* Actions */}
        <TouchableOpacity
          style={[styles.payBtn, { backgroundColor: '#FFB800' }]}
          onPress={() => setManualModalVisible(true)}
        >
          <Text style={styles.payBtnText}>📱 Telebirr Manual Payment & Screenshot Proof</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#121212" />
          ) : (
            <Text style={styles.payBtnText}>Pay via Gateway ({provider})</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>

      {/* Manual Telebirr Upgrade Modal */}
      <UpgradeModal
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
        token={token}
        apiBaseUrl={apiBaseUrl}
        user={user}
        onPaymentSubmitted={(paymentRequest) => {
          // Submission received and pending admin approval.
          // The modal stays open showing the 'Payment Pending Admin Approval' card.
        }}
      />

      {/* Mock payment portal Modal simulation */}
      <Modal visible={simulationModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Mock {provider} Portal</Text>
            <Text style={styles.modalDesc}>
              {provider === 'Telebirr'
                ? `Confirm payment prompt sent to your device for 150 ETB (Txn: ${transactionId}).`
                : `Simulate completing card verification on Chapa checkout for 150 ETB.`}
            </Text>

            <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmMockPayment}>
              <Text style={styles.modalConfirmBtnText}>Simulate Successful Payment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setSimulationModal(false)}
            >
              <Text style={styles.modalCancelBtnText}>Cancel Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crown: {
    fontSize: 50,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E4A853',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    paddingHorizontal: 15,
    marginBottom: 30,
    lineHeight: 20,
  },
  pricingCard: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E4A853',
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#E4A853',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  pricingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E4A853',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  period: {
    fontSize: 14,
    color: '#AAA',
    fontWeight: 'normal',
  },
  features: {
    color: '#FFF',
    fontSize: 13,
    marginTop: 6,
  },
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 13,
    fontWeight: 'bold',
    color: '#E4A853',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  providerRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 15,
    marginBottom: 20,
  },
  providerBtn: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2C2C2C',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  providerBtnActive: {
    borderColor: '#E4A853',
    backgroundColor: '#1E1E1E',
  },
  providerEmoji: {
    fontSize: 18,
  },
  providerName: {
    color: '#888',
    fontWeight: '600',
  },
  providerNameActive: {
    color: '#E4A853',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 25,
  },
  inputLabel: {
    color: '#FFF',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    fontSize: 15,
  },
  chapaHelp: {
    color: '#AAA',
    fontSize: 13,
    lineHeight: 18,
  },
  payBtn: {
    width: '100%',
    backgroundColor: '#E4A853',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  payBtnText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBtn: {
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: '#666',
    fontSize: 14,
  },
  // Modal Simulation Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  modalDesc: {
    color: '#AAA',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 25,
  },
  modalConfirmBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalConfirmBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalCancelBtn: {
    paddingVertical: 10,
  },
  modalCancelBtnText: {
    color: '#E63946',
    fontWeight: '600',
  },
});
