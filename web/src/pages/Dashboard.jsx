import React from "react";
import { Users, AlertTriangle, FileText, Activity, Calendar, Clock, ChevronRight } from "lucide-react";

const Dashboard = () => {
  // Sample data for recent activity
  const recentActivities = [
    { id: 1, type: "checkup", patient: "John Doe", time: "Today, 10:30 AM", status: "Completed" },
    { id: 2, type: "prescription", patient: "Jane Smith", time: "Yesterday, 3:15 PM", status: "Updated" },
    { id: 3, type: "alert", patient: "Robert Johnson", time: "Apr 10, 2:45 PM", status: "High Risk" },
    { id: 4, type: "referral", patient: "Emily Clark", time: "Apr 9, 11:20 AM", status: "Sent" }
  ];

  // Upcoming appointments
  const upcomingAppointments = [
    { id: 1, patient: "Sarah Williams", time: "Today, 2:00 PM", type: "Follow-up" },
    { id: 2, patient: "Michael Brown", time: "Tomorrow, 9:30 AM", type: "Initial Consultation" },
    { id: 3, patient: "Linda Taylor", time: "Apr 15, 11:00 AM", type: "Test Results" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-6 px-6 relative">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      
      <div className="container mx-auto relative z-10">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, Dr. Doe</h1>
          <p className="text-gray-600">Here's what's happening with your patients today.</p>
        </div>
      
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SummaryCard
            title="Total Patients"
            value="124"
            icon={Users}
            colorFrom="from-blue-500"
            colorTo="to-cyan-500"
          />
          <SummaryCard
            title="Alerts Today"
            value="8"
            icon={AlertTriangle}
            colorFrom="from-amber-500"
            colorTo="to-orange-500"
          />
          <SummaryCard
            title="High-Risk Cases"
            value="3"
            icon={FileText}
            colorFrom="from-rose-500"
            colorTo="to-red-500"
          />
        </div>

        {/* Main dashboard grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Recent Activity
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map(activity => (
                  <div key={activity.id} className="flex items-center p-3 rounded-lg hover:bg-purple-50 transition-colors border border-gray-100 shadow-sm">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'alert' ? 'bg-red-100 text-red-600' :
                      activity.type === 'checkup' ? 'bg-green-100 text-green-600' :
                      activity.type === 'prescription' ? 'bg-blue-100 text-blue-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {activity.type === 'alert' && <AlertTriangle className="w-5 h-5" />}
                      {activity.type === 'checkup' && <Users className="w-5 h-5" />}
                      {activity.type === 'prescription' && <FileText className="w-5 h-5" />}
                      {activity.type === 'referral' && <ChevronRight className="w-5 h-5" />}
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.patient}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activity.status === 'High Risk' ? 'bg-red-100 text-red-800' :
                      activity.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      activity.status === 'Updated' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Appointments - Takes 1 column */}
          <div className="bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Upcoming Appointments
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {upcomingAppointments.map(appointment => (
                  <div key={appointment.id} className="flex items-start p-3 rounded-lg hover:bg-purple-50 transition-colors border border-gray-100 shadow-sm">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{appointment.patient}</p>
                      <p className="text-xs text-gray-500">{appointment.time}</p>
                      <span className="mt-1 inline-block text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                        {appointment.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-lg py-2 text-sm font-medium shadow-md transition-all hover:shadow-lg">
                View All Appointments
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, icon: Icon, colorFrom, colorTo }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-purple-100 relative overflow-hidden group transition-all hover:shadow-xl">
      {/* Card gradient overlay - visible on hover */}
      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
      
      <div className="px-6 py-5 flex items-center">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${colorFrom} ${colorTo} text-white shadow-md`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="w-16 h-16 absolute right-0 top-0 opacity-10">
          <Icon className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
