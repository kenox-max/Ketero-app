import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

export default function StoryBar({ token, apiBaseUrl, currentUser }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Story Upload Modal state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  // Story Viewer Modal state
  const [viewerModalVisible, setViewerModalVisible] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    if (!token || !apiBaseUrl) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/stories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setStories(data);
      }
    } catch (err) {
      console.error('Fetch Stories Error:', err);
    }
  };

  // Select image from device gallery or camera using expo-image-picker
  const handlePickMedia = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Media library access permission is required to post stories.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
        setUploadModalVisible(true);
      }
    } catch (err) {
      console.error('Pick Media Error:', err);
      // Fallback for web or dev environments if launcher fails
      Alert.prompt(
        'Upload Story Media',
        'Enter an image URL for your 24-hour story:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: (url) => {
              if (url) {
                setSelectedImageUri(url);
                setUploadModalVisible(true);
              }
            },
          },
        ]
      );
    }
  };

  // Upload story to backend
  const handlePublishStory = async () => {
    if (!selectedImageUri) {
      Alert.alert('No Media', 'Please select an image first.');
      return;
    }

    setUploading(true);
    try {
      // First attempt to upload file if local uri
      let finalMediaUrl = selectedImageUri;

      if (selectedImageUri.startsWith('file:') || selectedImageUri.startsWith('content:') || selectedImageUri.startsWith('blob:')) {
        const formData = new FormData();
        const filename = selectedImageUri.split('/').pop() || 'story.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
          uri: selectedImageUri,
          name: filename,
          type,
        });

        const uploadRes = await fetch(`${apiBaseUrl}/api/users/profile-picture`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.profilePhoto) {
          finalMediaUrl = uploadData.profilePhoto.startsWith('/') ? `${apiBaseUrl}${uploadData.profilePhoto}` : uploadData.profilePhoto;
        }
      }

      // Publish story endpoint
      const storyRes = await fetch(`${apiBaseUrl}/api/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mediaUrl: finalMediaUrl,
          caption: caption.trim(),
        }),
      });

      const storyData = await storyRes.json();
      if (storyRes.ok) {
        Alert.alert('Story Published! ✨', 'Your temporary story is live for 24 hours.');
        setUploadModalVisible(false);
        setSelectedImageUri(null);
        setCaption('');
        fetchStories();
      } else {
        Alert.alert('Upload Failed', storyData.error || 'Could not publish story.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error uploading story.');
    } finally {
      setUploading(false);
    }
  };

  // Open story viewer modal
  const handleOpenViewer = (index) => {
    setActiveStoryIndex(index);
    setViewerModalVisible(true);
  };

  // Animate story timer in viewer
  useEffect(() => {
    if (viewerModalVisible && stories.length > 0) {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          if (activeStoryIndex < stories.length - 1) {
            setActiveStoryIndex((prev) => prev + 1);
          } else {
            setViewerModalVisible(false);
          }
        }
      });
    }
  }, [viewerModalVisible, activeStoryIndex]);

  const currentStory = stories[activeStoryIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>24H Stories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User's Add Story Button */}
        <TouchableOpacity style={styles.addStoryItem} onPress={handlePickMedia}>
          <View style={styles.addAvatarContainer}>
            <Image
              source={{ uri: currentUser?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }}
              style={styles.avatar}
            />
            <View style={styles.plusBadge}>
              <Text style={styles.plusText}>+</Text>
            </View>
          </View>
          <Text style={styles.storyName}>Your Story</Text>
        </TouchableOpacity>

        {/* Stories from matched / community users */}
        {stories.map((story, idx) => (
          <TouchableOpacity key={story._id || idx} style={styles.storyItem} onPress={() => handleOpenViewer(idx)}>
            <View style={styles.storyRing}>
              <Image
                source={{
                  uri: story.userId?.profilePhoto || story.mediaUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
                }}
                style={styles.avatar}
              />
            </View>
            <Text style={styles.storyName} numberOfLines={1}>
              {story.userId?.name ? story.userId.name.split(' ')[0] : 'User'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* UPLOAD STORY MODAL */}
      <Modal visible={uploadModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.uploadCard}>
            <Text style={styles.modalTitle}>Publish 24-Hour Story</Text>

            {selectedImageUri && (
              <Image source={{ uri: selectedImageUri }} style={styles.previewImage} resizeMode="cover" />
            )}

            <TextInput
              style={styles.captionInput}
              placeholder="Add a caption..."
              placeholderTextColor="#888"
              value={caption}
              onChangeText={setCaption}
              maxLength={100}
            />

            <TouchableOpacity style={styles.publishBtn} onPress={handlePublishStory} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color="#0B0B0D" />
              ) : (
                <Text style={styles.publishBtnText}>Share to Story ✨</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setUploadModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* STORY VIEWER FULLSCREEN MODAL */}
      <Modal visible={viewerModalVisible} animationType="fade" transparent>
        <View style={styles.viewerContainer}>
          {currentStory && (
            <View style={{ flex: 1 }}>
              {/* Top Progress Bar */}
              <View style={styles.progressBarBackground}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>

              {/* Story User Header */}
              <View style={styles.viewerHeader}>
                <Image
                  source={{ uri: currentStory.userId?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }}
                  style={styles.viewerAvatar}
                />
                <Text style={styles.viewerName}>{currentStory.userId?.name || 'Ketero User'}</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setViewerModalVisible(false)}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Story Image Media */}
              <Image
                source={{
                  uri: currentStory.mediaUrl.startsWith('/') ? `${apiBaseUrl}${currentStory.mediaUrl}` : currentStory.mediaUrl,
                }}
                style={styles.storyFullImage}
                resizeMode="cover"
              />

              {/* Caption Overlay */}
              {currentStory.caption ? (
                <View style={styles.captionOverlay}>
                  <Text style={styles.captionText}>{currentStory.caption}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    color: '#FFB800',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 12,
  },
  addStoryItem: {
    alignItems: 'center',
    width: 68,
  },
  addAvatarContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  plusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFB800',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0B0B0D',
  },
  plusText: {
    color: '#0B0B0D',
    fontWeight: 'bold',
    fontSize: 13,
    lineHeight: 15,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  storyRing: {
    padding: 2,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: '#FFB800',
    marginBottom: 4,
  },
  storyName: {
    color: '#DDD',
    fontSize: 11,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  uploadCard: {
    backgroundColor: '#16141C',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.3)',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#FFB800',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  previewImage: {
    width: width - 80,
    height: width - 80,
    borderRadius: 16,
    marginBottom: 15,
  },
  captionInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#FFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  publishBtn: {
    backgroundColor: '#FFB800',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  publishBtnText: {
    color: '#0B0B0D',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: '#888',
    fontSize: 13,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginTop: 40,
    marginHorizontal: 10,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFB800',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  viewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFB800',
    marginRight: 10,
  },
  viewerName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  storyFullImage: {
    width: width,
    height: height,
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.3)',
  },
  captionText: {
    color: '#FFF',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
});
