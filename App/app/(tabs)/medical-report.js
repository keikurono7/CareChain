import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Image,
  Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../../global.js';

export default function MedicalReport() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userData, setUserData] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const email = await SecureStore.getItemAsync('userEmail');
        if (email) {
          setUserEmail(email);
          fetchUserData(email);
          checkExistingReport(email);
        } else {
          Alert.alert(
            "Not Logged In",
            "Please login to access Medical Reports",
            [
              { text: "OK", onPress: () => router.push('/login') }
            ]
          );
        }
      } catch (error) {
        console.error('Failed to retrieve email:', error);
      }
    };

    fetchUserEmail();
  }, []);

  const fetchUserData = async (email) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/user/${encodeURIComponent(email)}`);
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        console.error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingReport = async (email) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/medical-report/${encodeURIComponent(email)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.report) {
          setReport(data.report);
        }
      }
    } catch (error) {
      console.error('Error checking existing report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!userEmail) {
      Alert.alert("Error", "Please login to generate a report");
      return;
    }

    try {
      setGenerating(true);
      
      // Request report generation
      const response = await fetch(`${API_BASE_URL}/api/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setReport(result.report);
          Alert.alert("Success", "Medical report generated successfully!");
        } else {
          Alert.alert("Error", result.error || "Failed to generate report");
        }
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.detail || "Failed to generate report");
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert("Error", "Network error. Please try again later.");
    } finally {
      setGenerating(false);
    }
  };

  const viewReport = () => {
    if (!report) {
      Alert.alert("No Report", "Please generate a report first");
      return;
    }

    router.push({
      pathname: '/report-view',
      params: { report: JSON.stringify(report) }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medical Report</Text>
      </View>

      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.illustrationContainer}>
          <Image
            source={{ uri: 'https://img.freepik.com/free-vector/patient-medical-record-concept-illustration_114360-7335.jpg' }}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        <View style={styles.infoCard}>
          <MaterialIcons name="description" size={24} color="#4a6da7" style={styles.cardIcon} />
          <Text style={styles.infoTitle}>AI-Powered Medical Summary</Text>
          <Text style={styles.infoText}>
            Generate a comprehensive medical report based on your health profile and prescription history.
            Our AI analyzes your medical data to provide insights and recommendations.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={generateReport}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <MaterialIcons name="auto-awesome" size={22} color="white" />
                <Text style={styles.buttonText}>Generate Report</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.viewButton, 
              !report && styles.disabledButton
            ]}
            onPress={viewReport}
            disabled={!report}
          >
            <Ionicons name="document-text-outline" size={22} color={report ? "#4a6da7" : "#a0a0a0"} />
            <Text style={[styles.viewButtonText, !report && styles.disabledText]}>View Report</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <Ionicons name="information-circle" size={18} color="#4a6da7" />
            <Text style={styles.noteTitle}>Important Note</Text>
          </View>
          <Text style={styles.noteText}>
            The AI-generated report is for informational purposes only and should not replace professional medical advice.
            Always consult with healthcare professionals for diagnosis and treatment.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  illustration: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    marginVertical: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a6da7',
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4a6da7',
    borderRadius: 8,
    paddingVertical: 14,
  },
  disabledButton: {
    borderColor: '#d0d0d0',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a6da7',
    marginLeft: 8,
  },
  disabledText: {
    color: '#a0a0a0',
  },
  noteCard: {
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    padding: 15,
    marginTop: 5,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a6da7',
    marginLeft: 5,
  },
  noteText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
});