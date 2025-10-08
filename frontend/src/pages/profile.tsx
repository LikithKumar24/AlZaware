import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import { UserCircle } from 'lucide-react';

const ProfilePage: NextPage = () => {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://127.0.0.1:8000/users/me/photo', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        setSelectedFile(null);
      } else {
        console.error('Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Your Profile</h1>
      <div className="flex items-center mb-4">
        {user.profile_photo_url ? (
          <img
            src={user.profile_photo_url}
            alt="Profile"
            className="w-24 h-24 rounded-full mr-4"
          />
        ) : (
          <UserCircle className="w-24 h-24 text-gray-500 mr-4" />
        )}
        <div>
          <p className="text-2xl font-semibold text-slate-700">{user.full_name}</p>
          <p className="text-slate-500">{user.email}</p>
          <p className="text-slate-500">Age: {user.age}</p>
        </div>
      </div>
      <div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={handleUploadClick}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Choose Photo
        </button>
        {selectedFile && <span className="ml-4">{selectedFile.name}</span>}
        {selectedFile && (
          <button
            onClick={handlePhotoUpload}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-4"
          >
            Upload New Photo
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;