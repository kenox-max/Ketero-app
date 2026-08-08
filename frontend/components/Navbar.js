import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';

export default function Navbar({
  currentScreen,
  setCurrentScreen,
  user,
  onNavigateToPayment,
  onNavigateToLanding,
  onLogout,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const isPremium = user?.isPremium || user?.badgeType === 'premium_verified';
  const isVerified = user?.isVerified || user?.badgeType === 'photo_verified';

  return (
    <View style={styles.navbar}>
      <View style={styles.navContainer}>
        {/* Left: Brand Logo & Title */}
        <TouchableOpacity
          style={styles.brandContainer}
          onPress={() => setCurrentScreen(user ? 'DASHBOARD' : 'LANDING')}
        >
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImg}
          />
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandTitle}>Ketero ቀጠሮ</Text>
            {isDesktop && <Text style={styles.brandSubtitle}>Authentic Ethiopian Matches</Text>}
          </View>
        </TouchableOpacity>

        {/* Center: Desktop Navigation Links (Hidden on Mobile) */}
        {isDesktop && (
          <View style={styles.navLinks}>
            <TouchableOpacity
              style={[styles.navItem, currentScreen === 'DASHBOARD' && styles.navItemActive]}
              onPress={() => setCurrentScreen('DASHBOARD')}
            >
              <Text style={[styles.navText, currentScreen === 'DASHBOARD' && styles.navTextActive]}>
                📊 Dashboard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, currentScreen === 'DISCOVERY' && styles.navItemActive]}
              onPress={() => setCurrentScreen('DISCOVERY')}
            >
              <Text style={[styles.navText, currentScreen === 'DISCOVERY' && styles.navTextActive]}>
                🔍 Discovery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, currentScreen === 'CONTACTS' && styles.navItemActive]}
              onPress={() => setCurrentScreen('CONTACTS')}
            >
              <Text style={[styles.navText, currentScreen === 'CONTACTS' && styles.navTextActive]}>
                👥 Contacts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, currentScreen === 'PROFILE' && styles.navItemActive]}
              onPress={() => setCurrentScreen('PROFILE')}
            >
              <Text style={[styles.navText, currentScreen === 'PROFILE' && styles.navTextActive]}>
                👤 Profile
              </Text>
            </TouchableOpacity>

            {user?.role === 'admin' && (
              <TouchableOpacity
                style={[styles.navItem, currentScreen === 'ADMIN' && styles.navItemActive]}
                onPress={() => setCurrentScreen('ADMIN')}
              >
                <Text style={[styles.navText, { color: '#EF4444' }, currentScreen === 'ADMIN' && styles.navTextActive]}>
                  🛡️ Admin
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Right: User Profile Avatar & Upgrade Button */}
        <View style={styles.rightContainer}>
          {!isPremium && (
            <TouchableOpacity style={styles.upgradeBtn} onPress={onNavigateToPayment}>
              <Text style={styles.upgradeBtnText}>Upgrade to Gold 👑</Text>
            </TouchableOpacity>
          )}

          {isPremium ? (
            <View style={styles.statusPillGold}>
              <Text style={styles.statusPillText}>👑 Gold VIP</Text>
            </View>
          ) : isVerified ? (
            <View style={styles.statusPillBlue}>
              <Text style={styles.statusPillText}>🔵 Verified</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => setCurrentScreen('PROFILE')}
          >
            <Image
              source={{
                uri: user?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
              }}
              style={styles.avatarImg}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: '#16181E',
    borderBottomWidth: 1,
    borderColor: '#262933',
    zIndex: 100,
    ...(Platform.OS === 'web'
      ? {
          position: 'sticky',
          top: 0,
        }
      : {}),
  },
  navContainer: {
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 65,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#F5B800',
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  brandTitle: {
    color: '#F5B800',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: '#A0A5B5',
    fontSize: 10,
    fontWeight: '500',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: 'rgba(245, 184, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 184, 0, 0.25)',
  },
  navText: {
    color: '#A0A5B5',
    fontSize: 14,
    fontWeight: '600',
  },
  navTextActive: {
    color: '#F5B800',
    fontWeight: '700',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  upgradeBtn: {
    backgroundColor: '#F5B800',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#F5B800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  upgradeBtnText: {
    color: '#0D0E12',
    fontWeight: '800',
    fontSize: 12,
  },
  statusPillGold: {
    backgroundColor: 'rgba(245, 184, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#F5B800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillBlue: {
    backgroundColor: 'rgba(29, 161, 242, 0.15)',
    borderWidth: 1,
    borderColor: '#1DA1F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#F5B800',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
});
