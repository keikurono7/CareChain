import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Image,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../../global.js';

export default function Dashboard() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isStreamEmpty, setIsStreamEmpty] = useState(false);

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const storedEmail = await SecureStore.getItemAsync('userEmail');
        if (storedEmail) setUserEmail(storedEmail);
      } catch (error) {
        console.error('Failed to retrieve email:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserEmail();
  }, []);

  // Replace your existing fetchPrescriptions function with this:
  const fetchPrescriptions = async () => {
    if (!userEmail) return;
    
    setLoading(true);
    try {
      // Log the API call to debug
      console.log(`Fetching prescriptions for: ${userEmail}`);
      
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      
      // Log the received data
      console.log('API response data:', JSON.stringify(data));
      
      if (response.ok) {
        // Check for prescriptions array in the response 
        if (data && data.prescriptions && Array.isArray(data.prescriptions)) {
          console.log(`Found ${data.prescriptions.length} prescriptions`);
          setPrescriptions(data.prescriptions);
          setIsStreamEmpty(data.prescriptions.length === 0);
        } else {
          console.log('No prescriptions array in response');
          setPrescriptions([]);
          setIsStreamEmpty(true);
        }
      } else {
        console.error('Error fetching prescriptions:', data.detail || 'Unknown error');
        setPrescriptions([]);
        setIsStreamEmpty(true);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setPrescriptions([]);
      setIsStreamEmpty(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchPrescriptions();
    }
  }, [userEmail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrescriptions();
  };

  // Update the handlePrescriptionPress function to navigate to the detailed view
  const handlePrescriptionPress = (id) => {
    console.log(`Navigating to prescription detail: ${id}`);
    router.push(`/prescription/${id}`);
  };

  const handleAddPrescription = () => {
    router.push('/add-prescription');
  };

  // Update the renderPrescriptionItem function to use the handler when clicking anywhere on the item 
  // or specifically on the View Details section
  const renderPrescriptionItem = ({ item }) => (
    <View style={styles.prescriptionItem}>
      <TouchableOpacity 
        style={styles.prescriptionContent}
        onPress={() => handlePrescriptionPress(item.id)}
      >
        <View style={styles.prescriptionHeader}>
          <Text style={styles.prescriptionId}>{item.id}</Text>
          <Text style={styles.prescriptionDate}>{item.date}</Text>
        </View>
        <View style={styles.prescriptionDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="medkit" size={16} color="#4a6da7" />
            <Text style={styles.detailText}>Condition: {item.condition}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person" size={16} color="#4a6da7" />
            <Text style={styles.detailText}>Doctor: {item.doctor}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="business" size={16} color="#4a6da7" />
            <Text style={styles.detailText}>Hospital: {item.hospital}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.viewMoreContainer}
        onPress={() => handlePrescriptionPress(item.id)}
      >
        <Text style={styles.viewMore}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color="#4a6da7" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Dashboard</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddPrescription}
        >
          <AntDesign name="plus" size={22} color="#4a6da7" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/profile')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#e6f7ff' }]}>
            <Ionicons name="person" size={24} color="#4a6da7" />
          </View>
          <Text style={styles.actionText}>Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/medical-report')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#e6fff7' }]}>
            <MaterialIcons name="medical-services" size={24} color="#4a6da7" />
          </View>
          <Text style={styles.actionText}>Medical Report</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/diet-plan')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#f7f7e6' }]}>
            <FontAwesome5 name="apple-alt" size={22} color="#4a6da7" />
          </View>
          <Text style={styles.actionText}>Diet Plan</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.sectionHeaderContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Prescription Insights</Text>
          {userEmail && (
            <Text style={styles.userEmail} numberOfLines={1}>
              {userEmail}
            </Text>
          )}
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
          <Text style={styles.loaderText}>Loading prescriptions...</Text>
        </View>
      ) : isStreamEmpty ? (
        <View style={styles.emptyContainer}>
          <Image
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <Text style={styles.emptyText}>Your prescription stream is empty</Text>
          <Text style={styles.emptySubtext}>
            Add your first prescription to begin tracking your medical history.
          </Text>
          <TouchableOpacity 
            style={styles.addPrescriptionButton}
            onPress={handleAddPrescription}
          >
            <AntDesign name="plus" size={20} color="#fff" />
            <Text style={styles.addPrescriptionText}>Add New Prescription</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          renderItem={renderPrescriptionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4a6da7"]} />
          }
          ListFooterComponent={
            <TouchableOpacity 
              style={styles.addPrescriptionButtonInList}
              onPress={handleAddPrescription}
            >
              <AntDesign name="plus" size={20} color="#fff" />
              <Text style={styles.addPrescriptionText}>Add New Prescription</Text>
            </TouchableOpacity>
          }
        />
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: 'white',
    marginVertical: 10,
    marginHorizontal: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },
  sectionHeaderContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 5,
  },
  sectionHeader: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 80, // Extra padding at bottom for the add button
  },
  prescriptionItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  prescriptionId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  prescriptionDate: {
    fontSize: 14,
    color: '#666',
  },
  prescriptionDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#444',
    marginLeft: 8,
  },
  viewMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  viewMore: {
    fontSize: 14,
    color: '#4a6da7',
    fontWeight: '600',
    marginRight: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 30,
    marginBottom: 25,
  },
  addPrescriptionButton: {
    flexDirection: 'row',
    backgroundColor: '#4a6da7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  addPrescriptionButtonInList: {
    flexDirection: 'row',
    backgroundColor: '#4a6da7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  addPrescriptionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  }
});