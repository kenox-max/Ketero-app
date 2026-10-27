import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WebInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone || window.localStorage.getItem('ketero-install-dismissed') === 'true') {
      return undefined;
    }

    setVisible(true);

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleAppInstalled = () => {
      setVisible(false);
      window.localStorage.removeItem('ketero-install-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem('ketero-install-dismissed', 'true');
    setVisible(false);
  };

  const install = async () => {
    if (showInstructions) {
      dismiss();
      return;
    }

    if (!installPrompt) {
      setShowInstructions(true);
      return;
    }

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (outcome === 'accepted') setVisible(false);
  };

  if (Platform.OS !== 'web' || !visible) return null;

  const isAppleMobile = /iPhone|iPad|iPod/.test(window.navigator.userAgent);

  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.message}>
        <Text style={styles.title}>Install Ketero</Text>
        <Text style={styles.description}>
          {showInstructions
            ? isAppleMobile
              ? 'Tap Share, then choose Add to Home Screen.'
              : 'Open your browser menu and choose Install app or Add to Home Screen.'
            : 'Add Ketero to your home screen for quick access.'}
        </Text>
      </View>
      <TouchableOpacity style={styles.installButton} onPress={install} accessibilityRole="button">
        <Text style={styles.installButtonText}>{showInstructions ? 'Got it' : 'Install'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.dismissButton}
        onPress={dismiss}
        accessibilityLabel="Dismiss install prompt"
        accessibilityRole="button"
      >
        <Text style={styles.dismissButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1D22',
    borderColor: '#383A42',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    color: '#C4C5CC',
    fontSize: 13,
    lineHeight: 18,
  },
  installButton: {
    backgroundColor: '#E4A853',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  installButtonText: {
    color: '#17120B',
    fontSize: 14,
    fontWeight: '700',
  },
  dismissButton: {
    marginLeft: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  dismissButtonText: {
    color: '#C4C5CC',
    fontSize: 22,
    lineHeight: 24,
  },
});
