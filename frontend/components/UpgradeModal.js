import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const TELEBIRR_ACCOUNT_NAME = 'Ketero Dating Tech / ቀጠሮ';
const TELEBIRR_NUMBER = '+251911000000';

export default function UpgradeModal({ visible, onClose, token, apiBaseUrl, user, onPaymentSubmitted }) {
  const [planType, setPlanType] = useState('monthly'); // 'monthly' (199 ETB) or 'yearly' (1499 ETB)
  const [transactionId, setTransactionId] = useState('');
  const [screenshotUri, setScreenshotUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [copied, setCopied] = useState(false);

  const amount = planType === 'yearly' ? 1499 : 199;

  useEffect(() => {
    if (visible && token && apiBaseUrl) {
      checkExistingPaymentStatus();
    }
  }, [visible]);

  const checkExistingPaymentStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/payments/my-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.paymentRequest && data.paymentRequest.status === 'pending') {
        setPendingRequest(data.paymentRequest);
      } else {
        setPendingRequest(null);
      }
    } catch (err) {
      console.error('Check status error:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleCopyNumber = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    Alert.alert('Copied to Clipboard! 📋', `Telebirr Number: ${TELEBIRR_NUMBER}`);
  };

  const handlePickScreenshot = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Permission to access media gallery is required to upload transfer screenshot.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setScreenshotUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Pick Screenshot Error:', err);
      Alert.prompt('Provide Image URL', 'Enter transfer screenshot image URL:', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: (url) => url && setScreenshotUri(url) },
      ]);
    }
  };

  const handleSubmitProof = async () => {
    if (!transactionId.trim()) {
      Alert.alert('Missing Field', 'Please enter your Telebirr Transaction ID (e.g. 4AB789XYZ).');
      return;
    }

    if (!screenshotUri) {
      Alert.alert('Missing Screenshot', 'Please select or upload your Telebirr transfer screenshot proof.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('transactionId', transactionId.trim());
      formData.append('amount', amount.toString());
      formData.append('planType', planType);

      if (screenshotUri.startsWith('file:') || screenshotUri.startsWith('content:') || screenshotUri.startsWith('blob:')) {
        const filename = screenshotUri.split('/').pop() || 'receipt.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('receiptImage', {
          uri: screenshotUri,
          name: filename,
          type,
        });
      } else {
        formData.append('receiptImageUrl', screenshotUri);
      }

      const response = await fetch(`${apiBaseUrl}/api/payments/manual-submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert(
          'Payment Proof Submitted! ⏳',
          'Admin will verify your Telebirr transaction within 15-30 minutes and activate your VIP Gold badge.'
        );
        setPendingRequest(data.paymentRequest);
        if (onPaymentSubmitted) onPaymentSubmitted(data.paymentRequest);
      } else {
        Alert.alert('Submission Failed', data.error || 'Could not submit payment proof');
      }
    } catch (err) {
      console.error('Submit Payment Proof Error:', err);
      Alert.alert('Error', 'Network error submitting payment proof.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>👑 VIP Gold Telebirr Upgrade</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loadingStatus ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#FFB800" />
            </View>
          ) : pendingRequest ? (
            /* PENDING LOCK STATE BADGE */
            <View style={styles.pendingCard}>
              <Text style={styles.pendingBadge}>⏳ Payment Pending Admin Approval</Text>
              <Text style={styles.pendingDesc}>
                Your payment proof has been received! Our admin team is reviewing your transaction.
              </Text>

              <View style={styles.pendingMetaBox}>
                <Text style={styles.metaLabel}>Transaction ID: <Text style={styles.metaVal}>{pendingRequest.transactionId}</Text></Text>
                <Text style={styles.metaLabel}>Amount: <Text style={styles.metaVal}>{pendingRequest.amount} ETB ({pendingRequest.planType})</Text></Text>
                <Text style={styles.metaLabel}>Submitted: <Text style={styles.metaVal}>{new Date(pendingRequest.createdAt).toLocaleString()}</Text></Text>
              </View>

              {pendingRequest.receiptImageUrl && (
                <Image
                  source={{ uri: pendingRequest.receiptImageUrl.startsWith('/') ? `${apiBaseUrl}${pendingRequest.receiptImageUrl}` : pendingRequest.receiptImageUrl }}
                  style={styles.pendingPreviewImage}
                  resizeMode="cover"
                />
              )}

              <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                <Text style={styles.doneBtnText}>Close Window</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* PAYMENT FORM & STEPS */
            <ScrollView contentContainerStyle={styles.scrollForm}>
              {/* Plan Type Selector */}
              <Text style={styles.sectionLabel}>Select Subscription Plan</Text>
              <View style={styles.planSelector}>
                <TouchableOpacity
                  style={[styles.planOption, planType === 'monthly' && styles.planOptionActive]}
                  onPress={() => setPlanType('monthly')}
                >
                  <Text style={[styles.planTitle, planType === 'monthly' && styles.planTextActive]}>Monthly Plan</Text>
                  <Text style={[styles.planPrice, planType === 'monthly' && styles.planTextActive]}>199 ETB / mo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.planOption, planType === 'yearly' && styles.planOptionActive]}
                  onPress={() => setPlanType('yearly')}
                >
                  <Text style={[styles.planTitle, planType === 'yearly' && styles.planTextActive]}>Yearly Plan (Save 35%)</Text>
                  <Text style={[styles.planPrice, planType === 'yearly' && styles.planTextActive]}>1499 ETB / yr</Text>
                </TouchableOpacity>
              </View>

              {/* STEP 1: SEND MONEY */}
              <View style={styles.stepCard}>
                <Text style={styles.stepTitle}>Step 1: Send Money via Telebirr</Text>
                <Text style={styles.stepInstruction}>Transfer exactly <Text style={{ color: '#FFB800', fontWeight: 'bold' }}>{amount} ETB</Text> to our official Telebirr account:</Text>

                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>Account Name: <Text style={styles.infoVal}>{TELEBIRR_ACCOUNT_NAME}</Text></Text>
                  <Text style={styles.infoText}>Telebirr Number: <Text style={styles.infoVal}>{TELEBIRR_NUMBER}</Text></Text>
                </View>

                <TouchableOpacity style={styles.copyBtn} onPress={handleCopyNumber}>
                  <Text style={styles.copyBtnText}>{copied ? '✓ Number Copied!' : '📋 Copy Telebirr Number'}</Text>
                </TouchableOpacity>
              </View>

              {/* STEP 2: SUBMIT PROOF */}
              <View style={styles.stepCard}>
                <Text style={styles.stepTitle}>Step 2: Submit Payment Proof</Text>

                <Text style={styles.label}>Telebirr Transaction ID</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 4AB789XYZ"
                  placeholderTextColor="#666"
                  value={transactionId}
                  onChangeText={setTransactionId}
                  autoCapitalize="characters"
                />

                <Text style={styles.label}>Upload Transfer Screenshot</Text>
                <TouchableOpacity style={styles.uploadBox} onPress={handlePickScreenshot}>
                  {screenshotUri ? (
                    <Image source={{ uri: screenshotUri }} style={styles.screenshotPreview} resizeMode="cover" />
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, marginBottom: 4 }}>📸</Text>
                      <Text style={styles.uploadBoxText}>Tap to select screenshot from gallery</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitProof} disabled={submitting}>
                  {submitting ? (
                    <ActivityIndicator color="#0B0B0D" />
                  ) : (
                    <Text style={styles.submitBtnText}>Submit Proof ({amount} ETB)</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#16141C',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    color: '#FFB800',
    fontSize: 17,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loaderContainer: {
    padding: 40,
    alignItems: 'center',
  },
  pendingCard: {
    padding: 24,
    alignItems: 'center',
  },
  pendingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  pendingDesc: {
    color: '#DDD',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  pendingMetaBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 6,
  },
  metaLabel: {
    color: '#888',
    fontSize: 12,
  },
  metaVal: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  pendingPreviewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 20,
  },
  doneBtn: {
    backgroundColor: '#FFB800',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#0B0B0D',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollForm: {
    padding: 20,
  },
  sectionLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  planSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  planOption: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,184,0,0.2)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  planOptionActive: {
    backgroundColor: 'rgba(255,184,0,0.12)',
    borderColor: '#FFB800',
  },
  planTitle: {
    color: '#AAA',
    fontSize: 11,
    fontWeight: 'bold',
  },
  planPrice: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
  },
  planTextActive: {
    color: '#FFB800',
  },
  stepCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  stepTitle: {
    color: '#FFB800',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepInstruction: {
    color: '#CCC',
    fontSize: 12,
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  infoText: {
    color: '#888',
    fontSize: 12,
  },
  infoVal: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  copyBtn: {
    backgroundColor: 'rgba(255,184,0,0.15)',
    borderWidth: 1,
    borderColor: '#FFB800',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyBtnText: {
    color: '#FFB800',
    fontWeight: 'bold',
    fontSize: 12,
  },
  label: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 14,
  },
  uploadBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,184,0,0.3)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 110,
  },
  uploadBoxText: {
    color: '#888',
    fontSize: 12,
  },
  screenshotPreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  submitBtn: {
    backgroundColor: '#FFB800',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#0B0B0D',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
