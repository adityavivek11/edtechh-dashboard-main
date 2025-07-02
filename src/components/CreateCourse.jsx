import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { X, Plus, Trash2, Folder } from 'lucide-react';
import ImageUploader from './ImageUploader';

export default function CreateCourse() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    image_url: '',
    price: '',
    is_active: true
  });

  // Folder management state
  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      }
      setLoading(false);
    };
    getUser();
  }, [navigate]);

  const handleCourseChange = (e) => {
    const { name, value } = e.target;
    setCourseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    setCourseData(prev => ({
      ...prev,
      price: value
    }));
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newFolder = {
      id: Date.now(), // temporary ID for frontend
      folder_name: newFolderName.trim()
    };
    
    setFolders([...folders, newFolder]);
    setNewFolderName('');
  };

  const handleRemoveFolder = (folderId) => {
    setFolders(folders.filter(folder => folder.id !== folderId));
  };

  const handleSaveCourse = async () => {
    try {
      setSaving(true);

      const { data: savedCourse, error: courseError } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single();

      if (courseError) throw courseError;

      // Create folders if any were added
      if (folders.length > 0) {
        const foldersData = folders.map(folder => ({
          folder_name: folder.folder_name,
          course_id: savedCourse.id
        }));

        const { error: foldersError } = await supabase
          .from('folders')
          .insert(foldersData);

        if (foldersError) {
          console.error('Error creating folders:', foldersError);
          // Don't throw error, just log it as folders are optional
        }
      }

      // Redirect to dashboard with courses active
      navigate('/dashboard', { 
        state: { 
          activeOption: 'courses',
          message: 'Course created successfully!'
        }
      });
    } catch (error) {
      console.error('❌ Error creating course:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Create New Course</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-600 hover:text-gray-800"
        >
          <X size={24} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Image Upload Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Course Image</h2>
          <ImageUploader
            onUploadComplete={(imageUrl) => {
              setCourseData(prev => ({ ...prev, image_url: imageUrl }));
            }}
            currentImage={courseData.image_url}
          />
          {courseData.image_url && (
            <div className="mt-4">
              <img 
                src={courseData.image_url} 
                alt="Course preview" 
                className="w-full h-48 object-cover rounded-lg"
              />
              <p className="text-sm text-gray-600 mt-2">Current image URL: {courseData.image_url}</p>
            </div>
          )}
        </div>

        {/* Course Details Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Course Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Title
              </label>
              <input
                type="text"
                value={courseData.title}
                onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter course title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Description
              </label>
              <textarea
                value={courseData.description}
                onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter course description"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Price
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="text"
                  value={courseData.price}
                  onChange={handlePriceChange}
                  placeholder="0.00 (Leave empty for free course)"
                  className="w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 sm:text-sm">INR</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Leave empty to make this course free
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={courseData.is_active}
                onChange={(e) => setCourseData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Make this course active
              </label>
            </div>
          </div>
        </div>

        {/* Course Folders Section (Optional) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Course Folders (Optional)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Create folders to organize your lectures. You can also create folders later when editing the course.
          </p>
          
          {/* Add Folder Input */}
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Enter folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleAddFolder()}
            />
            <button
              onClick={handleAddFolder}
              disabled={!newFolderName.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Plus size={16} />
              Add Folder
            </button>
          </div>

          {/* Folders List */}
          {folders.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Created Folders:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {folders.map((folder) => (
                  <div key={folder.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <Folder className="text-blue-500" size={16} />
                    <span className="flex-1 text-sm">{folder.folder_name}</span>
                    <button
                      onClick={() => handleRemoveFolder(folder.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveCourse}
            disabled={saving || !courseData.title}
            className={`px-4 py-2 rounded-md text-white ${
              saving || !courseData.title
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? 'Creating Course...' : 'Create Course'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
} 