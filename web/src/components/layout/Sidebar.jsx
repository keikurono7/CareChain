import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Settings, Beaker, Heart, LogOut } from "lucide-react";

const navItems = [
  { name: "Patients", icon: Users, path: "/patients" }, // Move Patients to top
  { name: "Compatibility Test", icon: Beaker, path: "/compatibility" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

const Sidebar = () => {
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-white shadow-xl border-r border-purple-100 relative overflow-hidden">
        {/* Decorative element */}
        <div className="absolute -right-6 -top-10 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        <div className="absolute -left-6 -bottom-10 w-32 h-32 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        
        {/* Header with logo */}
        <div className="relative z-10 flex items-center h-16 px-6 bg-gradient-to-r from-purple-600 to-indigo-700">
          <Heart className="w-6 h-6 text-white mr-2 animate-pulse" />
          <span className="text-xl font-bold text-white">
            CareChain AI
          </span>
        </div>
        
        {/* Navigation items */}
        <nav className="flex-1 px-4 py-6 space-y-2 relative z-10">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-md"
                    : "text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                }`
              }
            >
              <item.icon className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110`} />
              {item.name}
            </NavLink>
          ))}
        </nav>
        
        {/* Bottom section with logout */}
        <div className="relative z-10 p-4 border-t border-gray-200">
          <button className="flex w-full items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
