import React, { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { BookOpen, Users, Settings, LogOut, Bell, Menu, X } from "lucide-react";

const Dashboard = () => {
  const location = useLocation();
  const [activeOption, setActiveOption] = useState(location.state?.activeOption || 'courses');
  const [showSidebar, setShowSidebar] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Show success message if redirected from course edit
  useEffect(() => {
    if (location.state?.message) {
      // You can show a toast notification here
      console.log(location.state.message);
    }
  }, [location.state]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-30`}>
        <div className="flex flex-col h-full bg-white w-64 shadow-lg">
          <div className="p-4">
            <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
            <nav className="flex-1 px-2 py-4 space-y-1">
              <button
                onClick={() => setActiveOption('courses')}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md w-full
                  ${activeOption === 'courses' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <BookOpen className="mr-3 h-5 w-5" />
                Courses
              </button>
              <li>
                <a href="#" className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <span className="ml-3">Analytics</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <span className="ml-3">Reports</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <span className="ml-3">Settings</span>
                </a>
              </li>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, User</span>
              <div className="w-8 h-8 rounded-full bg-gray-300"></div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">1,234</p>
              <p className="text-green-500 mt-2">+12% from last month</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">Revenue</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">$45,678</p>
              <p className="text-green-500 mt-2">+8% from last month</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">Active Projects</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
              <p className="text-green-500 mt-2">+4 from last month</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-gray-700">New user registration</p>
                <span className="text-gray-500 text-sm">2 hours ago</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-gray-700">Project update</p>
                <span className="text-gray-500 text-sm">5 hours ago</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <p className="text-gray-700">System maintenance</p>
                <span className="text-gray-500 text-sm">1 day ago</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard; 