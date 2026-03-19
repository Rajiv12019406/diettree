import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  TextInput,
} from 'react-native';
import { getDietMealType } from '../services/api';

export default function DietScreen({ route }) {
  const { patient } = route.params || {};

  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMealId, setExpandedMealId] = useState(null);
  const [searchTextByMealId, setSearchTextByMealId] = useState({});
  const [remarksByMealId, setRemarksByMealId] = useState({});



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

  function getMealId(meal, idx) {
    return String(meal?.id ?? meal?.ID ?? meal?.mealTypeId ?? meal?.mealTypeID ?? idx);
  }

  function getMealName(meal, idx) {
    return String(meal?.name ?? meal?.mealName ?? meal?.MealName ?? `Meal ${idx + 1}`);
  }

  function getMealItems(meal) {
    const items =
      meal?.items ||
      meal?.itemList ||
      meal?.ItemList ||
      meal?.dietItems ||
      meal?.DietItems ||
      [];
    return Array.isArray(items) ? items : [];
  }

  function getItemName(item, idx) {
    return String(item?.name ?? item?.itemName ?? item?.ItemName ?? `Item ${idx + 1}`);
  }

  function toggleExpanded(mealId) {
    setExpandedMealId(prev => (prev === mealId ? null : mealId));
  }

  function getSearchText(mealId) {
    return searchTextByMealId[mealId] ?? '';
  }

  function setSearchText(mealId, text) {
    setSearchTextByMealId(prev => ({ ...prev, [mealId]: text }));
  }

  function getRemarks(mealId) {
    return remarksByMealId[mealId] ?? '';
  }

  function setRemarks(mealId, text) {
    setRemarksByMealId(prev => ({ ...prev, [mealId]: text }));
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
          keyExtractor={(item, index) => getMealId(item, index)}
          renderItem={({ item, index }) => {
            const mealId = getMealId(item, index);
            const expanded = expandedMealId === mealId;
            const mealName = getMealName(item, index);
            const searchText = getSearchText(mealId).trim().toLowerCase();
            const filteredItems = getMealItems(item).filter((it, idx) =>
              getItemName(it, idx).toLowerCase().includes(searchText),
            );

            return (
              <View style={styles.section}>
                <Pressable onPress={() => toggleExpanded(mealId)} style={styles.row}>
                  <Text style={styles.plus}>{expanded ? '−' : '＋'}</Text>
                  <Text style={styles.text}>{mealName}</Text>
                </Pressable>

                {expanded && (
                  <View style={styles.expandBody}>
                    <Text style={styles.subTitle}>Item List</Text>
                    <View style={styles.searchBox}>
                      <Text style={styles.searchIcon}>🔍</Text>
                      <TextInput
                        value={getSearchText(mealId)}
                        onChangeText={text => setSearchText(mealId, text)}
                        placeholder="Search"
                        placeholderTextColor="#6B7280"
                        style={styles.searchInput}
                      />
                    </View>

                    {filteredItems.length > 0 ? (
                      <FlatList
                        data={filteredItems}
                        keyExtractor={(it, idx) =>
                          String(it?.id ?? it?.itemId ?? it?.ID ?? idx)
                        }
                        renderItem={({ item: it, index: idx }) => (
                          <View style={styles.itemRow}>
                            <Text style={styles.itemName}>{getItemName(it, idx)}</Text>
                          </View>
                        )}
                      />
                    ) : (
                      <Text style={styles.emptyText}>No items available.</Text>
                    )}

                    <Text style={styles.subTitle}>Remarks</Text>
                    <TextInput
                      value={getRemarks(mealId)}
                      onChangeText={text => setRemarks(mealId, text)}
                      placeholder="Enter remarks"
                      placeholderTextColor="#6B7280"
                      multiline
                      textAlignVertical="top"
                      style={styles.remarksInput}
                    />
                  </View>
                )}
              </View>
            );
          }}
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

  section: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    backgroundColor: '#fff',
  },

  expandBody: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 10,
    backgroundColor: '#F9FAFB',
  },

  subTitle: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },

  searchBox: {
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    color: '#111827',
    paddingVertical: 0,
  },

  itemRow: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },

  itemName: {
    color: '#111827',
    fontWeight: '600',
  },

  emptyText: {
    color: '#6B7280',
    marginBottom: 10,
  },

  remarksInput: {
    minHeight: 84,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: '#111827',
    marginBottom: 4,
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