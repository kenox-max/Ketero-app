import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function LandingScreen({ onNavigateToRegister, onNavigateToLogin }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View style={styles.brandRow}>
            <Image source={require('../assets/logo.png')} style={styles.headerLogoImg} />
            <Text style={styles.brandName}>Ketero ቀጠሮ</Text>
          </View>
          <View style={styles.headerAuthBtns}>
            <TouchableOpacity style={styles.headerLoginBtn} onPress={onNavigateToLogin}>
              <Text style={styles.headerLoginBtnText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerRegisterBtn} onPress={onNavigateToRegister}>
              <Text style={styles.headerRegisterBtnText}>Get Started 👑</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image source={require('../assets/logo.png')} style={styles.heroLogoImg} />

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>🇪🇹 #1 Culturally Matched Dating App in Ethiopia</Text>
          </View>

          <Text style={styles.heroTitle}>
            Find Your Authentic <Text style={{ color: '#F5B800' }}>Ethiopian Match</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Connect with verified singles in Addis Ababa, Hawassa, Adama, Bahir Dar, Mekelle & worldwide based on shared culture, language, and values.
          </Text>

          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.mainCtaBtn} onPress={onNavigateToRegister}>
              <Text style={styles.mainCtaBtnText}>Create Account Free 🚀</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryCtaBtn} onPress={onNavigateToLogin}>
              <Text style={styles.secondaryCtaBtnText}>Sign In to Account</Text>
            </TouchableOpacity>
          </View>

          {/* Stat Counter Strip */}
          <View style={styles.statsStrip}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>50,000+</Text>
              <Text style={styles.statLabel}>Active Members</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>98%</Text>
              <Text style={styles.statLabel}>Cultural Alignment</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>Telebirr ⚡</Text>
              <Text style={styles.statLabel}>Instant Upgrades</Text>
            </View>
          </View>
        </View>

        {/* Features Highlights Grid */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionHeader}>Why Ketero ቀጠሮ?</Text>
          <Text style={styles.sectionSub}>Designed specifically for Ethiopian cultural dynamics & modern dating</Text>

          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🏛️</Text>
              <Text style={styles.featureTitle}>Cultural Match Engine</Text>
              <Text style={styles.featureDesc}>
                Filter matches seamlessly by Religion (Orthodox, Protestant, Muslim, Catholic), Spoken Languages (Amharic, Afaan Oromoo, Tigrinya, Somali, English), and Region.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>💳</Text>
              <Text style={styles.featureTitle}>Telebirr & Chapa Payment</Text>
              <Text style={styles.featureDesc}>
                No foreign credit cards needed! Upgrade to VIP Premium instantly using local Telebirr and Chapa payments with 1-click manual proof verification.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>👑</Text>
              <Text style={styles.featureTitle}>3-Tier Anti-Scam Badges</Text>
              <Text style={styles.featureDesc}>
                Stay safe from catfish & fake accounts with Gold Premium Verified badges and free Blue Selfie Photo Checkmarks.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Ketero ቀጠሮ. All rights reserved. Made with ❤️ for Ethiopia.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0E12',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  topHeader: {
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogoImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#F5B800',
  },
  heroLogoImg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#F5B800',
    marginBottom: 24,
    shadowColor: '#F5B800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  brandName: {
    color: '#F5B800',
    fontSize: 22,
    fontWeight: '800',
  },
  headerAuthBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLoginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  headerLoginBtnText: {
    color: '#A0A5B5',
    fontSize: 14,
    fontWeight: '600',
  },
  headerRegisterBtn: {
    backgroundColor: '#F5B800',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  headerRegisterBtnText: {
    color: '#0D0E12',
    fontWeight: '800',
    fontSize: 14,
  },
  heroSection: {
    maxWidth: 900,
    width: '100%',
    marginHorizontal: 'auto',
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
    textAlign: 'center',
  },
  heroBadge: {
    backgroundColor: 'rgba(245, 184, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 184, 0, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  heroBadgeText: {
    color: '#F5B800',
    fontSize: 13,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: width > 768 ? 48 : 32,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: width > 768 ? 58 : 40,
    marginBottom: 16,
  },
  heroSubtitle: {
    color: '#A0A5B5',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 680,
    marginBottom: 32,
  },
  ctaRow: {
    flexDirection: width > 600 ? 'row' : 'column',
    gap: 16,
    marginBottom: 48,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainCtaBtn: {
    backgroundColor: '#F5B800',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#F5B800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    minWidth: 220,
    alignItems: 'center',
  },
  mainCtaBtnText: {
    color: '#0D0E12',
    fontWeight: '900',
    fontSize: 16,
  },
  secondaryCtaBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: '#262933',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    minWidth: 220,
    alignItems: 'center',
  },
  secondaryCtaBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: '#16181E',
    borderWidth: 1,
    borderColor: '#262933',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
    maxWidth: 700,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statVal: {
    color: '#F5B800',
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: '#A0A5B5',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#262933',
  },
  featuresSection: {
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 50,
  },
  sectionHeader: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSub: {
    color: '#A0A5B5',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 36,
  },
  featuresGrid: {
    flexDirection: width > 768 ? 'row' : 'column',
    gap: 20,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#16181E',
    borderWidth: 1,
    borderColor: '#262933',
    borderRadius: 24,
    padding: 28,
  },
  featureIcon: {
    fontSize: 36,
    marginBottom: 16,
  },
  featureTitle: {
    color: '#F5B800',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  featureDesc: {
    color: '#A0A5B5',
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto',
    alignSelf: 'center',
    borderTopWidth: 1,
    borderColor: '#262933',
    paddingTop: 30,
    marginTop: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#71717A',
    fontSize: 13,
  },
});
