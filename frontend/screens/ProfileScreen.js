import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Theme from '../styles/theme';

const ETHIOPIAN_CITIES = ['Addis Ababa', 'Hawassa', 'Adama', 'Bahir Dar', 'Mekelle', 'Gondar', 'Dire Dawa', 'Jimma'];
const RELIGIONS = ['Orthodox', 'Protestant', 'Muslim', 'Catholic', 'Other'];
const LANGUAGES = ['Amharic', 'Afaan Oromoo', 'Tigrinya', 'Somali', 'English'];

export default function ProfileScreen({
  token,
  apiBaseUrl,
  user,
  onUpdateProfile,
  onLogout,
  onNavigateToSettings,
}) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    location: user?.location || 'Addis Ababa',
    religion: user?.religion || 'Orthodox',
    languages: user?.languages || [],
    hobbies: user?.hobbies?.join(', ') || '',
    profilePhoto: user?.profilePhoto || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  React.useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || prev.email,
        location: user.location || prev.location,
        religion: user.religion || prev.religion,
        languages: user.languages || prev.languages,
        profilePhoto: user.profilePhoto || prev.profilePhoto,
      }));
    }
  }, [user]);

  const handlePickProfilePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera roll permissions are required to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let imageUri = asset.uri;
        if (asset.base64) {
          imageUri = `data:image/jpeg;base64,${asset.base64}`;
        }
        uploadProfileImage(imageUri);
      }
    } catch (err) {
      console.error('Pick Profile Photo Error:', err);
      // Fallback text input prompt if device picker unavailable
      Alert.prompt('Change Profile Picture', 'Enter photo URL:', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (url) => {
            if (url) {
              uploadProfileImage(url);
            }
          },
        },
      ]);
    }
  };

  const uploadProfileImage = async (imageUri) => {
    setUploadingPhoto(true);
    try {
      let response;
      const isBase64OrUrl = imageUri.startsWith('data:') || imageUri.startsWith('http://') || imageUri.startsWith('https://') || Platform.OS === 'web';

      if (isBase64OrUrl) {
        // Send direct JSON payload for Web or base64 data URIs
        response = await fetch(`${apiBaseUrl}/api/users/profile-picture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ image: imageUri }),
        });
      } else {
        // Native mobile FormData upload
        const formDataPayload = new FormData();
        const filename = imageUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formDataPayload.append('image', {
          uri: imageUri,
          name: filename,
          type,
        });

        response = await fetch(`${apiBaseUrl}/api/users/profile-picture`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataPayload,
        });
      }

      const data = await response.json();
      if (response.ok && (data.profilePhoto || data.user?.profilePhoto)) {
        const photoPath = data.profilePhoto || data.user?.profilePhoto;
        const fullPhotoUrl = photoPath.startsWith('/') ? `${apiBaseUrl}${photoPath}` : photoPath;
        setFormData((prev) => ({ ...prev, profilePhoto: fullPhotoUrl }));
        onUpdateProfile(data.user || {
          ...user,
          profilePhoto: fullPhotoUrl,
        });
        Alert.alert('Success 🎉', 'Profile picture updated successfully!');
      } else {
        Alert.alert('Upload Error', data.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Upload Image Error:', err);
      Alert.alert('Error', 'Network error uploading profile photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const toggleLanguage = (lang) => {
    setFormData((prev) => {
      const langs = [...prev.languages];
      if (langs.includes(lang)) {
        return { ...prev, languages: langs.filter((l) => l !== lang) };
      } else {
        return { ...prev, languages: [...langs, lang] };
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        email: formData.email,
        location: formData.location,
        religion: formData.religion,
        languages: formData.languages,
        hobbies: formData.hobbies ? formData.hobbies.split(',').map((h) => h.trim()) : [],
        profilePhoto: formData.profilePhoto,
      };

      if (!apiBaseUrl) {
        // Mock success when offline
        onUpdateProfile({
          ...user,
          ...payload,
        });
        Alert.alert('Success', 'Profile updated successfully (Offline Mode).');
        setSaving(false);
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        onUpdateProfile(data);
        Alert.alert('Success', 'Your profile changes have been saved!');
      } else {
        Alert.alert('Error', data.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <TouchableOpacity style={styles.avatarTouchable} onPress={handlePickProfilePhoto} disabled={uploadingPhoto}>
            <Image
              source={{
                uri: formData.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
              }}
              style={styles.avatar}
            />
            <View style={styles.cameraIconBadge}>
              {uploadingPhoto ? <ActivityIndicator size="small" color="#0B0B0D" /> : <Text style={styles.cameraIconText}>📷</Text>}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickProfilePhoto}>
            <Text style={styles.changePhotoText}>Tap to Upload Device Photo</Text>
          </TouchableOpacity>

          <Text style={styles.userName}>
            {user?.name}, {user?.age}
          </Text>
          <Text style={styles.phoneText}>📞 {user?.phone}{user?.email ? `  •  ✉️ ${user.email}` : ''}</Text>
          <View style={styles.badgeRow}>
            {user?.role === 'admin' && <Text style={styles.adminBadge}>🛡️ Admin</Text>}
            {(user?.isPremium || user?.badgeType === 'premium_verified') ? (
              <Text style={styles.vipBadge}>👑 Premium Gold</Text>
            ) : (user?.isVerified || user?.badgeType === 'photo_verified') ? (
              <Text style={styles.verifiedBadge}>✓ Photo Verified</Text>
            ) : null}
          </View>
        </View>

        {/* Verification Callout Banner for Unverified Users */}
        {!user?.isPremium && !user?.isVerified && (
          <View style={styles.verificationBanner}>
            <Text style={styles.verificationBannerTitle}>Get Verified & Build Trust 🛡️</Text>
            <Text style={styles.verificationBannerText}>
              Get Verified: Upgrade to Premium to unlock the Gold Verified Badge 👑 or complete Photo Verification to show matches you are real!
            </Text>
            <TouchableOpacity
              style={styles.verificationBannerBtn}
              onPress={() => onNavigateToSettings && onNavigateToSettings()}
            >
              <Text style={styles.verificationBannerBtnText}>Get Badge & Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Edit Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Edit Demographics</Text>

          {/* Email Address */}
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(val) => setFormData({ ...formData, email: val })}
            placeholder="Email Address"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Profile Photo URL / Device Picker Action */}
          <Text style={styles.label}>Profile Photo URL</Text>
          <View style={styles.photoUrlRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={formData.profilePhoto}
              onChangeText={(val) => setFormData({ ...formData, profilePhoto: val })}
              placeholder="Image URL or tap image above"
              placeholderTextColor="#666"
            />
            <TouchableOpacity style={styles.uploadMiniBtn} onPress={handlePickProfilePhoto}>
              <Text style={styles.uploadMiniBtnText}>Choose Image</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 20 }} />

          {/* Location Selector */}
          <Text style={styles.label}>Location / City</Text>
          <View style={styles.pickerContainer}>
            {ETHIOPIAN_CITIES.map((city) => (
              <TouchableOpacity
                key={city}
                style={[
                  styles.pickerItem,
                  formData.location === city && styles.pickerItemActive,
                ]}
                onPress={() => setFormData({ ...formData, location: city })}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    formData.location === city && styles.pickerItemTextActive,
                  ]}
                >
                  {city}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Religion Selector */}
          <Text style={styles.label}>Religion</Text>
          <View style={styles.pickerContainer}>
            {RELIGIONS.map((rel) => (
              <TouchableOpacity
                key={rel}
                style={[
                  styles.pickerItem,
                  formData.religion === rel && styles.pickerItemActive,
                ]}
                onPress={() => setFormData({ ...formData, religion: rel })}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    formData.religion === rel && styles.pickerItemTextActive,
                  ]}
                >
                  {rel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Languages Selector */}
          <Text style={styles.label}>Languages Spoken</Text>
          <View style={styles.pickerContainer}>
            {LANGUAGES.map((lang) => {
              const isSelected = formData.languages.includes(lang);
              return (
                <TouchableOpacity
                  key={lang}
                  style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                  onPress={() => toggleLanguage(lang)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      isSelected && styles.pickerItemTextActive,
                    ]}
                  >
                    {lang}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Hobbies / Bio */}
          <Text style={styles.label}>Hobbies & Bio (comma separated)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.hobbies}
            onChangeText={(val) => setFormData({ ...formData, hobbies: val })}
            placeholder="e.g., Traditional Dancing, Chess, Reading"
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
          />

          {/* Save Button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#121212" />
            ) : (
              <Text style={styles.saveBtnText}>Save Profile Details</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Settings & Support Button */}
        <TouchableOpacity style={styles.settingsBtn} onPress={onNavigateToSettings}>
          <Text style={styles.settingsBtnText}>⚙️ Settings & Support Center</Text>
        </TouchableOpacity>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out Account</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFB800',
  },
  scrollContent: {
    maxWidth: 800,
    width: '100%',
    marginHorizontal: 'auto',
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  userCard: {
    ...Theme.glassCard,
    padding: 24,
    alignItems: 'center',
    marginBottom: 25,
  },
  avatarTouchable: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFB800',
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFB800',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0B0B0D',
  },
  cameraIconText: {
    fontSize: 14,
  },
  changePhotoText: {
    color: '#FFB800',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  adminBadge: {
    backgroundColor: '#EF4444',
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  photoUrlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadMiniBtn: {
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#FFB800',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadMiniBtnText: {
    color: '#FFB800',
    fontSize: 12,
    fontWeight: 'bold',
  },
  settingsBtn: {
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderWidth: 1.5,
    borderColor: '#FFB800',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  settingsBtnText: {
    color: '#FFB800',
    fontWeight: 'bold',
    fontSize: 15,
  },
  userName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  phoneText: {
    color: '#A0A0AA',
    fontSize: 13,
    marginTop: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vipBadge: {
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#FFB800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  formCard: {
    backgroundColor: 'rgba(22, 20, 28, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.15)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 25,
  },
  sectionTitle: {
    color: '#FFB800',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 10,
  },
  label: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: '#FFF',
    borderBottomWidth: 1.5,
    borderColor: 'rgba(255, 184, 0, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 20,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  pickerItem: {
    backgroundColor: 'rgba(22, 20, 28, 0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 184, 0, 0.12)',
  },
  pickerItemActive: {
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    borderColor: '#FFB800',
  },
  pickerItemText: {
    color: '#A0A0AA',
    fontSize: 12,
  },
  pickerItemTextActive: {
    color: '#FFB800',
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: '#FFB800',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  saveBtnText: {
    color: '#0B0B0D',
    fontWeight: 'bold',
    fontSize: 15,
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 15,
  },
  verificationBanner: {
    backgroundColor: 'rgba(255, 184, 0, 0.08)',
    borderColor: '#FFB800',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  verificationBannerTitle: {
    color: '#FFB800',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  verificationBannerText: {
    color: '#DDD',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  verificationBannerBtn: {
    backgroundColor: '#FFB800',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  verificationBannerBtnText: {
    color: '#0B0B0D',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
