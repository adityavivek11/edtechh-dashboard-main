import { useState, useEffect, useCallback, memo } from 'react';
import { supabase } from '../lib/supabase';

const UserManagementSidebar = memo(() => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all users from the profiles table
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // First try to get all fields to see column names
      const { data: sampleData, error: sampleError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchUsers();

    // Set up real-time subscription with debouncing
    let timeoutId;
    const subscription = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles' 
        }, 
        (payload) => {
          // Debounce the fetch to prevent excessive calls
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            fetchUsers();
          }, 500);
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(subscription);
    };
  }, [fetchUsers]);

  // Toggle isAllowed status for a user
  const toggleUserStatus = useCallback(async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      
      // Update local state immediately for better user experience
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, isAllowed: newStatus } 
            : user
        )
      );
      
      // Then update the database
      const { error, data } = await supabase
        .from('profiles')
        .update({ 
          isAllowed: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();
      
      if (error) {
        console.error('Update error:', error);
        // Revert the local state if there was an error
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, isAllowed: currentStatus } 
              : user
          )
        );
        throw error;
      }
      // The UI will update via the subscription if needed
    } catch (err) {
      console.error('Error updating user status:', err);
      setError(err.message);
    }
  }, []);

  // Helper function to get the isAllowed value, handling potential case sensitivity issues
  const getUserAllowedStatus = useCallback((user) => {
    // Attempt to find isAllowed with various case possibilities
    return user.isAllowed !== undefined ? user.isAllowed : 
           user.isallowed !== undefined ? user.isallowed :
           user.ISALLOWED !== undefined ? user.ISALLOWED : false;
  }, []);

  if (loading) return <div className="p-4">Loading users...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="bg-white shadow-md rounded-lg p-4 w-full max-w-3xl">
      <h2 className="text-xl font-bold mb-4">User Management ({users.length} users)</h2>
      {users.length === 0 ? (
        <div>
          <p className="text-amber-600">No users found. This may be due to:</p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li>Permission issues with the Supabase query</li>
            <li>The isAllowed column might be missing in your profiles table</li>
            <li>Check the browser console for more detailed error messages</li>
          </ul>
        </div>
      ) : (
        <ul className="space-y-3">
          {users.map(user => {
            const isAllowed = getUserAllowedStatus(user);
            return (
              <UserItem 
                key={user.id} 
                user={user} 
                isAllowed={isAllowed} 
                onToggle={toggleUserStatus} 
              />
            );
          })}
        </ul>
      )}
    </div>
  );
});

// Memoized UserItem component to prevent unnecessary re-renders
const UserItem = memo(({ user, isAllowed, onToggle }) => (
  <li className="flex items-center justify-between p-2 border-b">
    <span className="text-sm truncate">{user.full_name}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={isAllowed}
        onChange={() => onToggle(user.id, isAllowed)}
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      <span className="ml-2 text-xs text-gray-700">
        {isAllowed ? 'Allowed' : 'Blocked'}
      </span>
    </label>
  </li>
));

export default UserManagementSidebar; 