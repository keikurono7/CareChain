import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Upload, ChevronLeft, Calendar, Clipboard, FilePlus, AlertTriangle, User, Building, Stethoscope, Eye, File } from "lucide-react";
import BackButton from "../../components/shared/BackButton";
import ReactMarkdown from 'react-markdown';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Your Gemini API key should be in .env file
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "AIzaSyDIj_BIwaYHQoNKDkZxdf1IZ3KtMS5lk2Y";

const NewCheckup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your drug interaction analyzer. Please enter a new medication to check for interactions with the patient's existing prescriptions.",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  // Additional prescription fields
  const [doctorName, setDoctorName] = useState("");
  const [hospital, setHospital] = useState("");
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [medicalCondition, setMedicalCondition] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  
  // Existing prescriptions and medications
  const [existingPrescriptions, setExistingPrescriptions] = useState([]);
  const [existingMedications, setExistingMedications] = useState([]);

  // PDF generation state
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const prescriptionPdfRef = useRef(null);

  // Fetch user's existing prescriptions when component loads
  useEffect(() => {
    fetchPatientPrescriptions();
  }, [id]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Function to fetch patient's existing prescriptions
  const fetchPatientPrescriptions = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/prescriptions/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setExistingPrescriptions(data.prescriptions || []);
        
        // Extract medications from prescriptions
        const medications = [];
        data.prescriptions?.forEach(prescription => {
          if (prescription.medication) {
            medications.push(prescription.medication);
          }
        });
        
        setExistingMedications(medications);
        
        // Set patient email if available
        if (data.email) {
          setPatientEmail(data.email);
        }
        
        // Log the medications for debugging
        console.log("Patient's current medications:", medications);
        
        // Update the initial message to include current medications
        if (medications.length > 0) {
          setChatMessages([
            {
              role: "assistant",
              content: `Hello! I'm your drug interaction analyzer. The patient is currently taking: ${medications.join(", ")}. Please enter a new medication to check for potential interactions with these existing medications.`,
            },
          ]);
        }
      } else {
        console.error("Failed to fetch patient prescriptions");
      }
    } catch (error) {
      console.error("Error fetching patient prescriptions:", error);
    }
  };

  // Function to call Gemini API with focus on drug interactions
  const callGeminiAPI = async (newMedication) => {
    setIsLoading(true);

    try {
      // Validate input
      if (!newMedication.trim()) {
        setChatMessages(prev => [...prev, {
          role: "assistant",
          content: "Please enter a valid medication name."
        }]);
        setIsLoading(false);
        return null;
      }

      const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      };

      // Format the medication query based on existing medications
      let formattedQuery = "";
      
      if (existingMedications.length > 0) {
        formattedQuery = `Check for drug interactions between the new medication '${newMedication}' and the patient's existing medications: ${existingMedications.join(", ")}.`;
      } else {
        formattedQuery = `Provide information about the medication '${newMedication}' and potential interactions with other common medications.`;
      }

      const data = {
        generationConfig,
        contents: [
          {
            role: "user",
            parts: [{ text: formattedQuery }],
          }
        ],
        systemInstruction: {
          role: "user",
          parts: [
            {
              text: 'You are an AI clinical assistant specializing in medication interaction analysis. Your primary role is to analyze a new medication against a patient\'s existing prescriptions for potential interactions and provide clear, concise information about any risks. When given a new medication and list of existing medications: 1) Identify all medications and their primary uses 2) Analyze potential interactions between the new medication and each existing medication 3) Classify each interaction severity as High, Medium, or Low risk 4) Provide specific warnings about side effects or dangers 5) Suggest monitoring parameters or alternative medications if appropriate. Your response should use a structured format: - Begin with a summary of the analysis - List each medication interaction separately with its risk level - Provide concise explanations of each interaction mechanism - Include specific warnings and monitoring needs - Suggest alternatives only if high-risk interactions exist. Use plain, direct language that healthcare professionals can quickly understand. When uncertain about an interaction, clearly state the limitations of your knowledge and suggest consulting official drug resources. Always prioritize patient safety in your recommendations.',
            },
          ],
        },
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const responseData = await response.json();

      if (responseData.candidates && responseData.candidates[0]?.content?.parts[0]?.text) {
        return responseData.candidates[0].content.parts[0].text;
      } else {
        console.error("Unexpected API response:", responseData);
        return "I couldn't analyze these medications. Please check the medication name and try again.";
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return "I encountered an error while analyzing these medications. Please try again later.";
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle sending a message for drug interaction check
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // Add user message to chat
    setChatMessages((prev) => [...prev, { role: "user", content: inputMessage }]);

    // Clear input field
    const messageToBeSent = inputMessage;
    setInputMessage("");

    // Get AI response for drug interaction
    const aiResponse = await callGeminiAPI(messageToBeSent);
    
    if (aiResponse) {
      // Add AI response to chat
      setChatMessages((prev) => [...prev, { role: "assistant", content: aiResponse }]);
    }
  };

  // Function to handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Function to upload prescription to blockchain
  const handleUploadPrescription = async () => {
    if (!prescriptionNotes.trim() && !selectedFile) {
      alert("Please enter prescription details or select a file to upload.");
      return;
    }

    if (!doctorName.trim()) {
      alert("Please enter the doctor's name.");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare form data with the prescription details
      const formData = new FormData();
      formData.append("patient_id", id);
      formData.append("patient_email", patientEmail);
      
      if (prescriptionNotes.trim()) {
        formData.append("prescription_text", prescriptionNotes);
      }
      
      if (selectedFile) {
        formData.append("prescription_file", selectedFile);
      }

      // Extract medication details from prescription text
      const medicationMatch = prescriptionNotes.match(/(?:prescribed|medication|taking|take)\s+([A-Za-z0-9\s]+(?:\d+\s*mg)?)/i);
      const medication = medicationMatch ? medicationMatch[1].trim() : "Medication";
      
      // Extract dosage details if present
      const dosageMatch = prescriptionNotes.match(/(\d+\s*mg|\d+\s*mcg|\d+\s*ml)/i);
      const dosage = dosageMatch ? dosageMatch[0] : "";

      // Create prescription data object with all the additional fields
      const prescriptionData = {
        medication: medication,
        dosage: dosage,
        instructions: prescriptionNotes,
        date: prescriptionDate,
        doctor: doctorName,
        hospital: hospital,
        condition: medicalCondition,
        patient_id: id,
        patient_email: patientEmail
      };

      // Upload to blockchain
      const response = await fetch(`http://localhost:5000/api/upload-prescription/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prescriptionData),
      });

      if (response.ok) {
        alert("Prescription uploaded successfully to blockchain!");
        // Clear form after successful upload
        setPrescriptionNotes("");
        setSelectedFile(null);
        setDoctorName("");
        setHospital("");
        setMedicalCondition("");
        setPrescriptionDate(new Date().toISOString().split('T')[0]);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        
        // Refresh the patient's prescriptions
        fetchPatientPrescriptions();
      } else {
        const error = await response.text();
        throw new Error(error || "Failed to upload prescription");
      }
    } catch (error) {
      console.error("Error uploading prescription:", error);
      alert(`Error uploading prescription: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate PDF from the prescription form
  const generatePrescriptionPDF = async () => {
    if (!prescriptionNotes.trim() || !doctorName.trim()) {
      alert("Please enter doctor name and prescription details.");
      return;
    }

    setIsLoading(true);

    try {
      // Create a PDF document
      const pdf = new jsPDF("p", "mm", "a4");
      
      // Add a header
      pdf.setFontSize(20);
      pdf.setTextColor(75, 59, 172);
      pdf.text("Medical Prescription", 105, 20, { align: "center" });
      
      // Add a line
      pdf.setDrawColor(75, 59, 172);
      pdf.setLineWidth(0.5);
      pdf.line(20, 25, 190, 25);
      
      // Add doctor and hospital details
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Dr. ${doctorName}`, 20, 35);
      
      if (hospital.trim()) {
        pdf.text(`${hospital}`, 20, 42);
      }
      
      // Add date
      pdf.text(`Date: ${new Date(prescriptionDate).toLocaleDateString()}`, 150, 35);
      
      // Add patient details
      pdf.setFontSize(12);
      pdf.text(`Patient ID: ${id}`, 20, 55);
      if (patientEmail) {
        pdf.text(`Email: ${patientEmail}`, 20, 62);
      }
      
      // Add condition if available
      if (medicalCondition.trim()) {
        pdf.text(`Diagnosis: ${medicalCondition}`, 20, 72);
      }
      
      // Draw a line to separate prescription content
      pdf.line(20, 80, 190, 80);
      
      // Add prescription title
      pdf.setFontSize(14);
      pdf.setTextColor(75, 59, 172);
      pdf.text("Prescription", 20, 90);
      
      // Add prescription content
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      
      // Split prescription text into lines to prevent overflow
      const splitText = pdf.splitTextToSize(prescriptionNotes, 160);
      pdf.text(splitText, 20, 100);
      
      // Add footer
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text("This prescription was generated digitally and secured with WEAL blockchain.", 105, 270, { align: "center" });
      
      // Generate and set PDF URL for preview
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setPdfGenerated(true);
      
      // Update selectedFile to use this PDF for upload
      const pdfFile = new File([pdfBlob], `Prescription_${id}_${new Date().getTime()}.pdf`, { type: 'application/pdf' });
      setSelectedFile(pdfFile);
      
      console.log("PDF generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("PDF generated successfully");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-3 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">New Checkup Session</h2>
              <p className="text-sm text-gray-600">Patient ID: {id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="container mx-auto px-6 py-8 relative">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="flex flex-col md:flex-row gap-6 relative z-10">
          {/* Left Half - Drug Interaction Checker */}
          <div className="w-full md:w-1/2 flex flex-col bg-white rounded-xl shadow-lg overflow-hidden border border-purple-100">
            <div className="p-4 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-700">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Drug Interaction Checker
              </h3>
            </div>

            {/* Current Medications Display */}
            {existingMedications.length > 0 && (
              <div className="p-3 bg-indigo-50 border-b border-indigo-100">
                <h4 className="text-sm font-medium text-indigo-800 mb-2">Current Medications:</h4>
                <div className="flex flex-wrap gap-2">
                  {existingMedications.map((med, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white rounded-full text-xs border border-indigo-200 text-indigo-700">
                      {med}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Scrollable Chat Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 h-[450px]">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl shadow px-4 py-3 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-700 text-white"
                        : "bg-white border border-gray-200 text-gray-800"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="markdown">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-xl px-4 py-3 bg-white border border-gray-200 shadow">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div
                        className="h-2 w-2 bg-purple-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="h-2 w-2 bg-purple-600 rounded-full animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input Form - Fixed at bottom */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50"
            >
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Enter a new medication to check for interactions"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className={`px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl shadow-md transition-all ${
                    isLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:from-purple-700 hover:to-indigo-800 hover:shadow-lg"
                  }`}
                  disabled={isLoading}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Right Half - Prescription Upload */}
          <div className="w-full md:w-1/2 flex flex-col bg-white rounded-xl shadow-lg overflow-hidden border border-purple-100">
            <div className="p-4 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-700">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Clipboard className="w-5 h-5 mr-2" />
                Prescription Upload
              </h3>
            </div>

            {/* Scrollable Prescription Area */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-4">
              {/* Additional prescription fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Doctor Name*
                  </label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Dr. Name"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Building className="w-4 h-4 inline mr-1" />
                    Hospital
                  </label>
                  <input
                    type="text"
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    placeholder="Hospital or Clinic"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Prescription Date
                  </label>
                  <input
                    type="date"
                    value={prescriptionDate}
                    onChange={(e) => setPrescriptionDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Stethoscope className="w-4 h-4 inline mr-1" />
                    Medical Condition
                  </label>
                  <input
                    type="text"
                    value={medicalCondition}
                    onChange={(e) => setMedicalCondition(e.target.value)}
                    placeholder="Diagnosis or Condition"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              
              {/* Patient Email - auto-filled if available */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Email
                </label>
                <input
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50"
                />
              </div>
              
              {/* Prescription notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prescription Details*
                </label>
                <textarea
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  placeholder="Type your prescription notes here including medication, dosage, frequency, etc."
                  className="w-full p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-28"
                  required
                />
              </div>
              
              {/* PDF Preview Section */}
              {pdfGenerated && pdfUrl && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
                    <File className="w-4 h-4 mr-2 text-purple-600" />
                    Generated Prescription PDF
                  </h4>
                  <div className="flex justify-center mb-3">
                    <iframe 
                      src={pdfUrl} 
                      className="w-full h-64 border border-gray-300 rounded-xl"
                      title="Prescription PDF Preview"
                    />
                  </div>
                  <div className="flex justify-center">
                    <a 
                      href={pdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-purple-600 hover:text-purple-800 flex items-center text-sm"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Open in New Tab
                    </a>
                  </div>
                </div>
              )}
              
              {/* File upload section - only show if PDF not generated */}
              {!pdfGenerated && (
                <div className="mt-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">Or upload an existing prescription document:</p>
                  <div className="flex items-center justify-center">
                    <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg shadow-lg tracking-wide border border-blue border-purple-100 cursor-pointer hover:bg-gray-50 transition-colors">
                      <Upload className="w-8 h-8 text-purple-600" />
                      <span className="mt-2 text-base leading-normal text-gray-600">
                        {selectedFile ? selectedFile.name : "Select a file"}
                      </span>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        accept=".pdf,.jpg,.jpeg,.png" 
                      />
                    </label>
                  </div>
                  {selectedFile && (
                    <p className="mt-2 text-sm text-gray-500 text-center">
                      File selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={generatePrescriptionPDF}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl shadow-md hover:from-indigo-700 hover:to-purple-800 hover:shadow-xl transition-all flex items-center justify-center"
                  disabled={isLoading || !prescriptionNotes.trim() || !doctorName.trim()}
                >
                  <File className="w-5 h-5 mr-2" />
                  {pdfGenerated ? "Regenerate PDF" : "Generate PDF"}
                </button>
                
                {pdfGenerated && (
                  <button
                    onClick={() => {
                      setPdfGenerated(false);
                      setPdfUrl(null);
                      setSelectedFile(null);
                    }}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50">
              <button
                onClick={handleUploadPrescription}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl shadow-md hover:from-purple-700 hover:to-indigo-800 hover:shadow-xl transition-all flex items-center justify-center"
                disabled={isLoading || (!selectedFile && !pdfGenerated)}
              >
                <FilePlus className="w-5 h-5 mr-2" />
                Upload to Blockchain
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NewCheckup;