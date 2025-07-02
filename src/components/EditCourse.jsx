import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Plus, Trash2, GripVertical, X, Loader2 } from "lucide-react";
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
  const [newLecture, setNewLecture] = useState({
    title: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    duration: "",
    order: 0
  });

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

      // Fetch course lectures
      const { data: lecturesData, error: lecturesError } = await supabase
        .from('lectures')
        .select('*')
        .eq('course_id', courseId)
        .order('order');

      if (lecturesError) throw lecturesError;
      setLectures(lecturesData);
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
      console.error('Error saving course:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLecture = async () => {
    try {
      setSaving(true);
      
      // Debug logging
      console.log('🔍 Attempting to add lecture with data:', {
        ...newLecture,
        course_id: courseId,
        order: lectures.length + 1
      });
      
      const { data, error } = await supabase
        .from('lectures')
        .insert([
          {
            ...newLecture,
            course_id: courseId,
            order: lectures.length + 1
          }
        ])
        .select();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Lecture added successfully:', data);
      setLectures([...lectures, data[0]]);
      setNewLecture({
        title: "",
        description: "",
        video_url: "",
        thumbnail_url: "",
        duration: "",
        order: lectures.length + 1
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

      {/* Lectures */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">Course Lectures</h2>
          
          {/* Existing Lectures */}
          <div className="space-y-4 mb-8">
            {lectures.map((lecture, index) => (
              <div
                key={lecture.id}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
              >
                <GripVertical className="text-gray-400" size={20} />
                <div className="flex-1">
                  <h3 className="font-medium">{lecture.title}</h3>
                  <p className="text-sm text-gray-500">{lecture.description}</p>
                </div>
                <div className="text-sm text-gray-500">{lecture.duration}</div>
                <button
                  onClick={() => handleDeleteLecture(lecture.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
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