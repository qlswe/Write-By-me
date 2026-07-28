export const compressImageFile = (file: File, maxWidth = 900, maxHeight = 900, quality = 0.65): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If it's a video file, return raw data URL immediately without image compression
    if (file.type && file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read video file'));
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        reject(new Error('Empty image file data'));
        return;
      }

      const img = new Image();
      let resolved = false;

      // 5-second fallback timer in case Image decoding hangs
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(dataUrl);
        }
      }, 5000);

      img.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(dataUrl); // Fallback to raw dataUrl on decode error
        }
      };

      img.onload = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);

        try {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width) || maxWidth;
          canvas.height = Math.round(height) || maxHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
};
