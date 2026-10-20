/** Reads an image file and returns a small passport-size JPEG data URL (fits comfortably in localStorage). */
export const resizePhoto = (file: File, width = 180, height = 225): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Choose an image file (JPG or PNG).'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not open the image.'));
      img.onload = () => {
        // Centre-crop to a 4:5 passport ratio, then scale down.
        const target = width / height;
        let sw = img.width;
        let sh = img.height;
        if (sw / sh > target) sw = sh * target;
        else sh = sw / target;
        const sx = (img.width - sw) / 2;
        const sy = (img.height - sh) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Image processing is not available.'));
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
