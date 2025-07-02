import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Plus, Trash2, GripVertical, X, Loader2, Folder, FolderPlus } from "lucide-react";
import VideoUploader from "./VideoUploader";
import ImageUploader from "./ImageUploader";

export default function EditCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [course, setCourse] = useState({
    title: "",
    description: "",
    image_url: "",
    price: "",
    is_active: true
  });

  const [lectures, setLectures] = useState([]);
  const [folders, setFolders] = useState([]);
  const [newLecture, setNewLecture] = useState({
    title: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    duration: "",
    order: 0,
    folder_id: ""
  });

  // Folder management state
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch course folders
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at');

      if (foldersError) throw foldersError;
      setFolders(foldersData || []);

      // Fetch course lectures with folder information
      const { data: lecturesData, error: lecturesError } = await supabase
        .from('lectures')
        .select(`
          *,
          folders(id, folder_name)
        `)
        .eq('course_id', courseId)
        .order('order');

      if (lecturesError) throw lecturesError;
      setLectures(lecturesData || []);
    } catch (error) {
      console.error('Error fetching course data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (e) => {
    const { name, value } = e.target;
    setCourse(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveCourse = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('courses')
        .update(course)
        .eq('id', courseId);

      if (error) throw error;

      // Redirect to dashboard with courses active
      navigate('/dashboard', { 
        state: { 
          activeOption: 'courses',
          message: 'Course updated successfully!'
        }
      });
    } catch (error) {
      console.error('❌ Error saving course:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLecture = async () => {
    try {
      setSaving(true);
      
      const lectureData = {
        ...newLecture,
        course_id: courseId,
        order: lectures.length + 1,
        folder_id: newLecture.folder_id || null
      };

      const { data, error } = await supabase
        .from('lectures')
        .insert([lectureData])
        .select();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      // Refresh all data to get updated folder information
      await fetchCourseData();
      
      setNewLecture({
        title: "",
        description: "",
        video_url: "",
        thumbnail_url: "",
        duration: "",
        order: 0,
        folder_id: ""
      });
    } catch (error) {
      console.error('❌ Error adding lecture:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLecture = async (lectureId) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('lectures')
        .delete()
        .eq('id', lectureId);

      if (error) throw error;
      setLectures(lectures.filter(lecture => lecture.id !== lectureId));
    } catch (error) {
      console.error('Error deleting lecture:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    setCourse(prev => ({
      ...prev,
      price: value
    }));
  };

  const validatePrice = (value) => {
    if (value === "") return true;
    const price = parseFloat(value);
    return !isNaN(price) && price >= 0;
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('folders')
        .insert([
          {
            folder_name: newFolderName.trim(),
            course_id: courseId
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setFolders([...folders, data]);
      setNewFolderName("");
      setShowCreateFolder(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    // Check if folder has lectures
    const folderLectures = lectures.filter(lecture => lecture.folder_id === folderId);
    
    if (folderLectures.length > 0) {
      if (!window.confirm(`This folder contains ${folderLectures.length} lecture(s). All lectures in this folder will be moved to "No Folder". Are you sure you want to delete this folder?`)) {
        return;
      }
      
      // Move lectures to no folder (null folder_id)
      for (const lecture of folderLectures) {
        await supabase
          .from('lectures')
          .update({ folder_id: null })
          .eq('id', lecture.id);
      }
    } else {
      if (!window.confirm('Are you sure you want to delete this folder?')) {
        return;
      }
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      setFolders(folders.filter(folder => folder.id !== folderId));
      // Refresh lectures to update folder information
      await fetchCourseData();
    } catch (error) {
      console.error('Error deleting folder:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading course data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Edit Course</h1>
        <div className="space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveCourse}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Course Details */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">Course Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={course.title}
                onChange={handleCourseChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="text"
                  name="price"
                  value={course.price}
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={course.description}
                onChange={handleCourseChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Image
              </label>
              <ImageUploader 
                onUploadComplete={(imageUrl) => {
                  setCourse(prev => ({
                    ...prev,
                    image_url: imageUrl
                  }));
                }}
              />
              {course.image_url && (
                <div className="mt-4">
                  <img 
                    src={course.image_url} 
                    alt="Course thumbnail" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setCourse(prev => ({ ...prev, image_url: '' }))}
                    className="mt-2 text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
                  >
                    <X size={16} />
                    Remove Image
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Folders Management */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Course Folders</h2>
            <button
              onClick={() => setShowCreateFolder(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FolderPlus size={20} />
              Create Folder
            </button>
          </div>

          {/* Create Folder Form */}
          {showCreateFolder && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                />
                <button
                  onClick={handleCreateFolder}
                  disabled={saving || !newFolderName.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateFolder(false);
                    setNewFolderName("");
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Existing Folders */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => {
              const folderLectureCount = lectures.filter(lecture => lecture.folder_id === folder.id).length;
              return (
                <div key={folder.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Folder className="text-blue-500" size={20} />
                    <h3 className="font-medium flex-1">{folder.folder_name}</h3>
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    {folderLectureCount} lecture{folderLectureCount !== 1 ? 's' : ''}
                  </p>
                </div>
              );
            })}
            {folders.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-8">
                No folders created yet. Create a folder to organize your lectures.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lectures */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">Course Lectures</h2>
          
          {/* Lectures organized by folders */}
          <div className="space-y-6 mb-8">
            {/* No Folder Section */}
            {lectures.filter(lecture => !lecture.folder_id).length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <Folder className="text-gray-400" size={20} />
                  No Folder ({lectures.filter(lecture => !lecture.folder_id).length} lectures)
                </h3>
                <div className="space-y-3">
                  {lectures
                    .filter(lecture => !lecture.folder_id)
                    .map((lecture) => (
                      <div
                        key={lecture.id}
                        className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg bg-gray-50"
                      >
                        <GripVertical className="text-gray-400" size={20} />
                        <div className="flex-1">
                          <h4 className="font-medium">{lecture.title}</h4>
                          <p className="text-sm text-gray-500">{lecture.description}</p>
                        </div>
                        <div className="text-sm text-gray-500">{lecture.duration}</div>
                        <button
                          onClick={() => handleDeleteLecture(lecture.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Folder Sections */}
            {folders.map((folder) => {
              const folderLectures = lectures.filter(lecture => lecture.folder_id === folder.id);
              if (folderLectures.length === 0) return null;

              return (
                <div key={folder.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <Folder className="text-blue-500" size={20} />
                    {folder.folder_name} ({folderLectures.length} lectures)
                  </h3>
                  <div className="space-y-3">
                    {folderLectures.map((lecture) => (
                      <div
                        key={lecture.id}
                        className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg bg-gray-50"
                      >
                        <GripVertical className="text-gray-400" size={20} />
                        <div className="flex-1">
                          <h4 className="font-medium">{lecture.title}</h4>
                          <p className="text-sm text-gray-500">{lecture.description}</p>
                        </div>
                        <div className="text-sm text-gray-500">{lecture.duration}</div>
                        <button
                          onClick={() => handleDeleteLecture(lecture.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {lectures.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No lectures added yet. Add your first lecture below.
              </div>
            )}
          </div>

          {/* Add New Lecture */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Add New Lecture</h3>
            
            {/* Video Upload Section */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-4">1. Upload Video</h4>
              <VideoUploader 
                onUploadComplete={(videoData) => {
                  setNewLecture(prev => ({
                    ...prev,
                    video_url: videoData.video_url,
                    thumbnail_url: videoData.thumbnail_url,
                    duration: videoData.duration
                  }));
                }}
              />
            </div>

            {/* Lecture Details Section */}
            <div className={`bg-gray-50 rounded-lg p-6 mb-6 ${!newLecture.video_url ? 'opacity-50 pointer-events-none' : ''}`}>
              <h4 className="text-sm font-medium text-gray-700 mb-4">2. Lecture Details</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="Enter lecture title"
                    value={newLecture.title}
                    onChange={(e) => setNewLecture(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    placeholder="Enter lecture description"
                    value={newLecture.description}
                    onChange={(e) => setNewLecture(prev => ({ ...prev, description: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Folder
                  </label>
                  <select
                    value={newLecture.folder_id}
                    onChange={(e) => setNewLecture(prev => ({ ...prev, folder_id: e.target.value || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">No Folder</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.folder_name}
                      </option>
                    ))}
                  </select>
                  {folders.length === 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      No folders available. Create a folder above to organize your lectures.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Video Preview Section */}
            {newLecture.video_url && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">3. Preview</h4>
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <video
                    src={newLecture.video_url}
                    controls
                    className="w-full h-full"
                    poster={newLecture.thumbnail_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <span>Duration: {newLecture.duration || 'Not available'}</span>
                  <button
                    onClick={() => setNewLecture(prev => ({
                      ...prev,
                      video_url: '',
                      thumbnail_url: '',
                      duration: ''
                    }))}
                    className="text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <X size={16} />
                    Remove Video
                  </button>
                </div>
              </div>
            )}

            {/* Add Lecture Button */}
            <div className="flex justify-end">
              <button
                onClick={handleAddLecture}
                disabled={saving || !newLecture.title || !newLecture.video_url}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white
                  ${saving || !newLecture.title || !newLecture.video_url
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {saving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Adding Lecture...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Add Lecture
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 