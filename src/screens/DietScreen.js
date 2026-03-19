import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable
} from 'react-native';
import { getDietMealType } from '../services/api';

export default function DietScreen({ route }) {
  const { patient } = route.params || {};

  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    loadMeals();
  }, []);

  async function loadMeals() {
    try {
      console.log("Patient:", patient); // DEBUG
  
      
      global.locationID =
        patient?.locationId ||
        patient?.locationId
         
  
      const data = await getDietMealType();
  
      console.log("Meals:", data);
  
      setMeals(data);
  
    } catch (e) {
      console.log("Meal Error:", e);
      setMeals([]);
    } finally {
      setLoading(false);
    }
  }

  

  return (
    <View style={styles.container}>

      {/* 🔥 Header */}
      <View style={styles.header}>
        
        <Text style={styles.name}>Name : {patient?.patientName}</Text>
        <Text>IPID : {patient?.ipid}</Text>
        <Text>Bed No : {patient?.bedno}</Text>
        
      </View>

      {/* 🔥 Meal List */}
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={meals}
          keyExtractor={(item) => String(item.id)} // ✅ FIXED
          renderItem={({ item }) => (
            <Pressable style={styles.row}>
              <Text style={styles.plus}>＋</Text>
              <Text style={styles.text}>{item.name}</Text> {/* ✅ FIXED */}
            </Pressable>
          )}
        />
      )}

      {/* 🔥 Footer Button */}
      <Pressable style={styles.submitBtn}>
        <Text style={styles.submitText}>Submit All</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12
  },

  header: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10
  },

  name: {
    fontWeight: 'bold'
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee'
  },

  plus: {
    fontSize: 18,
    marginRight: 10
  },

  text: {
    fontSize: 16,
    fontWeight: '600'
  },

  submitBtn: {
    marginTop: 10,
    backgroundColor: '#ddd',
    padding: 14,
    alignItems: 'center',
    borderRadius: 10
  },

  submitText: {
    fontWeight: 'bold'
  }
});