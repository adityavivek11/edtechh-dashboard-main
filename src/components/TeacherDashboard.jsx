import { useState, useEffect } from "react";
import { BookOpen, HelpCircle, Video, Users, Home, LogOut, X, Loader2, Image as ImageIcon, GripVertical, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import VideoUploader from "./VideoUploader";
import ImageUploader from "./ImageUploader";
import UserManagementSidebar from "./UserManagementSidebar";

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState("doubts");
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Get user's initials for avatar
  const getUserInitials = (userData) => {
    if (!userData?.user_metadata?.full_name) return 'U';
    const names = userData.user_metadata.full_name.split(' ');
    return names.map(name => name[0]).join('').toUpperCase();
  };

  // Get user's display name
  const getDisplayName = (userData) => {
    if (!userData?.user_metadata?.full_name) return 'User';
    return userData.user_metadata.full_name;
  };

  const sidebarItems = [
    { id: "doubts", label: "Doubts", icon: <HelpCircle size={20} /> },
    { id: "courses", label: "Courses", icon: <BookOpen size={20} /> },
    { id: "lectures", label: "Standalone Lectures", icon: <Video size={20} /> },
    { id: "carousel", label: "Carousel Images", icon: <ImageIcon size={20} /> },
    { id: "users", label: "Users", icon: <Users size={20} /> }
  ];

  // Dashboard content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "doubts":
        return <DoubtsContent />;
      case "courses":
        return <CoursesContent />;
      case "lectures":
        return <LecturesContent />;
      case "carousel":
        return <CarouselContent />;
      case "users":
        return <UsersContent />;
      default:
        return <DoubtsContent />; // Default to doubts view
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-700 text-white flex flex-col">
        <div className="p-4 border-b border-blue-800">
          <h1 className="text-xl font-bold">Teacher Dashboard</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-2">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? "bg-blue-800 text-white"
                      : "text-blue-100 hover:bg-blue-600"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="p-4 border-t border-blue-800">
          <button 
            onClick={handleLogout}
            className="flex items-center text-blue-100 hover:text-white w-full p-2"
          >
            <LogOut size={20} className="mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {sidebarItems.find(item => item.id === activeTab)?.label || "Doubts"}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                {getUserInitials(user)}
              </div>
              <span className="ml-2 text-sm font-medium">{getDisplayName(user)}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

// Content components for different sections
function HomeContent() {
  const [stats, setStats] = useState({
    activeCourses: 0,
    pendingDoubts: 0,
    totalStudents: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch active courses count
      const { count: activeCoursesCount, error: coursesError } = await supabase
        .from('courses')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      if (coursesError) throw coursesError;

      // Fetch pending doubts count
      const { count: pendingDoubtsCount, error: doubtsError } = await supabase
        .from('doubts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (doubtsError) throw doubtsError;

      // Fetch total students count from user_courses table
      const { count: totalStudentsCount, error: studentsError } = await supabase
        .from('user_courses')
        .select('user_id', { count: 'exact', head: true })
        .distinct();

      if (studentsError) throw studentsError;

      console.log('Stats fetched:', {
        activeCourses: activeCoursesCount,
        pendingDoubts: pendingDoubtsCount,
        totalStudents: totalStudentsCount
      });

      setStats({
        activeCourses: activeCoursesCount || 0,
        pendingDoubts: pendingDoubtsCount || 0,
        totalStudents: totalStudentsCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Error loading dashboard stats: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800">Welcome back, Teacher!</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Active Courses" 
          value={stats.activeCourses} 
          icon={<BookOpen size={24} className="text-blue-500" />} 
        />
        <StatCard 
          title="Pending Doubts" 
          value={stats.pendingDoubts} 
          icon={<HelpCircle size={24} className="text-orange-500" />} 
        />
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents} 
          icon={<Users size={24} className="text-green-500" />} 
        />
      </div>
    </div>
  );
}

function DoubtsContent() {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoubt, setSelectedDoubt] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all', // 'all', 'pending', 'answered'
    sortBy: 'newest' // 'newest', 'oldest'
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchDoubts();
  }, [filters]); // Refetch when filters change
  
  // Debug function to log the selected doubt
  useEffect(() => {
    if (selectedDoubt) {
      console.log('Selected doubt:', selectedDoubt);
      console.log('Replies:', selectedDoubt.replies);
    }
  }, [selectedDoubt]);

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('doubts')
        .select('*');

      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply sorting
      query = query.order('created_at', { 
        ascending: filters.sortBy === 'oldest' 
      });

      const { data: doubtsData, error: doubtsError } = await query;

      if (doubtsError) throw doubtsError;

      // Then fetch related data for each doubt
      const doubtsWithDetails = await Promise.all(
        doubtsData.map(async (doubt) => {
          const userData = { 
            id: doubt.user_id,
            display_name: `User ${doubt.user_id.substring(0, 8)}`
          };

          const { data: courseData } = await supabase
            .from('courses')
            .select('title')
            .eq('id', doubt.course_id)
            .single();

          const { data: lectureData } = await supabase
            .from('lectures')
            .select('title')
            .eq('id', doubt.lecture_id)
            .single();

          const { data: repliesData } = await supabase
            .from('doubt_replies')
            .select('*')
            .eq('doubt_id', doubt.id)
            .order('created_at', { ascending: true });

          const repliesWithUsers = (repliesData || []).map(reply => ({
            ...reply,
            user: { 
              id: reply.user_id,
              display_name: reply.is_teacher ? 'Teacher' : `User ${reply.user_id.substring(0, 8)}`
            }
          }));
          
          return {
            ...doubt,
            user: userData,
            course: courseData,
            lecture: lectureData,
            replies: repliesWithUsers
          };
        })
      );

      setDoubts(doubtsWithDetails);
    } catch (error) {
      console.error('Error fetching doubts:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (doubtId) => {
    if (!replyContent.trim()) return;

    try {
      setReplying(true);
      console.log('Posting reply for doubt:', doubtId);
      console.log('Current user:', user);
      console.log('Reply content:', replyContent);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // First, insert the reply
      const replyObject = {
        doubt_id: doubtId,
        content: replyContent,
        is_teacher: true,
        user_id: user.id
      };
      
      console.log('Inserting reply with data:', replyObject);
      
      const { data: replyData, error: replyError } = await supabase
        .from('doubt_replies')
        .insert([replyObject]);

      if (replyError) {
        console.error('Error inserting reply:', replyError);
        throw new Error(`Failed to insert reply: ${replyError.message}`);
      }

      console.log('Reply inserted successfully:', replyData);

      // Then update the doubt status to "answered"
      const { error: updateError } = await supabase
        .from('doubts')
        .update({ status: 'answered' })
        .eq('id', doubtId);

      if (updateError) {
        console.error('Error updating doubt status:', updateError);
        throw new Error(`Failed to update doubt status: ${updateError.message}`);
      }

      console.log('Doubt status updated successfully');

      console.log('Successfully posted reply and updated doubt status');
      
      // Refresh the doubts list to show the new reply
      await fetchDoubts();
      
      // Reset the reply form
      setReplyContent('');
      setSelectedDoubt(null);
      
      console.log('Reply form reset and doubts refreshed');
    } catch (error) {
      console.error('Error in handleReply:', error);
      setError(error.message || 'Failed to post reply. Please try again.');
    } finally {
      setReplying(false);
    }
  };

  const getFilteredDoubtsCount = (status) => {
    return doubts.filter(doubt => 
      status === 'all' ? true : doubt.status === status
    ).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading doubts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Error loading doubts: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Student Doubts</h3>
        <div className="flex items-center gap-4">
          {/* Filter Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Status:</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All ({getFilteredDoubtsCount('all')})</option>
                <option value="pending">Pending ({getFilteredDoubtsCount('pending')})</option>
                <option value="answered">Answered ({getFilteredDoubtsCount('answered')})</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sort:</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course/Lecture</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {doubts.map((doubt) => (
                <tr key={doubt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                        {doubt.user?.display_name?.[0] || 'U'}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {doubt.user?.display_name || `User ${doubt.user_id?.substring(0, 8) || 'Unknown'}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(doubt.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{doubt.course?.title}</div>
                    <div className="text-xs text-gray-500">{doubt.lecture?.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{doubt.title}</div>
                    <div className="text-sm text-gray-500 mt-1">{doubt.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      doubt.status === 'answered' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doubt.status === 'answered' ? 'Answered' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        console.log('Toggling selected doubt:', doubt);
                        setSelectedDoubt(selectedDoubt?.id === doubt.id ? null : doubt);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {selectedDoubt?.id === doubt.id ? 'Hide Replies' : 'View/Reply'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reply Section */}
        {selectedDoubt && (
          <div className="border-t border-gray-200 p-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Replies</h4>
              {selectedDoubt.replies && selectedDoubt.replies.length > 0 ? (
                <div className="space-y-4">
                  {selectedDoubt.replies.map((reply) => (
                    <div key={reply.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {reply.is_teacher ? 'T' : (reply.user?.display_name?.[0] || 'U')}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {reply.is_teacher 
                                ? 'Teacher' 
                                : (reply.user?.display_name || `User ${(reply.user_id || 'unknown').substring(0, 8)}`)}
                              {reply.is_teacher && (
                                <span className="ml-2 text-xs text-blue-600">(Teacher)</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(reply.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-700">
                        {reply.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No replies yet.</p>
              )}

              <div className="mt-4">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => {
                      console.log('Submitting reply for doubt ID:', selectedDoubt.id);
                      handleReply(selectedDoubt.id);
                    }}
                    disabled={replying || !replyContent.trim()}
                    className={`px-4 py-2 rounded-md text-white ${
                      replying || !replyContent.trim()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {replying ? 'Replying...' : 'Reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CoursesContent() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Fetch courses and their related lectures count
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          lectures:lectures(count)
        `);

      if (coursesError) throw coursesError;
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewCourse = () => {
    navigate('/courses/new');
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      
      // First, delete all lectures associated with the course
      const { error: lecturesError } = await supabase
        .from('lectures')
        .delete()
        .eq('course_id', courseId);

      if (lecturesError) throw lecturesError;

      // Then, delete the course itself
      const { error: courseError } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (courseError) throw courseError;

      // Refresh the courses list
      await fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      setError(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Free';
    return price;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading courses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Error loading courses: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Your Courses</h3>
        <button 
          onClick={handleAddNewCourse}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          + Add New Course
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gray-200 h-48 relative">
              {course.image_url ? (
                <img 
                  src={course.image_url} 
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <BookOpen size={48} />
                </div>
              )}
              <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
              ₹{formatPrice(course.price)}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-base mb-2">{course.title}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>
              <div className="flex text-sm text-gray-500 mb-4">
                <span>{course.students || '0'} Students</span>
                <span className="mx-2">•</span>
                <span>{course.lectures?.[0]?.count || '0'} Lectures</span>
              </div>
              <div className="flex justify-between">
                <button 
                  onClick={() => navigate(`/courses/${course.id}/edit`)}
                  className="bg-blue-600 text-white text-sm py-1.5 px-4 rounded hover:bg-blue-700 transition-colors"
                >
                  Edit Course
                </button>
                <button 
                  onClick={() => handleDeleteCourse(course.id)}
                  disabled={deleting}
                  className={`text-sm py-1.5 px-4 rounded transition-colors ${
                    deleting
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                >
                  {deleting ? 'Deleting...' : 'Delete Course'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LecturesContent() {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newLecture, setNewLecture] = useState({
    title: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    duration: "",
    is_active: true
  });

  useEffect(() => {
    fetchLectures();
  }, []);

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('standalone_lectures')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLectures(data || []);
    } catch (error) {
      console.error('Error fetching lectures:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLecture = async () => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('standalone_lectures')
        .insert([newLecture])
        .select();

      if (error) throw error;
      
      setLectures([data[0], ...lectures]);
      setShowModal(false);
      setNewLecture({
        title: "",
        description: "",
        video_url: "",
        thumbnail_url: "",
        duration: "",
        is_active: true
      });
    } catch (error) {
      console.error('Error creating lecture:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLecture = async (lectureId) => {
    if (!window.confirm('Are you sure you want to delete this lecture? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('standalone_lectures')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading lectures...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Error loading lectures: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Standalone Lectures</h3>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          + Create New Lecture
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lectures.map((lecture) => (
              <tr key={lecture.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lecture.title}</td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{lecture.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lecture.duration}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    lecture.is_active 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {lecture.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleDeleteLecture(lecture.id)}
                    disabled={saving}
                    className={`text-red-600 hover:text-red-900 ${
                      saving ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Lecture Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Create New Lecture</h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Video Upload Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">1. Upload Video</h4>
                  <VideoUploader 
                    onUploadComplete={(videoData) => {
                      setNewLecture(prev => ({
                        ...prev,
                        video_url: videoData.video_url,
                        duration: videoData.duration
                      }));
                    }}
                  />
                </div>

                {/* Thumbnail Upload Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">2. Upload Thumbnail</h4>
                  <ImageUploader
                    onUploadComplete={(imageUrl) => {
                      setNewLecture(prev => ({
                        ...prev,
                        thumbnail_url: imageUrl
                      }));
                    }}
                    currentImage={newLecture.thumbnail_url}
                  />
                  {newLecture.thumbnail_url && (
                    <div className="mt-4">
                      <img
                        src={newLecture.thumbnail_url}
                        alt="Lecture thumbnail"
                        className="w-full max-w-xs rounded-lg shadow-sm"
                      />
                      <button
                        onClick={() => setNewLecture(prev => ({ ...prev, thumbnail_url: "" }))}
                        className="mt-2 text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                      >
                        <X size={16} />
                        Remove Thumbnail
                      </button>
                    </div>
                  )}
                </div>

                {/* Lecture Details Section */}
                <div className={`bg-gray-50 rounded-lg p-6 ${!newLecture.video_url ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">3. Lecture Details</h4>
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
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">4. Preview</h4>
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
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateLecture}
                  disabled={saving || !newLecture.title || !newLecture.video_url}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white
                    ${saving || !newLecture.title || !newLecture.video_url
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {saving ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Creating Lecture...
                    </>
                  ) : (
                    'Create Lecture'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CarouselContent() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newImage, setNewImage] = useState({
    title: "",
    description: "",
    image_url: "",
    link_url: "",
    is_active: true,
    display_order: 0
  });

  useEffect(() => {
    fetchCarouselImages();
  }, []);

  const fetchCarouselImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('carousel_images')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching carousel images:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async () => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('carousel_images')
        .insert([{
          ...newImage,
          display_order: parseInt(newImage.display_order) || 0
        }])
        .select();

      if (error) throw error;
      setImages([...images, data[0]]);
      setShowAddModal(false);
      setNewImage({
        title: "",
        description: "",
        image_url: "",
        link_url: "",
        is_active: true,
        display_order: 0
      });
    } catch (error) {
      console.error('Error adding carousel image:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('carousel_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
      setImages(images.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Error deleting carousel image:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDisplayOrderChange = async (imageId, newOrder) => {
    try {
      setSaving(true);
      
      // Convert to number and ensure it's not negative
      const orderNum = Math.max(0, parseInt(newOrder) || 0);
      
      const { error } = await supabase
        .from('carousel_images')
        .update({ display_order: orderNum })
        .eq('id', imageId);

      if (error) throw error;

      // Update local state
      setImages(prevImages => 
        prevImages.map(img => 
          img.id === imageId 
            ? { ...img, display_order: orderNum }
            : img
        )
      );
    } catch (error) {
      console.error('Error updating display order:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading carousel images...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Carousel Images</h3>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          + Add New Image
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="bg-white rounded-lg shadow p-4 flex items-center gap-4"
          >
            <div className="flex items-center gap-4 min-w-[120px]">
              <div className="flex items-center">
                <label className="sr-only">Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={image.display_order}
                  onChange={(e) => handleDisplayOrderChange(image.id, e.target.value)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  title="Display Order"
                />
              </div>
            </div>
            <div className="h-24 w-40 bg-gray-100 rounded overflow-hidden">
              <img
                src={image.image_url}
                alt={image.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{image.title}</h4>
              <p className="text-sm text-gray-500">{image.description}</p>
              {image.link_url && (
                <a 
                  href={image.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {image.link_url}
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs ${
                image.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {image.is_active ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => handleDeleteImage(image.id)}
                className="text-red-600 hover:text-red-800 p-1"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Image Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Add New Carousel Image</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Display Order Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newImage.display_order}
                    onChange={(e) => setNewImage(prev => ({
                      ...prev,
                      display_order: Math.max(0, parseInt(e.target.value) || 0)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter display order (0 or higher)"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter a number to set the order of appearance (0 or higher)
                  </p>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image
                  </label>
                  <ImageUploader
                    onUploadComplete={(imageUrl) => {
                      setNewImage(prev => ({ ...prev, image_url: imageUrl }));
                    }}
                    currentImage={newImage.image_url}
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newImage.title}
                    onChange={(e) => setNewImage(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter image title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newImage.description}
                    onChange={(e) => setNewImage(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="3"
                    placeholder="Enter image description"
                  />
                </div>

                {/* Link URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={newImage.link_url}
                    onChange={(e) => setNewImage(prev => ({ ...prev, link_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter link URL"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={newImage.is_active}
                    onChange={(e) => setNewImage(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Make this image active
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddImage}
                  disabled={saving || !newImage.image_url || !newImage.title}
                  className={`px-4 py-2 rounded-md text-white ${
                    saving || !newImage.image_url || !newImage.title
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {saving ? 'Adding...' : 'Add Image'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UsersContent() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">User Management</h2>
      <p className="text-gray-600 mb-4">Toggle user access permissions using the controls below:</p>
      <div className="mt-6">
        <UserManagementSidebar />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-2 bg-blue-50 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );
} 