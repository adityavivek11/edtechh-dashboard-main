import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { BookOpen, HelpCircle, Video, Users, Home, LogOut, X, Loader2, Image as ImageIcon, GripVertical, Trash2, ChevronDown, ChevronRight } from "lucide-react";
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
  
  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }, [signOut, navigate]);

  // Get user's initials for avatar
  const getUserInitials = useCallback((userData) => {
    if (!userData?.user_metadata?.full_name) return 'U';
    const names = userData.user_metadata.full_name.split(' ');
    return names.map(name => name[0]).join('').toUpperCase();
  }, []);

  // Get user's display name
  const getDisplayName = useCallback((user) => {
    if (!user?.user_metadata?.full_name) return 'User';
    return user.user_metadata.full_name;
  }, []);

  const sidebarItems = useMemo(() => [
    { id: "doubts", label: "Doubts", icon: <HelpCircle size={20} /> },
    { id: "courses", label: "Courses", icon: <BookOpen size={20} /> },
    { id: "lectures", label: "Standalone Lectures", icon: <Video size={20} /> },
    { id: "carousel", label: "Carousel Images", icon: <ImageIcon size={20} /> },
    { id: "users", label: "Users", icon: <Users size={20} /> }
  ], []);

  // Dashboard content based on active tab
  const renderContent = useCallback(() => {
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
  }, [activeTab]);

  const activeItemLabel = useMemo(() => 
    sidebarItems.find(item => item.id === activeTab)?.label || "Doubts", 
    [sidebarItems, activeTab]
  );

  const userInitials = useMemo(() => getUserInitials(user), [getUserInitials, user]);
  const displayName = useMemo(() => getDisplayName(user), [getDisplayName, user]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        sidebarItems={sidebarItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          activeItemLabel={activeItemLabel}
          userInitials={userInitials}
          displayName={displayName}
        />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

// Memoized Sidebar component
const Sidebar = memo(({ sidebarItems, activeTab, setActiveTab, onLogout }) => (
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
        onClick={onLogout}
        className="flex items-center text-blue-100 hover:text-white w-full p-2"
      >
        <LogOut size={20} className="mr-3" />
        <span>Logout</span>
      </button>
    </div>
  </div>
));

// Memoized Header component
const Header = memo(({ activeItemLabel, userInitials, displayName }) => (
  <header className="bg-white shadow-sm p-4 flex justify-between items-center">
    <h2 className="text-xl font-semibold text-gray-800">
      {activeItemLabel}
    </h2>
    <div className="flex items-center space-x-4">
      <div className="flex items-center">
        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
          {userInitials}
        </div>
        <span className="ml-2 text-sm font-medium">{displayName}</span>
      </div>
    </div>
  </header>
));

// Content components for different sections
const HomeContent = memo(() => {
  const [stats, setStats] = useState({
    activeCourses: 0,
    pendingDoubts: 0,
    totalStudents: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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
});

const DoubtsContent = memo(() => {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoubt, setSelectedDoubt] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [expandedDoubts, setExpandedDoubts] = useState(new Set());
  const [filters, setFilters] = useState({
    status: 'all', // 'all', 'pending', 'answered', 'resolved'
    sortBy: 'newest' // 'newest', 'oldest'
  });
  const { user } = useAuth();

  const toggleDoubtExpansion = useCallback((doubtId) => {
    setExpandedDoubts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(doubtId)) {
        newSet.delete(doubtId);
      } else {
        newSet.add(doubtId);
      }
      return newSet;
    });
  }, []);

  const fetchDoubts = useCallback(async () => {
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
          // Fetch actual user data
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', doubt.user_id)
            .single();
          
          // Try alternative approaches if profiles table doesn't work
          let finalDisplayName = 'Student';
          
          if (userData) {
            finalDisplayName = userData.full_name || 'Student';
          } else if (userError) {
            // Some databases might store the user name directly in the doubts table
            finalDisplayName = doubt.user_name || doubt.student_name || 'Student';
          }
          
          const userInfo = {
            id: doubt.user_id,
            display_name: finalDisplayName
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

          // Fetch user info for replies
          const repliesWithUsers = await Promise.all((repliesData || []).map(async (reply) => {
            if (reply.is_teacher) {
              return {
                ...reply,
                user: { 
                  id: reply.user_id,
                  display_name: 'Teacher'
                }
              };
            } else {
              const { data: replyUserData } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', reply.user_id)
                .single();

              return {
                ...reply,
                user: { 
                  id: reply.user_id,
                  display_name: replyUserData ? 
                    (replyUserData.full_name || replyUserData.email || 'Student') :
                    'Student'
                }
              };
            }
          }));
          
          return {
            ...doubt,
            user: userInfo,
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
  }, [filters]);

  useEffect(() => {
    fetchDoubts();
  }, [fetchDoubts]); // Refetch when fetchDoubts changes

  const handleReply = useCallback(async (doubtId) => {
    if (!replyContent.trim()) return;

    try {
      setReplying(true);

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
      
      const { data: replyData, error: replyError } = await supabase
        .from('doubt_replies')
        .insert([replyObject]);

      if (replyError) {
        throw new Error(`Failed to insert reply: ${replyError.message}`);
      }

      // Then update the doubt status to "answered"
      const { data: updateData, error: updateError } = await supabase
        .from('doubts')
        .update({ status: 'answered' })
        .eq('id', doubtId)
        .select();

      if (updateError) {
        throw new Error(`Failed to update doubt status: ${updateError.message}`);
      }

      // Verify the update worked
      if (!updateData || updateData.length === 0) {
        throw new Error('Failed to update doubt status - no rows affected');
      }

      // Add small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh the doubts list to show the new reply and updated status
      await fetchDoubts();
      
      // Reset the reply form
      setReplyContent('');
      setSelectedDoubt(null);
    } catch (error) {
      console.error('Error in handleReply:', error);
      setError(error.message || 'Failed to post reply. Please try again.');
    } finally {
      setReplying(false);
    }
  }, [replyContent, user, fetchDoubts]);



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

  // Apply client-side filtering if needed (database filtering is already applied)
  const filteredDoubts = doubts;

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Student Doubts & Questions</h2>
        <p className="text-blue-100">Manage and respond to student queries efficiently</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="answered">Answered</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Showing {filteredDoubts.length} {filteredDoubts.length === 1 ? 'doubt' : 'doubts'}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredDoubts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No doubts yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            When students submit questions, they'll appear here for you to review and respond to.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDoubts.map((doubt) => {
            const isExpanded = expandedDoubts.has(doubt.id);
            return (
              <div key={doubt.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Compact Doubt Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Question Title and Status */}
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-3">{doubt.title}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            doubt.status === 'answered' 
                              ? 'bg-green-100 text-green-700' 
                              : doubt.status === 'resolved'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {doubt.status === 'answered' 
                              ? '✓ Answered' 
                              : doubt.status === 'resolved'
                              ? '✅ Resolved'
                              : '⏱ Pending'}
                          </span>
                          <button
                            onClick={() => toggleDoubtExpansion(doubt.id)}
                            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                            title={isExpanded ? "Collapse conversation" : "Expand conversation"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-700 text-sm mb-3 line-clamp-2">{doubt.description}</p>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                                 <div className="flex items-center gap-1">
                           <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-xs">
                             {doubt.user?.display_name?.[0] || 'S'}
                           </div>
                           <span>{doubt.user?.display_name || 'Student'}</span>
                         </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{doubt.course?.title}</span>
                        </div>
                        <span>•</span>
                        <span>
                          {new Date(doubt.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {doubt.replies && doubt.replies.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 font-medium">
                              {doubt.replies.length} {doubt.replies.length === 1 ? 'reply' : 'replies'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expandable Conversation Section */}
                {isExpanded && (
                  <div className="border-t bg-gray-50">
                    <div className="p-4">
                      {/* Full Description */}
                      <div className="mb-4 p-3 bg-white rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Question Details</h4>
                        <p className="text-gray-700 leading-relaxed">{doubt.description}</p>
                      </div>

                      {/* Course/Lecture Info */}
                      {doubt.lecture?.title && (
                        <div className="mb-4 p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <BookOpen className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-gray-700">{doubt.course?.title}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">{doubt.lecture.title}</span>
                          </div>
                        </div>
                      )}

                      {/* Conversation Thread */}
                      <div className="mb-4">
                                                 <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                           💬 Conversation
                           {doubt.replies && doubt.replies.length > 0 && (
                             <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                               {doubt.replies.length} {doubt.replies.length === 1 ? 'reply' : 'replies'}
                             </span>
                           )}
                         </h4>
                   
                         {doubt.replies && doubt.replies.length > 0 ? (
                           <div className="space-y-3 mb-4">
                             {doubt.replies.map((reply, index) => (
                               <div key={reply.id} className={`flex ${reply.is_teacher ? 'justify-end' : 'justify-start'}`}>
                                 <div className={`max-w-2xl ${reply.is_teacher ? 'order-2' : 'order-1'}`}>
                                   <div className={`flex items-start gap-2 ${reply.is_teacher ? 'flex-row-reverse' : 'flex-row'}`}>
                                     <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white font-semibold text-xs ${
                                       reply.is_teacher 
                                         ? 'bg-gradient-to-br from-green-500 to-green-600' 
                                         : 'bg-gradient-to-br from-blue-500 to-purple-600'
                                     }`}>
                                       {reply.is_teacher ? '👨‍🏫' : (reply.user?.display_name?.[0] || 'U')}
                                     </div>
                                     <div className={`flex-1 ${reply.is_teacher ? 'text-right' : 'text-left'}`}>
                                       <div className={`inline-block max-w-full p-3 rounded-lg text-sm ${
                                         reply.is_teacher 
                                           ? 'bg-green-500 text-white rounded-br-none' 
                                           : 'bg-gray-100 text-gray-900 rounded-bl-none'
                                       }`}>
                                         <div className="flex items-center gap-2 mb-1">
                                                                                    <span className="font-semibold text-xs">
                                           {reply.is_teacher 
                                             ? '👨‍🏫 Teacher' 
                                             : (reply.user?.display_name || 'Student')}
                                         </span>
                                           <span className={`text-xs ${reply.is_teacher ? 'text-green-100' : 'text-gray-500'}`}>
                                             {new Date(reply.created_at).toLocaleString('en-US', {
                                               month: 'short',
                                               day: 'numeric',
                                               hour: '2-digit',
                                               minute: '2-digit'
                                             })}
                                           </span>
                                         </div>
                                         <p className="leading-relaxed">{reply.content}</p>
                                       </div>
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="text-center py-6 mb-4">
                             <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                               <HelpCircle className="h-5 w-5 text-gray-400" />
                             </div>
                             <p className="text-gray-500 text-sm">No replies yet</p>
                             <p className="text-gray-400 text-xs">Be the first to help this student!</p>
                           </div>
                         )}

                         {/* Reply Input */}
                         <div className="bg-white rounded-lg p-3">
                           <div className="flex items-center gap-2 mb-2">
                             <div className="h-6 w-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-semibold text-xs">
                               👨‍🏫
                             </div>
                             <div>
                               <p className="font-medium text-gray-900 text-xs">Reply as Teacher</p>
                             </div>
                           </div>
                           
                           <textarea
                             value={selectedDoubt?.id === doubt.id ? replyContent : ''}
                             onChange={(e) => {
                               setReplyContent(e.target.value);
                               if (selectedDoubt?.id !== doubt.id) {
                                 setSelectedDoubt(doubt);
                               }
                             }}
                             placeholder="Type your response to help the student..."
                             rows="2"
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none mb-2 text-sm"
                           />
                           
                           <div className="flex justify-end">
                             <button
                               onClick={() => {
                                 setSelectedDoubt(doubt);
                                 handleReply(doubt.id);
                               }}
                               disabled={replying || !replyContent.trim() || selectedDoubt?.id !== doubt.id}
                               className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                                 replying || !replyContent.trim() || selectedDoubt?.id !== doubt.id
                                   ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                   : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                               }`}
                             >
                               {replying && selectedDoubt?.id === doubt.id ? (
                                 <div className="flex items-center gap-2">
                                   <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                   Posting...
                                 </div>
                               ) : (
                                 'Send Reply'
                               )}
                             </button>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
               </div>
             );
           })}
         </div>
      )}
    </div>
  );
});

const CoursesContent = memo(() => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchCourses = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleAddNewCourse = useCallback(() => {
    navigate('/courses/new');
  }, [navigate]);

  const handleDeleteCourse = useCallback(async (courseId) => {
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
  }, [fetchCourses]);

  const formatPrice = useCallback((price) => {
    if (!price) return 'Free';
    return price;
  }, []);

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
});

const LecturesContent = memo(() => {
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

  const fetchLectures = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchLectures();
  }, [fetchLectures]);

  const handleCreateLecture = useCallback(async () => {
    try {
      setSaving(true);
      
      const { data, error } = await supabase
        .from('standalone_lectures')
        .insert([newLecture])
        .select();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
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
      console.error('❌ Error creating lecture:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }, [newLecture, fetchLectures]);

  const handleDeleteLecture = useCallback(async (lectureId) => {
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
  }, [lectures]);

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
});

const CarouselContent = memo(() => {
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

  const fetchCarouselImages = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchCarouselImages();
  }, [fetchCarouselImages]);

  const handleAddImage = useCallback(async () => {
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
  }, [images, newImage]);

  const handleDeleteImage = useCallback(async (imageId) => {
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
  }, [images]);

  const handleDisplayOrderChange = useCallback(async (imageId, newOrder) => {
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
  }, []);

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
});

const UsersContent = memo(() => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">User Management</h2>
      <p className="text-gray-600 mb-4">Toggle user access permissions using the controls below:</p>
      <div className="mt-6">
        <UserManagementSidebar />
      </div>
    </div>
  );
});

const StatCard = memo(({ title, value, icon }) => {
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
});