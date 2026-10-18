/**
 * ImgBB Cloud Hosting API Integration Service
 * Free, unlimited direct image CDN hosting
 * API Endpoint: https://api.imgbb.com/1/upload
 */

export const DEFAULT_IMGBB_API_KEY = "d497422bf88630579f6e862ddfab3590";

export interface ImgBBUploadResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: number;
    height: number;
    size: number;
    time: number;
    expiration: number;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb?: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

export interface UploadResult {
  url: string;
  displayUrl: string;
  deleteUrl?: string;
  width?: number;
  height?: number;
  sizeKB?: number;
  provider: 'imgbb' | 'fallback';
}

/**
 * Uploads an image file or base64 string directly to ImgBB Cloud CDN
 * No size restrictions; returns permanent public URL
 */
export async function uploadImageToImgBB(
  imageSource: File | string,
  customApiKey?: string
): Promise<UploadResult> {
  const apiKey = (customApiKey || DEFAULT_IMGBB_API_KEY).trim();

  if (!apiKey) {
    throw new Error('ImgBB API key is required');
  }

  const formData = new FormData();

  if (typeof imageSource === 'string') {
    // If it's a data URL like data:image/png;base64,.... strip prefix as required by ImgBB API
    let rawBase64 = imageSource;
    if (imageSource.includes(',')) {
      rawBase64 = imageSource.split(',')[1];
    }
    formData.append('image', rawBase64);
  } else {
    formData.append('image', imageSource, imageSource.name || 'emerald-haya-upload.jpg');
  }

  const uploadEndpoint = `https://api.imgbb.com/1/upload?key=${apiKey}`;

  const response = await fetch(uploadEndpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('ImgBB API error response:', errorBody);
    throw new Error(`ImgBB upload failed with HTTP status ${response.status}: ${errorBody || response.statusText}`);
  }

  const result: ImgBBUploadResponse = await response.json();

  if (!result.success || !result.data) {
    throw new Error('ImgBB returned failure response');
  }

  return {
    url: result.data.url,
    displayUrl: result.data.display_url || result.data.url,
    deleteUrl: result.data.delete_url,
    width: result.data.width,
    height: result.data.height,
    sizeKB: Math.round((result.data.size || 0) / 1024),
    provider: 'imgbb'
  };
}
