'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { uploadProfilePicture } from '@/lib/storage';
import { updateUserProfile } from '@/lib/firestore-multitenant';
import { updateProfile } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { Camera, Upload, X, User } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePictureUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPhotoURL = user?.photoURL;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    if (!user) return;

    setUploading(true);
    try {
      const result = await uploadProfilePicture(user.uid, file);

      if (!result.success) {
        toast.error(result.error || 'Upload failed');
        setPreview(null);
        return;
      }

      await updateProfile(user, {
        photoURL: result.url,
      });

      await updateUserProfile(user.uid, {
        photoURL: result.url,
      });

      toast.success('Profile picture updated!');

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Failed to upload image');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user) return;

    try {
      await updateProfile(user, {
        photoURL: null,
      });

      await updateUserProfile(user.uid, {
        photoURL: '',
      });

      toast.success('Profile picture removed');
      setPreview(null);

      window.location.reload();
    } catch {
      toast.error('Failed to remove picture');
    }
  };

  return (
    <div className="flex items-start gap-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
          {preview ? (
            <Image
              src={preview}
              alt="Preview"
              width={96}
              height={96}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : currentPhotoURL ? (
            <Image
              src={currentPhotoURL}
              alt="Profile"
              width={96}
              height={96}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <User className="w-12 h-12 text-white" />
          )}
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
          type="button"
        >
          <Camera className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 mb-2">Profile Picture</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload a photo to personalize your account
        </p>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            type="button"
          >
            {uploading ? (
              <>Uploading...</>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Photo
              </>
            )}
          </button>

          {currentPhotoURL && (
            <button
              onClick={handleRemove}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
              Remove
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-2">
          JPG, PNG or GIF. Max size 5MB.
        </p>
      </div>
    </div>
  );
}
