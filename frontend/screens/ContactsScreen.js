import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';

export default function ContactsScreen({
  token,
  apiBaseUrl,
  onSelectContact,
  onNavigateToDiscovery,
}) {
  const [connections, setConnections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      if (!apiBaseUrl) {
        // Mock fallback if running in offline mode
        setConnections([
          {
            _id: 'mock_user_1',
            name: 'Selamawit Kebede',
            age: 24,
            location: 'Addis Ababa',
            religion: 'Orthodox',
            profilePhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200',
            verifiedStatus: true,
            isPremium: false,
          },
        ]);
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/matches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setConnections(data);
      }
    } catch (err) {
      console.error('Fetch connections failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [apiBaseUrl, token]);

  const filteredConnections = connections.filter((conn) =>
    conn.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConnectionItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => onSelectContact(item)}>
      <Image source={{ uri: item.profilePhoto }} style={styles.avatar} />
      <View style={styles.details}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.name}</Text>
          {item.verifiedStatus && <Text style={styles.verifiedIcon}>✓</Text>}
          {item.isPremium && <Text style={styles.crownIcon}>👑</Text>}
        </View>
        <Text style={styles.subtext}>
          {item.age} • {item.location} • {item.religion}
        </Text>
        <Text style={styles.chatPrompt}>Tap to open chat</Text>
      </View>
      <Text style={styles.chevron}>→</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Connections</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchConnections} disabled={loading}>
          <Text style={styles.refreshBtnText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search matches..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Main Body */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E4A853" />
          <Text style={styles.loadingText}>Loading connections...</Text>
        </View>
      ) : filteredConnections.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.noConnectionsTitle}>No Connections Found</Text>
          <Text style={styles.noConnectionsDesc}>
            {searchQuery
              ? "No results match your search query."
              : "Mutual matches will appear here. Find people near you!"}
          </Text>
          {!searchQuery && (
            <TouchableOpacity style={styles.exploreBtn} onPress={onNavigateToDiscovery}>
              <Text style={styles.exploreBtnText}>Discover People</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredConnections}
          keyExtractor={(item) => item._id}
          renderItem={renderConnectionItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#2C2C2C',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E4A853',
  },
  refreshBtn: {
    padding: 6,
  },
  refreshBtnText: {
    fontSize: 16,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2C2C2C',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E4A853',
  },
  details: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  verifiedIcon: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  crownIcon: {
    fontSize: 12,
  },
  subtext: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  chatPrompt: {
    color: '#E4A853',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  chevron: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    color: '#888',
    marginTop: 15,
    fontSize: 14,
  },
  noConnectionsTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  noConnectionsDesc: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  exploreBtn: {
    backgroundColor: '#E4A853',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 20,
  },
  exploreBtnText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
