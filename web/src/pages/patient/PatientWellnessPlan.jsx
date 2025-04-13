import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Utensils, Activity, Moon, ChevronLeft, Heart, Coffee, Droplet } from "lucide-react";
import BackButton from "../../components/shared/BackButton";

const PatientWellnessPlan = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const plan = {
    diet: {
      breakfast: ["Oatmeal with berries", "Greek yogurt", "Green tea"],
      lunch: ["Grilled chicken salad", "Quinoa", "Fresh fruits"],
      dinner: ["Baked salmon", "Steamed vegetables", "Brown rice"],
    },
    exercise: [
      { activity: "Morning walk", duration: "30 mins", intensity: "Low" },
      {
        activity: "Strength training",
        duration: "20 mins",
        intensity: "Medium",
      },
      { activity: "Evening yoga", duration: "15 mins", intensity: "Low" },
    ],
    lifestyle: [
      { type: "Hydration", tip: "Drink 8-10 glasses of water daily", icon: Droplet },
      { type: "Sleep", tip: "Aim for 7-8 hours of sleep", icon: Moon },
      { type: "Stress", tip: "Practice deep breathing exercises", icon: Coffee },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-6 relative">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      
      <div className="container mx-auto relative z-10">
        {/* Back button */}
        <button 
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center px-3 py-2 bg-white rounded-xl shadow-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Patient
        </button>
        
        {/* Main content */}
        <div className="bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Heart className="w-5 h-5 mr-2" />
              Personalized Wellness Plan
            </h2>
            <p className="text-sm text-white/80 mt-1">
              Patient ID: {id}
            </p>
          </div>

          <div className="p-6 space-y-8">
            {/* Diet Section */}
            <div>
              <div className="mb-5 border-b border-gray-100 pb-2">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Utensils className="w-5 h-5 mr-2 text-purple-600" />
                  Diet Plan
                </h3>
                <p className="text-sm text-gray-500">Recommended nutrition for optimal health</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(plan.diet).map(([meal, items]) => (
                  <div 
                    key={meal} 
                    className="p-5 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-all"
                  >
                    <h4 className="text-sm font-medium text-amber-800 mb-3 capitalize">
                      {meal}
                    </h4>
                    <ul className="space-y-2">
                      {items.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mt-1 w-2 h-2 bg-amber-400 rounded-full mr-2 flex-shrink-0"></span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Exercise Section */}
            <div>
              <div className="mb-5 border-b border-gray-100 pb-2">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-green-600" />
                  Exercise Plan
                </h3>
                <p className="text-sm text-gray-500">Daily physical activities for better health</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plan.exercise.map((item, index) => (
                  <div 
                    key={index} 
                    className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-green-100 rounded-lg mr-3">
                        <Activity className="w-4 h-4 text-green-600" />
                      </div>
                      <h4 className="font-medium text-gray-900">{item.activity}</h4>
                    </div>
                    <div className="flex justify-between">
                      <span className="px-3 py-1 bg-white rounded-lg text-sm text-gray-700 shadow-sm">
                        {item.duration}
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        item.intensity === "Low" 
                          ? "bg-green-100 text-green-800" 
                          : item.intensity === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}>
                        {item.intensity} intensity
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lifestyle Section */}
            <div>
              <div className="mb-5 border-b border-gray-100 pb-2">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Moon className="w-5 h-5 mr-2 text-blue-600" />
                  Lifestyle Tips
                </h3>
                <p className="text-sm text-gray-500">Habits to improve overall wellbeing</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plan.lifestyle.map((item, index) => {
                  const Icon = item.icon || Coffee;
                  return (
                    <div 
                      key={index} 
                      className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-center mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <Icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <h4 className="font-medium text-gray-900">{item.type}</h4>
                      </div>
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <p className="text-gray-700">{item.tip}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Patient Note Section */}
            <div className="mt-8 p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
              <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                <Heart className="w-4 h-4 mr-2 text-purple-600" />
                Patient Note
              </h3>
              <p className="text-sm text-gray-700">
                This wellness plan is personalized based on your health assessment. 
                Please follow these recommendations and report any difficulties during your next check-up.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientWellnessPlan;
