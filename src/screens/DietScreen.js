import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  TextInput,
} from 'react-native';
import { getDietMealType, getDietOrderDetail } from '../services/api';

export default function DietScreen({ route }) {
  const { patient, orderDate } = route.params || {};

  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Patient'); // Patient | Attendant
  const [expandedKey, setExpandedKey] = useState(null);
  const [searchTextByKey, setSearchTextByKey] = useState({});
  const [remarksByKey, setRemarksByKey] = useState({});
  const [itemsByKey, setItemsByKey] = useState({});
  const [itemsLoadingByKey, setItemsLoadingByKey] = useState({});
  const [itemsErrorByKey, setItemsErrorByKey] = useState({});
  const [selectedItemIdsByKey, setSelectedItemIdsByKey] = useState({});
  const [submittingByKey, setSubmittingByKey] = useState({});
  const [submitResultByKey, setSubmitResultByKey] = useState({});

  const ipid = useMemo(() => {
    const val = patient?.ipid ?? patient?.IPID ?? patient?.patientId ?? patient?.PatientId;
    return val != null ? Number(val) : null;
  }, [patient]);

  const normalizedOrderDate = useMemo(() => {
    if (!orderDate) return null;
    if (typeof orderDate === 'string') return orderDate;
    try {
      const d = new Date(orderDate);
      if (Number.isNaN(d.getTime())) return null;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return null;
    }
  }, [orderDate]);



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

  function toScopedKey(mealId) {
    return `${activeTab}:${mealId}`;
  }

  function toggleExpanded(mealId) {
    const key = toScopedKey(mealId);
    setExpandedKey(prev => (prev === key ? null : key));

    // Load items from API on first expand (keep previous UI behavior the same).
    if (expandedKey !== key) {
      void ensureItemsLoaded(mealId);
    }
  }

  function getSearchText(mealId) {
    const key = toScopedKey(mealId);
    return searchTextByKey[key] ?? '';
  }

  function setSearchText(mealId, text) {
    const key = toScopedKey(mealId);
    setSearchTextByKey(prev => ({ ...prev, [key]: text }));
  }

  function getRemarks(mealId) {
    const key = toScopedKey(mealId);
    return remarksByKey[key] ?? '';
  }

  function setRemarks(mealId, text) {
    const key = toScopedKey(mealId);
    setRemarksByKey(prev => ({ ...prev, [key]: text }));
  }

  function getOrderFor() {
    // Based on your sample request: Patient=1
    return activeTab === 'Attendant' ? 2 : 1;
  }

  async function ensureItemsLoaded(mealId) {
    const key = toScopedKey(mealId);
    if (itemsByKey[key]) return;
    if (!ipid || !normalizedOrderDate) return;

    setItemsLoadingByKey(prev => ({ ...prev, [key]: true }));
    setItemsErrorByKey(prev => ({ ...prev, [key]: '' }));

    try {
      const data = await getDietOrderDetail({
        mealId: Number(mealId),
        ipid,
        orderdate: normalizedOrderDate,
        orderFor: getOrderFor(),
      });
      setItemsByKey(prev => ({ ...prev, [key]: data }));
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to load item list.';
      setItemsErrorByKey(prev => ({ ...prev, [key]: String(msg) }));
      setItemsByKey(prev => ({ ...prev, [key]: [] }));
    } finally {
      setItemsLoadingByKey(prev => ({ ...prev, [key]: false }));
    }
  }

  function toggleSelectedItem(mealId, itemId) {
    const key = toScopedKey(mealId);
    setSelectedItemIdsByKey(prev => {
      const current = prev[key] || {};
      const next = { ...current, [itemId]: !current[itemId] };
      return { ...prev, [key]: next };
    });
  }

  function isSelected(mealId, itemId) {
    const key = toScopedKey(mealId);
    return !!selectedItemIdsByKey?.[key]?.[itemId];
  }

  async function submitMeal(mealId) {
    const key = toScopedKey(mealId);
    setSubmittingByKey(prev => ({ ...prev, [key]: true }));
    setSubmitResultByKey(prev => ({ ...prev, [key]: '' }));

    try {
      const selectedMap = selectedItemIdsByKey?.[key] || {};
      const selectedIds = Object.keys(selectedMap).filter(id => selectedMap[id]);
      const remark = getRemarks(mealId);

      const payload = {
        mealId: Number(mealId),
        ipid,
        orderdate: normalizedOrderDate,
        orderFor: getOrderFor(),
        remarks: remark,
        selectedItemIds: selectedIds.map(id => Number(id)),
      };

      console.log('SUBMIT MEAL PAYLOAD:', payload);
      setSubmitResultByKey(prev => ({ ...prev, [key]: 'Saved (local)' }));
    } catch (e) {
      const msg = e?.message || 'Submit failed.';
      setSubmitResultByKey(prev => ({ ...prev, [key]: String(msg) }));
    } finally {
      setSubmittingByKey(prev => ({ ...prev, [key]: false }));
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

      {/* 🔥 Patient / Attendant toggle */}
      <View style={styles.tabWrap}>
        <Pressable
          onPress={() => {
            setActiveTab('Patient');
            setExpandedKey(null);
          }}
          style={[
            styles.tabBtn,
            activeTab === 'Patient' ? styles.tabBtnActive : null,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Patient' ? styles.tabTextActive : null,
            ]}
          >
            Patient
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setActiveTab('Attendant');
            setExpandedKey(null);
          }}
          style={[
            styles.tabBtn,
            activeTab === 'Attendant' ? styles.tabBtnActive : null,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Attendant' ? styles.tabTextActive : null,
            ]}
          >
            Attendant
          </Text>
        </Pressable>
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
            const expanded = expandedKey === toScopedKey(mealId);
            const mealName = getMealName(item, index);
            const searchText = getSearchText(mealId).trim().toLowerCase();
            const key = toScopedKey(mealId);
            const apiItems = itemsByKey[key];
            const baseItems = Array.isArray(apiItems) ? apiItems : getMealItems(item);
            const filteredItems = baseItems.filter((it, idx) =>
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

                    {itemsLoadingByKey[key] ? (
                      <ActivityIndicator />
                    ) : itemsErrorByKey[key] ? (
                      <Text style={styles.emptyText}>{itemsErrorByKey[key]}</Text>
                    ) : filteredItems.length > 0 ? (
                      <FlatList
                        data={filteredItems}
                        keyExtractor={(it, idx) =>
                          String(it?.id ?? it?.itemId ?? it?.ID ?? idx)
                        }
                        renderItem={({ item: it, index: idx }) => {
                          const itemId = String(it?.id ?? it?.itemId ?? it?.ID ?? idx);
                          const checked = isSelected(mealId, itemId);
                          return (
                            <Pressable
                              onPress={() => toggleSelectedItem(mealId, itemId)}
                              style={styles.itemRow}
                            >
                              <View
                                style={[
                                  styles.checkbox,
                                  checked ? styles.checkboxChecked : null,
                                ]}
                              />
                              <Text style={styles.itemName}>{getItemName(it, idx)}</Text>
                            </Pressable>
                          );
                        }}
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

                    <Pressable
                      onPress={() => submitMeal(mealId)}
                      disabled={submittingByKey[key] || !ipid || !normalizedOrderDate}
                      style={({ pressed }) => [
                        styles.mealSubmitBtn,
                        (submittingByKey[key] || !ipid || !normalizedOrderDate) &&
                          styles.mealSubmitBtnDisabled,
                        pressed && !submittingByKey[key] ? styles.mealSubmitBtnPressed : null,
                      ]}
                    >
                      {submittingByKey[key] ? (
                        <ActivityIndicator color="#111827" />
                      ) : (
                        <Text style={styles.mealSubmitText}>Submit</Text>
                      )}
                    </Pressable>
                    {!!submitResultByKey[key] && (
                      <Text style={styles.submitHint}>{submitResultByKey[key]}</Text>
                    )}
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

  tabWrap: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 26,
    backgroundColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: '#F97316',
  },
  tabText: {
    fontWeight: '800',
    color: '#111827',
  },
  tabTextActive: {
    color: '#fff',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },

  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#111827',
    borderColor: '#111827',
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

  mealSubmitBtn: {
    marginTop: 10,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealSubmitBtnPressed: {
    opacity: 0.9,
  },
  mealSubmitBtnDisabled: {
    opacity: 0.6,
  },
  mealSubmitText: {
    fontWeight: '900',
    color: '#111827',
  },
  submitHint: {
    marginTop: 6,
    color: '#6B7280',
    fontWeight: '600',
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