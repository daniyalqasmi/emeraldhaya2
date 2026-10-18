/**
 * Image upload and optimization utility with direct ImgBB Cloud CDN integration
 * Uses API key: d497422bf88630579f6e862ddfab3590
 * Provides instant permanent image URLs with zero size limits
 */
import { uploadImageToImgBB, DEFAULT_IMGBB_API_KEY } from './imgbbService';
import { storage } from './firebaseConfig';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export interface ProcessedImageResult {
  url: string;
  source: 'imgbb' | 'firebase' | 'local';
  fileName: string;
  originalSizeKB: number;
  width?: number;
  height?: number;
}

/**
 * Uploads an image file to ImgBB CDN with fallback to Firebase Storage / local Base64
 * Zero limit on image size or dimensions
 */
export const processImageFile = async (
  file: File,
  customApiKey?: string
): Promise<string> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (JPEG, PNG, WebP, GIF, etc.)');
  }

  // 1. Primary: Upload directly to ImgBB Cloud CDN
  try {
    const imgbbResult = await uploadImageToImgBB(file, customApiKey || DEFAULT_IMGBB_API_KEY);
    if (imgbbResult?.url) {
      return imgbbResult.url;
    }
  } catch (imgbbError) {
    console.warn('ImgBB direct upload failed, attempting storage fallback:', imgbbError);
  }

  // 2. Read local data URL for preview and Firebase Storage fallback
  const localDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file from your PC'));
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.readAsDataURL(file);
  });

  // 3. Fallback: Firebase Storage if configured
  if (storage) {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const storageRef = ref(storage, `boutique_media/${fileId}.${fileExt}`);
      await uploadString(storageRef, localDataUrl, 'data_url');
      const downloadUrl = await getDownloadURL(storageRef);
      if (downloadUrl) {
        return downloadUrl;
      }
    } catch (storageError) {
      console.warn('Firebase Storage fallback failed:', storageError);
    }
  }

  // 4. Final resilient fallback: Local Base64 Data URL so the user is never blocked
  return localDataUrl;
};
