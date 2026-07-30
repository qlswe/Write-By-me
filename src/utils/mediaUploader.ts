export async function uploadMediaFile(input: File | string, fileName?: string): Promise<string> {
  if (!input) return '';

  // If input is already a web URL, returning as-is
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

  // Attempt 2: Fallback to tmpfiles.org
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
        // Convert tmpfiles view URL to direct download URL:
        // https://tmpfiles.org/12345/file.mp4 -> https://tmpfiles.org/dl/12345/file.mp4
        const directUrl = tmpData.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
        return directUrl;
      }
    }
  } catch (tmpErr) {
    console.warn('External upload fallback failed:', tmpErr);
  }

  // Final fallback: if small enough (<700KB), return base64; otherwise throw/alert
  if (base64Data.length < 750000) {
    return base64Data;
  }

  throw new Error('File size exceeds Firestore document limit (1MB). Please use video links (YouTube) or smaller video files.');
}
