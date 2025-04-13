import React, { useState } from "react";
import { Upload, FileText, AlertTriangle } from "lucide-react";

const UploadPrescription = () => {
  const [file, setFile] = useState(null);
  const [extractedDrugs, setExtractedDrugs] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setFile(file);
  };

  const runOCR = () => {
    // Mock OCR result
    setExtractedDrugs([
      { name: "Metformin", dosage: "500mg" },
      { name: "Lisinopril", dosage: "10mg" },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Prescription</h2>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            id="prescription-upload"
            accept=".pdf,image/*"
          />
          <label
            htmlFor="prescription-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="w-12 h-12 text-gray-400 mb-3" />
            <span className="text-sm text-gray-600">
              Drop your prescription file here or click to upload
            </span>
            <span className="text-xs text-gray-500 mt-2">
              Supports PDF and images
            </span>
          </label>
        </div>

        {file && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg flex items-center">
            <FileText className="w-6 h-6 text-blue-500 mr-3" />
            <span className="text-sm text-gray-700">{file.name}</span>
            <button
              onClick={runOCR}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Run OCR
            </button>
          </div>
        )}

        {extractedDrugs && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Extracted Medications</h3>
            <div className="space-y-3">
              {extractedDrugs.map((drug, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{drug.name}</p>
                    <p className="text-sm text-gray-600">{drug.dosage}</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Check Interactions
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPrescription;
