import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { getDietMealType, getDietOrderDetail, addDietOrder } from '../services/api';

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
  const [quantityByKey, setQuantityByKey] = useState({}); // { "mealKey": { "itemId": number } }
  const [submittingByKey, setSubmittingByKey] = useState({});
  const [submitResultByKey, setSubmitResultByKey] = useState({});
  const [cart, setCart] = useState([]); // [{ mealId, mealName, orderFor, items: [{ itemId, itemName, quantity }], remarks }]
  const [cartVisible, setCartVisible] = useState(false);
  const [addDietLoading, setAddDietLoading] = useState(false);
  const [addDietError, setAddDietError] = useState('');

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
    const isCurrentlySelected = !!selectedItemIdsByKey?.[key]?.[itemId];
    setSelectedItemIdsByKey(prev => {
      const current = prev[key] || {};
      const next = { ...current, [itemId]: !isCurrentlySelected };
      return { ...prev, [key]: next };
    });
    setQuantityByKey(prev => {
      const current = prev[key] || {};
      const next = { ...current, [itemId]: isCurrentlySelected ? 0 : 1 };
      if (next[itemId] === 0) delete next[itemId];
      return { ...prev, [key]: next };
    });
  }

  function isSelected(mealId, itemId) {
    const key = toScopedKey(mealId);
    return !!selectedItemIdsByKey?.[key]?.[itemId];
  }

  function getQuantity(mealId, itemId) {
    const key = toScopedKey(mealId);
    const q = quantityByKey?.[key]?.[itemId];
    return typeof q === 'number' ? q : 0;
  }

  function incrementQuantity(mealId, itemId) {
    const key = toScopedKey(mealId);
    setQuantityByKey(prev => {
      const current = prev[key] || {};
      const q = (current[itemId] ?? 0) + 1;
      return { ...prev, [key]: { ...current, [itemId]: q } };
    });
  }

  function decrementQuantity(mealId, itemId) {
    const key = toScopedKey(mealId);
    const currentQty = quantityByKey?.[key]?.[itemId] ?? 0;
    const newQty = Math.max(0, currentQty - 1);

    setQuantityByKey(prev => {
      const current = prev[key] || {};
      const next = { ...current, [itemId]: newQty };
      if (newQty === 0) delete next[itemId];
      return { ...prev, [key]: next };
    });

    if (newQty === 0) {
      setSelectedItemIdsByKey(prev => {
        const current = prev[key] || {};
        const next = { ...current };
        delete next[itemId];
        return { ...prev, [key]: next };
      });
    }
  }

  function addToCart(mealId, mealName, itemsWithQty, remark) {
    const orderFor = getOrderFor();
    const cartKey = `${orderFor}:${mealId}`;
    const baseItems = itemsByKey[toScopedKey(mealId)] || [];
    const items = itemsWithQty.map(({ itemId, quantity }) => {
      const apiItem = baseItems.find(
        it => String(it?.id ?? it?.itemId ?? it?.ID) === String(itemId),
      );
      const itemName = apiItem
        ? getItemName(apiItem, baseItems.indexOf(apiItem))
        : `Item ${itemId}`;
      return { itemId: Number(itemId), itemName, quantity };
    });

    setCart(prev => {
      const rest = prev.filter(
        c => !(String(c.mealId) === String(mealId) && c.orderFor === orderFor),
      );
      return [...rest, { mealId, mealName, orderFor, items, remarks: remark }];
    });
  }

  function removeFromCart(mealId, orderFor) {
    setCart(prev =>
      prev.filter(c => !(String(c.mealId) === String(mealId) && c.orderFor === orderFor)),
    );
  }

  async function submitDietOrder() {
    if (cart.length === 0) return;
    if (!ipid || !normalizedOrderDate) {
      setAddDietError('Missing patient or order date.');
      return;
    }

    setAddDietLoading(true);
    setAddDietError('');

    try {
      const bedId = patient?.bedId ?? patient?.bedno ?? patient?.bedNo ?? '';
      const locationid = patient?.locationId ?? patient?.locationID ?? global.locationID ?? 0;

      const byOrderFor = {};
      cart.forEach(entry => {
        const of = entry.orderFor;
        if (!byOrderFor[of]) byOrderFor[of] = [];
        byOrderFor[of].push(entry);
      });

      for (const orderfor of Object.keys(byOrderFor)) {
        const entries = byOrderFor[orderfor];
        const dietorderdetail = [];
        const mealtype = [];

        entries.forEach(entry => {
          mealtype.push({
            mealtypeid: Number(entry.mealId),
            remark: entry.remarks || '',
          });
          entry.items.forEach(it => {
            dietorderdetail.push({
              mealId: Number(entry.mealId),
              itemid: Number(it.itemId),
              quantity: it.quantity,
              itemRemark: entry.remarks || '',
            });
          });
        });

        const payload = {
          ipid,
          bedId: Number(bedId) || bedId,
          locationid: Number(locationid) || locationid,
          orderfor: Number(orderfor),
          operatorid: 1,
          orderdate: normalizedOrderDate,
          dietorderdetail,
          mealtype,
          removeCheck: true,
          isChargeable: 0,
          chkmeal: '',
        };

        await addDietOrder(payload);
      }

      setCart([]);
      setCartVisible(false);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to submit diet order.';
      setAddDietError(String(msg));
    } finally {
      setAddDietLoading(false);
    }
  }

  async function submitMeal(mealId, mealName) {
    const key = toScopedKey(mealId);
    setSubmittingByKey(prev => ({ ...prev, [key]: true }));
    setSubmitResultByKey(prev => ({ ...prev, [key]: '' }));

    try {
      const qtyMap = quantityByKey?.[key] || {};
      const itemsWithQty = Object.entries(qtyMap)
        .filter(([, q]) => q > 0)
        .map(([id, qty]) => ({ itemId: id, quantity: qty }));
      const remark = getRemarks(mealId);

      if (itemsWithQty.length === 0) {
        setSubmitResultByKey(prev => ({ ...prev, [key]: 'Select items first' }));
        return;
      }

      addToCart(mealId, mealName, itemsWithQty, remark);
      setSubmitResultByKey(prev => ({ ...prev, [key]: 'Added to cart' }));
    } catch (e) {
      const msg = e?.message || 'Submit failed.';
      setSubmitResultByKey(prev => ({ ...prev, [key]: String(msg) }));
    } finally {
      setSubmittingByKey(prev => ({ ...prev, [key]: false }));
    }
  }

  function submitAllToCart() {
    // Adds/updates all meals (current tab) that have qty > 0
    meals.forEach((meal, idx) => {
      const mealId = getMealId(meal, idx);
      const mealName = getMealName(meal, idx);
      const key = toScopedKey(mealId);

      const qtyMap = quantityByKey?.[key] || {};
      const itemsWithQty = Object.entries(qtyMap)
        .filter(([, q]) => q > 0)
        .map(([id, qty]) => ({ itemId: id, quantity: qty }));

      if (itemsWithQty.length === 0) return;

      const remark = getRemarks(mealId);
      addToCart(mealId, mealName, itemsWithQty, remark);
    });

    setCartVisible(true);
  }
  

  return (
    <View style={styles.container}>

    
      <View style={styles.header}>
        
        <Text style={styles.name}>Name : {patient?.patientName}</Text>
        <Text>IPID : {patient?.ipid}</Text>
        <Text>Bed No : {patient?.bedno}</Text>
        
      </View>

    
      <View style={styles.topRow}>
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

        <Pressable
          onPress={() => setCartVisible(true)}
          hitSlop={10}
          style={({ pressed }) => [styles.cartIconBtn, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.cartIcon}>🛒</Text>
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <Modal
        visible={cartVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCartVisible(false)}
      >
        <Pressable style={styles.cartBackdrop} onPress={() => setCartVisible(false)}>
          <Pressable style={styles.cartModal} onPress={() => {}}>
            <View style={styles.cartModalHeader}>
              <Text style={styles.cartTitle}>Cart</Text>
              <Pressable
                onPress={() => setCartVisible(false)}
                hitSlop={10}
                style={({ pressed }) => [styles.cartCloseBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.cartCloseText}>Close</Text>
              </Pressable>
            </View>

            {cart.length === 0 ? (
              <Text style={styles.emptyText}>Cart is empty.</Text>
            ) : (
              <>
                <ScrollView style={{ maxHeight: 420 }}>
                  {cart.map((entry, idx) => (
                    <View
                      key={`${entry.mealId}-${entry.orderFor}-${idx}`}
                      style={styles.cartCard}
                    >
                      <View style={styles.cartCardHeader}>
                        <Text style={styles.cartMealName}>{entry.mealName}</Text>
                        <Pressable
                          onPress={() => removeFromCart(entry.mealId, entry.orderFor)}
                          hitSlop={8}
                          style={({ pressed }) => [
                            styles.cartRemoveBtn,
                            pressed && { opacity: 0.7 },
                          ]}
                        >
                          <Text style={styles.cartRemoveText}>Remove</Text>
                        </Pressable>
                      </View>
                      {entry.items.map(it => (
                        <Text key={it.itemId} style={styles.cartItemRow}>
                          • {it.itemName} × {it.quantity}
                        </Text>
                      ))}
                      {!!entry.remarks && (
                        <Text style={styles.cartRemarks}>Remarks: {entry.remarks}</Text>
                      )}
                    </View>
                  ))}
                </ScrollView>
                {!!addDietError && (
                  <Text style={styles.cartError}>{addDietError}</Text>
                )}
                <Pressable
                  onPress={submitDietOrder}
                  disabled={addDietLoading}
                  style={({ pressed }) => [
                    styles.addDietBtn,
                    addDietLoading && styles.addDietBtnDisabled,
                    pressed && !addDietLoading && { opacity: 0.9 },
                  ]}
                >
                  {addDietLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.addDietBtnText}>Add Diet</Text>
                  )}
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      
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
                          const qty = getQuantity(mealId, itemId);
                          return (
                            <View style={styles.itemRow}>
                              <Pressable
                                onPress={() => toggleSelectedItem(mealId, itemId)}
                                style={styles.itemLeft}
                              >
                                <View
                                  style={[
                                    styles.checkbox,
                                    checked ? styles.checkboxChecked : null,
                                  ]}
                                />
                                <Text style={styles.itemName}>{getItemName(it, idx)}</Text>
                              </Pressable>
                              {checked && (
                                <View style={styles.qtyWrap}>
                                  <Pressable
                                    onPress={() => decrementQuantity(mealId, itemId)}
                                    style={({ pressed }) => [
                                      styles.qtyBtn,
                                      qty === 0 && styles.qtyBtnDisabled,
                                      pressed && qty > 0 && styles.qtyBtnPressed,
                                    ]}
                                    disabled={qty === 0}
                                  >
                                    <Text style={[styles.qtyBtnText, qty === 0 && styles.qtyBtnTextDisabled]}>−</Text>
                                  </Pressable>
                                  <Text style={styles.qtyText}>{qty}</Text>
                                  <Pressable
                                    onPress={() => incrementQuantity(mealId, itemId)}
                                    style={({ pressed }) => [
                                      styles.qtyBtn,
                                      pressed && styles.qtyBtnPressed,
                                    ]}
                                  >
                                    <Text style={styles.qtyBtnText}>＋</Text>
                                  </Pressable>
                                </View>
                              )}
                            </View>
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
                      onPress={() => submitMeal(mealId, mealName)}
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
          ListFooterComponent={
            <Pressable onPress={submitAllToCart} style={styles.submitBtn}>
              <Text style={styles.submitText}>Submit All</Text>
            </Pressable>
          }
        />
      )}

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

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  tabWrap: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
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

  cartIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    fontSize: 20,
  },
  cartBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  cartBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 16,
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  cartModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  cartModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cartCloseBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cartCloseText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
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
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },

  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    flex: 1,
    color: '#111827',
    fontWeight: '600',
  },

  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnPressed: {
    opacity: 0.8,
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  qtyBtnTextDisabled: {
    color: '#9CA3AF',
  },
  qtyText: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
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
  },

  cartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  cartCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 10,
  },
  cartCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cartMealName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  cartRemoveBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cartRemoveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
  },
  cartItemRow: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  cartRemarks: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  cartError: {
    marginTop: 10,
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '600',
  },
  addDietBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDietBtnDisabled: {
    opacity: 0.7,
  },
  addDietBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});