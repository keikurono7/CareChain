import React from "react";
import { Utensils, Activity, Moon } from "lucide-react";

const WellnessPlan = () => {
  const mealPlan = {
    breakfast: ["Oatmeal with berries", "Greek yogurt", "Green tea"],
    lunch: ["Grilled chicken salad", "Quinoa", "Fresh fruits"],
    dinner: ["Baked salmon", "Steamed vegetables", "Brown rice"],
  };

  const exercisePlan = [
    { activity: "Morning walk", duration: "30 mins", intensity: "Low" },
    { activity: "Strength training", duration: "20 mins", intensity: "Medium" },
    { activity: "Evening yoga", duration: "15 mins", intensity: "Low" },
  ];

  const wellnessTips = [
    { type: "Hydration", tip: "Drink 8-10 glasses of water daily" },
    { type: "Sleep", tip: "Aim for 7-8 hours of sleep" },
    { type: "Stress", tip: "Practice deep breathing exercises" },
  ];

  return (
    <div className="space-y-6">
      {/* Meal Plan */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Utensils className="w-5 h-5 mr-2" />
            Meal Plan
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(mealPlan).map(([meal, items]) => (
            <div key={meal} className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-3 capitalize">
                {meal}
              </h3>
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Exercise Plan */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Exercise Plan
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exercisePlan.map((exercise, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">
                  {exercise.activity}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {exercise.duration} • {exercise.intensity} intensity
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wellness Tips */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Moon className="w-5 h-5 mr-2" />
            Wellness Tips
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {wellnessTips.map((tip, index) => (
              <div key={index} className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900">{tip.type}</h3>
                <p className="text-sm text-blue-700 mt-1">{tip.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellnessPlan;
