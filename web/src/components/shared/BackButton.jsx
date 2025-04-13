import React from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 
        transition-colors rounded-lg hover:bg-gray-100"
    >
      <ChevronLeft className="w-4 h-4 mr-1" />
      Back
    </button>
  );
};

export default BackButton;
