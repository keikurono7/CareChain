import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Share,
  Linking
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../../global.js';

export default function PrescriptionDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const storedEmail = await SecureStore.getItemAsync('userEmail');
        if (storedEmail) {
          setUserEmail(storedEmail);
          fetchPrescriptionDetails(storedEmail);
        } else {
          setLoading(false);
          Alert.alert("Error", "User not authenticated", [
            { text: "OK", onPress: () => router.push('/login') }
          ]);
        }
      } catch (error) {
        console.error('Failed to get user email:', error);
        setLoading(false);
      }
    };

    fetchUserEmail();
  }, [id]);

  const fetchPrescriptionDetails = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (response.ok && data && data.prescriptions) {
        const found = data.prescriptions.find(p => p.id === id);
        
        if (found) {
          console.log('Found prescription:', found);
          setPrescription(found);
        } else {
          Alert.alert("Not Found", "Prescription details could not be found");
          router.back();
        }
      } else {
        Alert.alert("Error", "Failed to load prescription details");
        router.back();
      }
    } catch (error) {
      console.error('Error fetching prescription details:', error);
      Alert.alert("Error", "Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!prescription) return;
    
    try {
      const shareText = `
Medical Prescription Details
---------------------------
ID: ${prescription.id}
Date: ${prescription.date}
Doctor: ${prescription.doctor}
Hospital/Clinic: ${prescription.hospital}
Medical Condition: ${prescription.condition}
PDF: ${prescription.ipfsUrl || 'Not available'}
`;

      await Share.share({
        message: shareText,
        title: `Prescription ${prescription.id}`
      });
    } catch (error) {
      console.error('Error sharing prescription:', error);
    }
  };

  const openPrescriptionPDF = () => {
    if (!prescription || !prescription.ipfsUrl) {
      Alert.alert("Error", "Prescription PDF link not available");
      return;
    }

    Linking.openURL(prescription.ipfsUrl)
      .catch(err => {
        console.error('Error opening PDF link:', err);
        Alert.alert("Error", "Could not open the PDF. Please try again later.");
      });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6da7" />
        <Text style={styles.loadingText}>Loading prescription details...</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Prescription Details</Text>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color="#4a6da7" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.prescriptionIdContainer}>
          <View style={styles.idBadge}>
            <Text style={styles.prescriptionId}>{prescription?.id || 'Unknown'}</Text>
          </View>
          <Text style={styles.prescriptionDate}>{prescription?.date || 'Unknown date'}</Text>
        </View>
        
        {/* PDF Viewer Button */}
        {prescription?.ipfsUrl && (
          <TouchableOpacity 
            style={styles.pdfButton}
            onPress={openPrescriptionPDF}
          >
            <AntDesign name="pdffile1" size={24} color="white" />
            <Text style={styles.pdfButtonText}>View Prescription PDF</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="hospital-user" size={18} color="#4a6da7" />
            <Text style={styles.sectionTitle}>Provider Information</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Doctor</Text>
            <Text style={styles.infoValue}>{prescription?.doctor || 'Not specified'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Hospital/Clinic</Text>
            <Text style={styles.infoValue}>{prescription?.hospital || 'Not specified'}</Text>
          </View>
        </View>
        
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="medical-services" size={18} color="#4a6da7" />
            <Text style={styles.sectionTitle}>Medical Details</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Condition</Text>
            <Text style={styles.infoValue}>{prescription?.condition || 'Not specified'}</Text>
          </View>
        </View>
        
        {prescription?.ipfsHash && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="link" size={18} color="#4a6da7" />
              <Text style={styles.sectionTitle}>IPFS Information</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>IPFS Hash</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
                {prescription.ipfsHash}
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.blockchainInfo}>
          <Ionicons name="shield-checkmark" size={16} color="#4a6da7" />
          <Text style={styles.blockchainText}>
            PDF secured on IPFS and linked via blockchain
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Previous styles...
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  prescriptionIdContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  idBadge: {
    backgroundColor: '#4a6da7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  prescriptionId: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  prescriptionDate: {
    fontSize: 16,
    color: '#666',
  },
  pdfButton: {
    flexDirection: 'row',
    backgroundColor: '#e53935',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  pdfButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a6da7',
    marginLeft: 8,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  notesText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  blockchainInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginBottom: 20,
  },
  blockchainText: {
    fontSize: 13,
    color: '#4a6da7',
    marginLeft: 6,
  },
});