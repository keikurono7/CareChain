import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, AntDesign, MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as DocumentPicker from 'expo-document-picker';
import { API_BASE_URL } from '../../global.js';

export default function AddPrescription() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  // PDF File state
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  
  // Form fields - simplified as requested
  const [formData, setFormData] = useState({
    doctor: '',
    hospital: '',
    condition: '',
    date: getCurrentDate() // Get current date in YYYY-MM-DD format
  });

  // Get current date in YYYY-MM-DD format
  function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const storedEmail = await SecureStore.getItemAsync('userEmail');
        if (storedEmail) setUserEmail(storedEmail);
      } catch (error) {
        console.error('Failed to retrieve email:', error);
      }
    };
    fetchUserEmail();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });
      
      if (result.canceled === false && result.assets && result.assets[0]) {
        const file = result.assets[0];
        console.log('Selected file:', file);
        setPrescriptionFile(file);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const validateForm = () => {
    if (!formData.doctor.trim()) return "Doctor name is required";
    if (!formData.hospital.trim()) return "Hospital/Clinic name is required";
    if (!formData.condition.trim()) return "Medical condition is required";
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.date)) {
      return "Date must be in YYYY-MM-DD format";
    }
    
    // Validate that a PDF file is selected
    if (!prescriptionFile) {
      return "Please upload a prescription PDF";
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert("Form Error", error);
      return;
    }

    if (!userEmail) {
      Alert.alert("Error", "User email not found. Please log in again.");
      return;
    }

    setLoading(true);

    try {
      // Create form data for multipart/form-data request
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('email', userEmail);
      formDataToSend.append('doctor', formData.doctor);
      formDataToSend.append('hospital', formData.hospital);
      formDataToSend.append('condition', formData.condition);
      formDataToSend.append('date', formData.date);

      // Add the PDF file
      if (prescriptionFile) {
        // Create a file object that FormData can work with
        const fileInfo = {
          uri: prescriptionFile.uri,
          type: 'application/pdf',
          name: prescriptionFile.name || 'prescription.pdf',
        };
        
        formDataToSend.append('prescriptionFile', fileInfo);
      }

      console.log('Sending prescription data to API...');
      
      // Send the multipart/form-data request
      const response = await fetch(`${API_BASE_URL}/api/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        body: formDataToSend,
      });
      
      console.log('API response status:', response.status);
      
      // Check if response is valid JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        
        if (response.ok) {
          Alert.alert(
            "Success",
            `Prescription added successfully!\nID: ${result.prescriptionId}`,
            [{ text: "OK", onPress: () => router.back() }]
          );
        } else {
          Alert.alert("Error", result.detail || "Failed to add prescription");
        }
      } else {
        // Handle non-JSON response
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        Alert.alert(
          "Error", 
          "Server returned an invalid response format. Please try again later."
        );
      }
    } catch (error) {
      console.error('Error adding prescription:', error);
      Alert.alert(
        "Error", 
        `Network error: ${error.message}. Please try again later.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Prescription</Text>
        <View style={styles.placeholderButton} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Prescription Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Patient Email</Text>
              <View style={styles.emailContainer}>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={userEmail}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Doctor Name<Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Enter doctor's name"
                value={formData.doctor}
                onChangeText={(text) => handleChange('doctor', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hospital / Clinic<Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Enter hospital or clinic name"
                value={formData.hospital}
                onChangeText={(text) => handleChange('hospital', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Medical Condition<Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the medical condition"
                multiline
                numberOfLines={3}
                value={formData.condition}
                onChangeText={(text) => handleChange('condition', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date<Text style={styles.required}>*</Text></Text>
              <View style={styles.dateContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={formData.date}
                  onChangeText={(text) => handleChange('date', text)}
                  keyboardType="number-pad"
                />
                <AntDesign 
                  name="calendar" 
                  size={18} 
                  color="#4a6da7" 
                  style={styles.calendarIcon}
                />
              </View>
              <Text style={styles.dateHint}>Format: YYYY-MM-DD (e.g. 2025-04-12)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prescription PDF<Text style={styles.required}>*</Text></Text>
              <TouchableOpacity 
                style={styles.fileUploadButton} 
                onPress={pickDocument}
              >
                <MaterialIcons name="upload-file" size={24} color="#4a6da7" />
                <Text style={styles.uploadButtonText}>
                  {prescriptionFile ? 'Change Selected File' : 'Select Prescription PDF'}
                </Text>
              </TouchableOpacity>
              
              {prescriptionFile && (
                <View style={styles.selectedFileContainer}>
                  <MaterialIcons name="picture-as-pdf" size={24} color="#e53935" />
                  <Text style={styles.selectedFileName} numberOfLines={1} ellipsizeMode="middle">
                    {prescriptionFile.name}
                  </Text>
                  <Text style={styles.fileSize}>
                    {(prescriptionFile.size / 1024).toFixed(1)} KB
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <AntDesign name="plus" size={18} color="#fff" />
                  <Text style={styles.submitButtonText}>Add Prescription</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderButton: {
    width: 40,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  required: {
    color: '#e53935',
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateContainer: {
    position: 'relative',
  },
  calendarIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  dateHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    marginLeft: 2,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2f8',
    borderWidth: 1,
    borderColor: '#d0d9e6',
    borderRadius: 8,
    padding: 14,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#4a6da7',
    fontWeight: '500',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  selectedFileName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    color: '#888',
    marginLeft: 5,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#4a6da7',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});