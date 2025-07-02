import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, AlertCircle, RefreshCw } from 'lucide-react';

export default function DatabaseChecker() {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState(null);

  const checkDatabase = async () => {
    setChecking(true);
    const checkResults = {
      lectures: { exists: false, error: null, columns: [] },
      standalone_lectures: { exists: false, error: null, columns: [] },
      courses: { exists: false, error: null, columns: [] }
    };

    try {
      // Check lectures table
      try {
        const { data, error } = await supabase
          .from('lectures')
          .select('*')
          .limit(1);
        
        if (error) {
          checkResults.lectures.error = error.message;
        } else {
          checkResults.lectures.exists = true;
          if (data && data.length > 0) {
            checkResults.lectures.columns = Object.keys(data[0]);
          }
        }
      } catch (err) {
        checkResults.lectures.error = err.message;
      }

      // Check standalone_lectures table
      try {
        const { data, error } = await supabase
          .from('standalone_lectures')
          .select('*')
          .limit(1);
        
        if (error) {
          checkResults.standalone_lectures.error = error.message;
        } else {
          checkResults.standalone_lectures.exists = true;
          if (data && data.length > 0) {
            checkResults.standalone_lectures.columns = Object.keys(data[0]);
          }
        }
      } catch (err) {
        checkResults.standalone_lectures.error = err.message;
      }

      // Check courses table
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .limit(1);
        
        if (error) {
          checkResults.courses.error = error.message;
        } else {
          checkResults.courses.exists = true;
          if (data && data.length > 0) {
            checkResults.courses.columns = Object.keys(data[0]);
          }
        }
      } catch (err) {
        checkResults.courses.error = err.message;
      }

    } catch (error) {
      console.error('Error checking database:', error);
    }

    setResults(checkResults);
    setChecking(false);
  };

  const expectedColumns = {
    lectures: ['id', 'title', 'description', 'video_url', 'thumbnail_url', 'duration', 'course_id', 'order', 'created_at'],
    standalone_lectures: ['id', 'title', 'description', 'video_url', 'thumbnail_url', 'duration', 'is_active', 'created_at'],
    courses: ['id', 'title', 'description', 'image_url', 'price', 'is_active', 'created_at']
  };

  const TableStatus = ({ tableName, result }) => {
    const expected = expectedColumns[tableName];
    const missing = expected.filter(col => !result.columns.includes(col));
    
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-3">
          {result.exists ? (
            <Check className="text-green-500" size={20} />
          ) : (
            <X className="text-red-500" size={20} />
          )}
          <h3 className="font-medium">{tableName}</h3>
        </div>
        
        {result.error && (
          <div className="bg-red-50 text-red-600 p-2 rounded text-sm mb-3">
            Error: {result.error}
          </div>
        )}
        
        {result.exists && (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Columns found:</span> {result.columns.length}
            </div>
            
            {missing.length > 0 && (
              <div className="bg-yellow-50 text-yellow-700 p-2 rounded text-sm">
                <div className="flex items-center gap-1 mb-1">
                  <AlertCircle size={14} />
                  <span className="font-medium">Missing columns:</span>
                </div>
                <div className="text-xs">{missing.join(', ')}</div>
              </div>
            )}
            
            <details className="text-sm">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                View all columns
              </summary>
              <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                {result.columns.join(', ')}
              </div>
            </details>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Database Structure Checker</h2>
          <p className="text-gray-600 mt-1">
            Check if your Supabase tables are set up correctly for lecture functionality.
          </p>
        </div>
        
        <div className="p-6">
          <button
            onClick={checkDatabase}
            disabled={checking}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`${checking ? 'animate-spin' : ''}`} size={16} />
            {checking ? 'Checking...' : 'Check Database'}
          </button>
          
          {results && (
            <div className="mt-6 space-y-4">
              <h3 className="font-medium text-lg">Results:</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <TableStatus tableName="lectures" result={results.lectures} />
                <TableStatus tableName="standalone_lectures" result={results.standalone_lectures} />
                <TableStatus tableName="courses" result={results.courses} />
              </div>
              
              <div className="bg-blue-50 text-blue-700 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Next Steps:</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Check console for detailed error messages when saving lectures</li>
                  <li>Verify your RLS (Row Level Security) policies allow inserts</li>
                  <li>Make sure required columns are not missing</li>
                  <li>Check if you have proper permissions on these tables</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 