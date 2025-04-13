import React from "react";
import { Bell, Sun, User, Search } from "lucide-react";

const TopBar = () => {
  return (
    <header className="bg-white shadow-md border-b border-purple-100 relative z-10">
      {/* Subtle decorative element */}
      <div className="absolute right-0 top-0 w-32 h-16 bg-purple-200 rounded-bl-full mix-blend-multiply filter blur-xl opacity-40"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between h-16">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-800 truncate bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Dashboard
            </h2>
          </div>
          
          {/* Search bar */}
          <div className="hidden md:block flex-1 max-w-md mx-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="search"
                placeholder="Search..."
                className="pl-10 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button className="p-2 text-gray-600 hover:text-purple-600 bg-white hover:bg-purple-50 rounded-xl transition-colors relative">
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              <Bell className="w-5 h-5" />
            </button>
            
            <button className="p-2 text-gray-600 hover:text-purple-600 bg-white hover:bg-purple-50 rounded-xl transition-colors">
              <Sun className="w-5 h-5" />
            </button>
            
            <div className="ml-2 pl-3 border-l border-gray-200">
              <button className="flex items-center text-sm font-medium text-gray-700 hover:text-purple-700 transition-colors px-3 py-2 rounded-xl hover:bg-purple-50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-700 flex items-center justify-center text-white mr-2 shadow-md">
                  <User className="w-4 h-4" />
                </div>
                <span>Dr. John Doe</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
