import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadProfilePicture(
  userId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'Image must be less than 5MB' };
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `profile-${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, `profile-pictures/${userId}/${fileName}`);

    await uploadBytes(storageRef, file);

    const url = await getDownloadURL(storageRef);

    return { success: true, url };
  } catch (error: unknown) {
    console.error('Error uploading profile picture:', error);
    return { success: false, error: (error as { message?: string }).message };
  }
}
