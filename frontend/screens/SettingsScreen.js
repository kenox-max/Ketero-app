import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';

export default function SettingsScreen({ token, apiBaseUrl, user, onNavigateBack, onNavigateToAdmin }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    setLoadingReports(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/reports/my-reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setMyReports(data);
      }
    } catch (err) {
      console.error('Fetch My Reports Error:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Incomplete Form', 'Please provide both a subject and a description of your issue.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Report Submitted', 'Your ticket has been logged with customer support.');
        setSubject('');
        setDescription('');
        fetchMyReports();
      } else {
        Alert.alert('Error', data.error || 'Failed to submit report.');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error submitting report ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onNavigateBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ Settings & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Admin Shortcut Card if Role is Admin */}
        {user?.role === 'admin' && (
          <TouchableOpacity style={styles.adminBannerCard} onPress={onNavigateToAdmin}>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminBannerTitle}>🛡️ Admin Control Dashboard</Text>
              <Text style={styles.adminBannerSub}>Access system metrics, user directory, and global report queue.</Text>
            </View>
            <Text style={styles.adminBannerArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Section 1: Submit Support Ticket */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📩 Report a Problem / Support</Text>
          <Text style={styles.sectionDesc}>
            Having trouble with matches, payments, or security? Submit a ticket directly to our support team.
          </Text>

          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Payment issue with Telebirr / Profile photo upload error"
            placeholderTextColor="#666"
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.label}>Issue Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe what happened in detail..."
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitTicket} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#0B0B0D" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Support Ticket</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Section 2: Ticket Resolution History */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>📋 My Submitted Tickets</Text>
            <TouchableOpacity onPress={fetchMyReports}>
              <Text style={styles.refreshText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>

          {loadingReports ? (
            <ActivityIndicator color="#FFB800" style={{ marginVertical: 20 }} />
          ) : myReports.length === 0 ? (
            <Text style={styles.emptyText}>You haven't submitted any support tickets yet.</Text>
          ) : (
            myReports.map((item) => {
              const statusColor =
                item.status === 'resolved'
                  ? '#10B981'
                  : item.status === 'in-progress'
                  ? '#3B82F6'
                  : '#EF4444';

              return (
                <View key={item._id} style={styles.ticketItem}>
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketSubject}>{item.subject}</Text>
                    <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: `${statusColor}22` }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.ticketDesc}>{item.description}</Text>
                  <Text style={styles.ticketDate}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
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
  headerTitle: {
    color: '#FFB800',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  adminBannerCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  adminBannerTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  adminBannerSub: {
    color: '#DDD',
    fontSize: 11,
    marginTop: 2,
  },
  adminBannerArrow: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'rgba(22, 20, 28, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.2)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFB800',
    fontSize: 15,
    fontWeight: 'bold',
  },
  sectionDesc: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  refreshText: {
    color: '#FFB800',
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
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 16,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#FFB800',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#0B0B0D',
    fontWeight: 'bold',
    fontSize: 14,
  },
  ticketItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketSubject: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  ticketDesc: {
    color: '#AAA',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  ticketDate: {
    color: '#666',
    fontSize: 10,
  },
  emptyText: {
    color: '#777',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
});
