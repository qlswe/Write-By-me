export async function compressImageBase64(
  base64Str: string,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.75
): Promise<string> {
  if (!base64Str || !base64Str.startsWith('data:image/')) return base64Str;

  // Don't compress small images (<100KB) or animated GIFs
  if (base64Str.length < 100000 || base64Str.startsWith('data:image/gif')) {
    return base64Str;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl.length < base64Str.length ? compressedDataUrl : base64Str);
    };

    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
}

export async function uploadMediaFile(input: File | string, fileName?: string): Promise<string> {
  if (!input) return '';

  // If input is already a web URL, return as-is
  if (typeof input === 'string') {
    if (!input.startsWith('data:')) {
      return input;
    }
    // Check size of base64 data URL
    if (input.length < 150000 && !input.startsWith('data:video')) {
      // Small image < 100KB, base64 is safe for Firestore
      return input;
    }
  }

  let base64Data = '';
  let name = fileName || 'file.dat';

  if (typeof input === 'string') {
    base64Data = input;
  } else {
    name = input.name;
    base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(input);
    });
  }

  // Compress image data if it's an image base64
  if (base64Data.startsWith('data:image/')) {
    base64Data = await compressImageBase64(base64Data, 1200, 1200, 0.75);
  }

  // Attempt 1: Upload to local server /api/upload
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileData: base64Data,
        fileName: name
      })
    });

    if (response.ok) {
      const resData = await response.json();
      if (resData.url) {
        return resData.url;
      }
    }
  } catch (err) {
    console.warn('Local /api/upload failed, trying external fallback...', err);
  }

  // Attempt 2: Fallback direct upload to Litterbox CDN
  try {
    const fileBlob = typeof input === 'string'
      ? await (await fetch(base64Data)).blob()
      : input;

    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('time', '72h');
    formData.append('fileToUpload', fileBlob, name);

    const litterRes = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
      method: 'POST',
      body: formData
    });

    if (litterRes.ok) {
      const resText = await litterRes.text();
      if (resText && resText.startsWith('http')) {
        return resText.trim();
      }
    }
  } catch (litterErr) {
    console.warn('Litterbox direct upload failed:', litterErr);
  }

  // Attempt 3: Fallback to tmpfiles.org
  try {
    const blob = await (await fetch(base64Data)).blob();
    const formData = new FormData();
    formData.append('file', blob, name);

    const tmpRes = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: formData
    });

    if (tmpRes.ok) {
      const tmpData = await tmpRes.json();
      if (tmpData?.data?.url) {
        const directUrl = tmpData.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
        return directUrl;
      }
    }
  } catch (tmpErr) {
    console.warn('External upload fallback failed:', tmpErr);
  }

  // Final fallback: if small enough (<750KB), return base64
  if (base64Data.length < 750000) {
    return base64Data;
  }

  // Try aggressive compression
  if (base64Data.startsWith('data:image/')) {
    const hyperCompressed = await compressImageBase64(base64Data, 800, 800, 0.5);
    if (hyperCompressed.length < 750000) {
      return hyperCompressed;
    }
  }

  throw new Error('File size exceeds limit (1MB). Please use smaller images or external media links.');
}

export async function sanitizePayloadForFirestore<T>(payload: T): Promise<T> {
  if (!payload) return payload;

  if (typeof payload === 'string') {
    const strPayload = payload as string;
    if (strPayload.includes('data:image/')) {
      const dataUrlRegex = /data:image\/[a-zA-Z+]+;base64,[a-zA-Z0-9+/=]+/g;
      const matches = strPayload.match(dataUrlRegex);
      if (matches) {
        let updatedString = strPayload;
        for (const dataUrl of matches) {
          try {
            const uploadedUrl = await uploadMediaFile(dataUrl);
            updatedString = updatedString.replace(dataUrl, uploadedUrl);
          } catch (e) {
            const compressed = await compressImageBase64(dataUrl, 800, 800, 0.5);
            updatedString = updatedString.replace(dataUrl, compressed);
          }
        }
        return (updatedString as unknown) as T;
      }
    }
    return payload;
  }

  if (Array.isArray(payload)) {
    const processedArray = await Promise.all(
      payload.map((item) => sanitizePayloadForFirestore(item))
    );
    return processedArray as unknown as T;
  }

  if (typeof payload === 'object' && payload !== null) {
    const result: any = {};
    for (const [key, value] of Object.entries(payload)) {
      result[key] = await sanitizePayloadForFirestore(value);
    }
    return result as T;
  }

  return payload;
}

