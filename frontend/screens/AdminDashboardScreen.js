import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen({ token, apiBaseUrl, onNavigateBack }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'reports', 'payments'
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Lightbox Modal state
  const [previewImage, setPreviewImage] = useState(null);

  // Processing payment ID
  const [processingPaymentId, setProcessingPaymentId] = useState(null);
  const [updatingReportId, setUpdatingReportId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await fetch(`${apiBaseUrl}/api/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setAnalytics(data);
        else Alert.alert('Admin Error', data.error || 'Failed to fetch analytics');
      } else if (activeTab === 'users') {
        const res = await fetch(`${apiBaseUrl}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setUsers(data);
        else Alert.alert('Admin Error', data.error || 'Failed to fetch users');
      } else if (activeTab === 'reports') {
        const res = await fetch(`${apiBaseUrl}/api/admin/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setReports(data);
        else Alert.alert('Admin Error', data.error || 'Failed to fetch support reports');
      } else if (activeTab === 'payments') {
        const res = await fetch(`${apiBaseUrl}/api/admin/pending-payments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setPendingPayments(data);
        else Alert.alert('Admin Error', data.error || 'Failed to fetch pending payment queue');
      }
    } catch (err) {
      console.error('Admin Fetch Error:', err);
      Alert.alert('Error', 'Network error reaching admin endpoints');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (requestId) => {
    setProcessingPaymentId(requestId);
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/approve-payment/${requestId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Payment Approved 🎉', 'User has been upgraded to VIP Gold Premium successfully.');
        setPendingPayments((prev) => prev.filter((p) => p._id !== requestId));
      } else {
        Alert.alert('Approval Error', data.error || 'Failed to approve payment');
      }
    } catch (err) {
      console.error('Approve Error:', err);
      Alert.alert('Error', 'Network error approving payment.');
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleRejectPayment = (requestId) => {
    Alert.prompt(
      'Reject Payment Request',
      'Please enter the reason for rejection (e.g. Invalid Transaction ID, Fake Receipt Screenshot):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject Request',
          style: 'destructive',
          onPress: async (reason) => {
            setProcessingPaymentId(requestId);
            try {
              const res = await fetch(`${apiBaseUrl}/api/admin/reject-payment/${requestId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: reason || 'Invalid Transaction ID or Screenshot' }),
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert('Payment Rejected', 'The user payment submission has been rejected.');
                setPendingPayments((prev) => prev.filter((p) => p._id !== requestId));
              } else {
                Alert.alert('Rejection Error', data.error || 'Failed to reject payment');
              }
            } catch (err) {
              Alert.alert('Error', 'Network error rejecting payment.');
            } finally {
              setProcessingPaymentId(null);
            }
          },
        },
      ]
    );
  };

  const handleVerifyPhoto = async (userId) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/verify-photo/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Photo Verified', data.message || 'User granted Photo Verified blue badge.');
        setUsers((prev) =>
          prev.map((u) =>
            u._id === userId ? { ...u, isVerified: true, badgeType: u.badgeType === 'premium_verified' ? 'premium_verified' : 'photo_verified' } : u
          )
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to verify photo');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error approving photo verification.');
    }
  };

  const handleUpdateReportStatus = async (reportId, newStatus) => {
    setUpdatingReportId(reportId);
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) => (r._id === reportId ? { ...r, status: newStatus } : r))
        );
        Alert.alert('Status Updated', `Report ticket status marked as "${newStatus}".`);
      } else {
        Alert.alert('Error', data.error || 'Failed to update ticket status');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error updating ticket status');
    } finally {
      setUpdatingReportId(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.gender?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onNavigateBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>🛡️ Admin Control Panel</Text>
          <Text style={styles.headerSubtitle}>Ketero Platform Operations & Verification Queue</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchData}>
          <Text style={styles.refreshBtnText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            📊 Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'payments' && styles.tabActive]}
          onPress={() => setActiveTab('payments')}
        >
          <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>
            💳 Pending Payments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
            👥 User Directory
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.tabActive]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>
            📩 Support Tickets
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content Area */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FFB800" />
          <Text style={styles.loaderText}>Loading Admin Data...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <Text style={styles.sectionHeader}>Key Performance Indicators (KPIs)</Text>

              <View style={styles.kpiGrid}>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiIcon}>👥</Text>
                  <Text style={styles.kpiValue}>{analytics?.totalUsers ?? '-'}</Text>
                  <Text style={styles.kpiLabel}>Total Registered Users</Text>
                </View>

                <View style={styles.kpiCard}>
                  <Text style={styles.kpiIcon}>👑</Text>
                  <Text style={styles.kpiValue}>{analytics?.premiumSubscribers ?? '-'}</Text>
                  <Text style={styles.kpiLabel}>VIP Premium Members</Text>
                </View>

                <View style={styles.kpiCard}>
                  <Text style={styles.kpiIcon}>💳</Text>
                  <Text style={styles.kpiValue}>{analytics?.pendingPaymentsCount ?? 0}</Text>
                  <Text style={styles.kpiLabel}>Pending Telebirr Queue</Text>
                </View>

                <View style={styles.kpiCard}>
                  <Text style={styles.kpiIcon}>⚡</Text>
                  <Text style={styles.kpiValue}>{analytics?.activeSockets ?? '-'}</Text>
                  <Text style={styles.kpiLabel}>Live Connections</Text>
                </View>

                <View style={styles.kpiCard}>
                  <Text style={styles.kpiIcon}>👫</Text>
                  <Text style={styles.kpiValue}>{analytics?.genderDemographics?.ratio ?? '-'}</Text>
                  <Text style={styles.kpiLabel}>Gender Demographics</Text>
                </View>

                <View style={styles.kpiCard}>
                  <Text style={styles.kpiIcon}>📩</Text>
                  <Text style={styles.kpiValue}>{analytics?.pendingReports ?? 0} / {analytics?.totalReports ?? 0}</Text>
                  <Text style={styles.kpiLabel}>Pending / Total Reports</Text>
                </View>
              </View>
            </ScrollView>
          )}

          {/* TAB 2: PENDING TELEBIRR PAYMENTS QUEUE */}
          {activeTab === 'payments' && (
            <View style={{ flex: 1, paddingHorizontal: 16 }}>
              {/* Metrics Widget */}
              <View style={styles.queueMetricsCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.queueMetricsTitle}>⏳ Pending Verification Queue</Text>
                  <Text style={styles.queueMetricsSub}>
                    {pendingPayments.length} Telebirr payment submission{pendingPayments.length !== 1 ? 's' : ''} awaiting review.
                  </Text>
                </View>
                <View style={styles.queueCountBadge}>
                  <Text style={styles.queueCountText}>{pendingPayments.length}</Text>
                </View>
              </View>

              <FlatList
                data={pendingPayments}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => {
                  const fullReceiptUrl = item.receiptImageUrl?.startsWith('/')
                    ? `${apiBaseUrl}${item.receiptImageUrl}`
                    : item.receiptImageUrl;

                  const isProcessing = processingPaymentId === item._id;

                  return (
                    <View style={styles.paymentCard}>
                      {/* User Header Info */}
                      <View style={styles.paymentUserRow}>
                        <Image
                          source={{
                            uri:
                              item.userId?.profilePhoto ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
                          }}
                          style={styles.paymentUserAvatar}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.paymentUserName}>{item.userId?.name || 'Ketero User'}</Text>
                          <Text style={styles.paymentUserContact}>
                            📞 {item.userId?.phone || 'N/A'}{item.userId?.email ? `  •  ✉️ ${item.userId.email}` : ''}
                          </Text>
                        </View>
                        <View style={styles.planTypeTag}>
                          <Text style={styles.planTypeTagText}>{item.planType.toUpperCase()}</Text>
                        </View>
                      </View>

                      {/* Payment Metadata Grid */}
                      <View style={styles.paymentMetaGrid}>
                        <View style={styles.paymentMetaBox}>
                          <Text style={styles.paymentMetaLabel}>Submitted Tx ID</Text>
                          <Text style={styles.paymentMetaVal} numberOfLines={1}>{item.transactionId}</Text>
                        </View>

                        <View style={styles.paymentMetaBox}>
                          <Text style={styles.paymentMetaLabel}>Amount</Text>
                          <Text style={styles.paymentMetaVal}>{item.amount} ETB</Text>
                        </View>

                        <View style={styles.paymentMetaBox}>
                          <Text style={styles.paymentMetaLabel}>Submitted Time</Text>
                          <Text style={styles.paymentMetaVal}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                      </View>

                      {/* Interactive Receipt Thumbnail */}
                      <Text style={styles.receiptLabel}>Receipt Screenshot Proof (Tap to inspect):</Text>
                      <TouchableOpacity onPress={() => setPreviewImage(fullReceiptUrl)}>
                        <Image
                          source={{ uri: fullReceiptUrl }}
                          style={styles.receiptThumbnail}
                          resizeMode="cover"
                        />
                        <View style={styles.inspectOverlay}>
                          <Text style={styles.inspectOverlayText}>🔍 Click to Enlarge Screenshot</Text>
                        </View>
                      </TouchableOpacity>

                      {/* Action Buttons */}
                      <View style={styles.paymentActionRow}>
                        <TouchableOpacity
                          style={[styles.approveBtn, isProcessing && { opacity: 0.6 }]}
                          disabled={isProcessing}
                          onPress={() => handleApprovePayment(item._id)}
                        >
                          {isProcessing ? (
                            <ActivityIndicator color="#0B0B0D" size="small" />
                          ) : (
                            <Text style={styles.approveBtnText}>✅ Approve & Grant VIP</Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.rejectBtn, isProcessing && { opacity: 0.6 }]}
                          disabled={isProcessing}
                          onPress={() => handleRejectPayment(item._id)}
                        >
                          <Text style={styles.rejectBtnText}>❌ Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>🎉 All Telebirr payment proofs have been reviewed! Queue is empty.</Text>
                }
              />
            </View>
          )}

          {/* TAB 3: USER DIRECTORY */}
          {activeTab === 'users' && (
            <View style={{ flex: 1, paddingHorizontal: 16 }}>
              <TextInput
                style={styles.searchInput}
                placeholder="🔍 Search users by name, gender, or role..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Text style={styles.privacyNote}>
                🔒 Privacy Protection Active: Passwords, emails, phone numbers, exact location coordinates, and private messages are strictly excluded from admin views.
              </Text>

              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingBottom: 30 }}
                renderItem={({ item }) => (
                  <View style={styles.userCard}>
                    <View style={styles.userHeaderRow}>
                      <Text style={styles.userName}>{item.name}</Text>
                      <View style={styles.badgeRow}>
                        {item.role === 'admin' && <Text style={styles.adminBadge}>ADMIN</Text>}
                        {(item.isPremium || item.badgeType === 'premium_verified') ? (
                          <Text style={styles.vipBadge}>👑 GOLD</Text>
                        ) : (item.isVerified || item.badgeType === 'photo_verified') ? (
                          <Text style={styles.verifiedBadge}>🔵 PHOTO VERIFIED</Text>
                        ) : (
                          <Text style={[styles.verifiedBadge, { backgroundColor: 'rgba(255,255,255,0.05)', color: '#888' }]}>NO BADGE</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.userMetaRow}>
                      <Text style={styles.metaItem}>Gender: <Text style={styles.metaVal}>{item.gender}</Text></Text>
                      <Text style={styles.metaItem}>Age: <Text style={styles.metaVal}>{item.age}</Text></Text>
                      <Text style={styles.metaItem}>Joined: <Text style={styles.metaVal}>{new Date(item.createdAt).toLocaleDateString()}</Text></Text>
                    </View>
                    {(!item.isVerified && item.badgeType !== 'photo_verified' && item.badgeType !== 'premium_verified' && !item.isPremium) && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#3B82F6', marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6 }]}
                        onPress={() => handleVerifyPhoto(item._id)}
                      >
                        <Text style={[styles.actionBtnText, { fontSize: 12 }]}>Grant Photo Verification 🔵</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No user profiles found.</Text>
                }
              />
            </View>
          )}

          {/* TAB 4: SUPPORT QUEUE */}
          {activeTab === 'reports' && (
            <FlatList
              data={reports}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              renderItem={({ item }) => {
                const statusColor =
                  item.status === 'resolved'
                    ? '#10B981'
                    : item.status === 'in-progress'
                    ? '#3B82F6'
                    : '#EF4444';

                return (
                  <View style={styles.reportCard}>
                    <View style={styles.reportHeader}>
                      <Text style={styles.reportSubject}>{item.subject}</Text>
                      <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: `${statusColor}22` }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {item.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.reportDesc}>{item.description}</Text>

                    <View style={styles.reporterRow}>
                      <Text style={styles.reporterText}>
                        👤 Reporter: {item.reporterId?.name || 'Unknown User'} ({item.reporterId?.email || 'No email'})
                      </Text>
                      <Text style={styles.reportDate}>
                        {new Date(item.createdAt).toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.actionRow}>
                      {item.status !== 'in-progress' && item.status !== 'resolved' && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
                          disabled={updatingReportId === item._id}
                          onPress={() => handleUpdateReportStatus(item._id, 'in-progress')}
                        >
                          <Text style={styles.actionBtnText}>Mark In-Progress</Text>
                        </TouchableOpacity>
                      )}

                      {item.status !== 'resolved' && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                          disabled={updatingReportId === item._id}
                          onPress={() => handleUpdateReportStatus(item._id, 'resolved')}
                        >
                          <Text style={styles.actionBtnText}>Mark Resolved</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No support tickets reported yet.</Text>
              }
            />
          )}
        </View>
      )}

      {/* RECEIPT SCREENSHOT LIGHTBOX MODAL */}
      <Modal visible={!!previewImage} animationType="fade" transparent onRequestClose={() => setPreviewImage(null)}>
        <View style={styles.lightboxOverlay}>
          <TouchableOpacity style={styles.lightboxCloseBtn} onPress={() => setPreviewImage(null)}>
            <Text style={styles.lightboxCloseText}>✕ Close</Text>
          </TouchableOpacity>
          {previewImage && (
            <Image source={{ uri: previewImage }} style={styles.lightboxImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 35,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.15)',
  },
  backBtn: {
    padding: 8,
  },
  backBtnText: {
    color: '#FFB800',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFB800',
    fontSize: 17,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
  },
  refreshBtn: {
    padding: 8,
  },
  refreshBtnText: {
    fontSize: 16,
  },
  tabContainer: {
    backgroundColor: 'rgba(22, 20, 28, 0.9)',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    maxHeight: 50,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: {
    borderColor: '#FFB800',
    backgroundColor: 'rgba(255, 184, 0, 0.05)',
  },
  tabText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFB800',
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#FFB800',
    marginTop: 10,
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: 'rgba(22, 20, 28, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  kpiIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  kpiValue: {
    color: '#FFB800',
    fontSize: 20,
    fontWeight: 'bold',
  },
  kpiLabel: {
    color: '#AAA',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  queueMetricsCard: {
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#FFB800',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 14,
  },
  queueMetricsTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  queueMetricsSub: {
    color: '#DDD',
    fontSize: 11,
    marginTop: 2,
  },
  queueCountBadge: {
    backgroundColor: '#FFB800',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueCountText: {
    color: '#0B0B0D',
    fontWeight: 'bold',
    fontSize: 16,
  },
  paymentCard: {
    backgroundColor: 'rgba(22, 20, 28, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.2)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  paymentUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#FFB800',
    marginRight: 10,
  },
  paymentUserName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  paymentUserContact: {
    color: '#AAA',
    fontSize: 11,
    marginTop: 2,
  },
  planTypeTag: {
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#FFB800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  planTypeTagText: {
    color: '#FFB800',
    fontSize: 10,
    fontWeight: 'bold',
  },
  paymentMetaGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    justifyContent: 'space-around',
  },
  paymentMetaBox: {
    alignItems: 'center',
  },
  paymentMetaLabel: {
    color: '#888',
    fontSize: 10,
    marginBottom: 2,
  },
  paymentMetaVal: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  receiptLabel: {
    color: '#DDD',
    fontSize: 11,
    marginBottom: 6,
  },
  receiptThumbnail: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
  },
  inspectOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inspectOverlayText: {
    color: '#FFB800',
    fontSize: 10,
    fontWeight: 'bold',
  },
  paymentActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  approveBtn: {
    flex: 2,
    backgroundColor: '#FFB800',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#0B0B0D',
    fontWeight: 'bold',
    fontSize: 13,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  lightboxCloseText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  lightboxImage: {
    width: width - 40,
    height: width * 1.3,
    borderRadius: 16,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    color: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    marginTop: 14,
    marginBottom: 10,
  },
  privacyNote: {
    color: '#10B981',
    fontSize: 10,
    marginBottom: 14,
    fontStyle: 'italic',
    lineHeight: 14,
  },
  userCard: {
    backgroundColor: 'rgba(22, 20, 28, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  userHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  adminBadge: {
    backgroundColor: '#EF4444',
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vipBadge: {
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    color: '#FFB800',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFB800',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#10B981',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  userMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    color: '#888',
    fontSize: 11,
  },
  metaVal: {
    color: '#DDD',
    fontWeight: '600',
  },
  reportCard: {
    backgroundColor: 'rgba(22, 20, 28, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.15)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportSubject: {
    color: '#FFB800',
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  reportDesc: {
    color: '#DDD',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  reporterRow: {
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
    marginBottom: 12,
  },
  reporterText: {
    color: '#999',
    fontSize: 11,
  },
  reportDate: {
    color: '#666',
    fontSize: 10,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 13,
  },
});
