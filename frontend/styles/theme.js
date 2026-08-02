export const Theme = {
  colors: {
    background: '#0B0B0D',
    gradientStart: '#131018',
    gradientEnd: '#0B0B0D',
    
    primaryGold: '#FFB800',
    darkGold: '#E59800',
    glowGold: 'rgba(255, 184, 0, 0.65)',
    goldBorder: 'rgba(255, 184, 0, 0.15)',
    
    glassBg: 'rgba(22, 20, 28, 0.75)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    
    textPrimary: '#FFFFFF',
    textSecondary: '#A0A0AA',
    textMuted: '#71717A',
    
    error: '#EF4444',
    success: '#10B981',
  },
  
  fonts: {
    bold: 'System', // Standard System fonts are fallback for React Native
    medium: 'System',
    regular: 'System',
  },

  glassCard: {
    backgroundColor: 'rgba(22, 20, 28, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.15)',
    borderRadius: 24,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  
  spotlightBeam: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: '100%',
    height: '100%',
    opacity: 0.15,
  }
};

export default Theme;
