import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getBedList, getWardList } from '../services/api';
import { clearToken, getToken } from '../utils/authStorage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';



export default function HomeScreen({ navigation }) {

  //const [dateText, setDateText] = useState(() => formatDDMMYYYY(new Date()));
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wardPickerOpen, setWardPickerOpen] = useState(false);
  const [bedLoading, setBedLoading] = useState(false);
  const [bedError, setBedError] = useState('');
  const [beds, setBeds] = useState([]);
  const [date, setDate] = useState(new Date());
  const [dateText, setDateText] = useState(formatDDMMYYYY(new Date()));

  // 🔥 CHANGE: control picker visibility
  const [showPicker, setShowPicker] = useState(false);


  function formatDDMMYYYY(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = String(date.getFullYear());
    return `${dd}-${mm}-${yyyy}`;

  }

  function getWardName(w, idx) {
    if (!w) return `Ward ${idx + 1}`;
    if (typeof w === 'string') return w;
    // Your API returns: { id, name, shortName, stationTypeID }
    return (
      w.name ||
      w.shortName ||
      w.wardName ||
      w.WardName ||
      w.label ||
      w.value ||
      `Ward ${idx + 1}`
    );
  }

  function getWardId(w, idx) {
    if (!w) return String(idx);
    if (typeof w === 'string') return w;
    return String(w.id || w.ID || w.wardId || w.WardId || w.value || idx);

  }

  function normalizeBeds(result) {
    if (!result) return [];
    const arr = Array.isArray(result)
      ? result
      : result?.data || result?.beds || result?.bedList || result?.result || [];
    if (!Array.isArray(arr)) return [];

    return arr.map((r, idx) => {
      const name = r?.name || r?.patientName || r?.PatientName || r?.patName || '';
      const ipid = r?.ipid || r?.IPID || r?.patientId || r?.PatientId || '';
      const bedNo = r?.bedNo || r?.BedNo || r?.bed || r?.Bed || '';
      return {
        key: String(r?.id || r?.ID || `${idx}-${bedNo}-${ipid}`),
        name: String(name),
        ipid: String(ipid),
        bedNo: String(bedNo),
      };
    });
  }
  useEffect(() => {
    let isMounted = true;

    async function loadWards() {
      try {
        setLoading(true);
        setError('');

        const data = await getWardList(); // 👈 returns array

        if (!isMounted) return;

        setWards(data); // ✅ directly set array
      } catch (e) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load ward list.');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    }

    loadWards();

    return () => {
      isMounted = false;
    };
  }, []);

  const onChangeDate = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setDateText(formatDDMMYYYY(selectedDate));
    }
  };

  async function onLogout() {
    await clearToken();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }

  const wardLabel = useMemo(() => {
    if (!selectedWard) return '';
    return getWardName(selectedWard, 0);
  }, [selectedWard]);

  const onPressBedList = async () => {

    if (!selectedWard) {
      setBedError('Please select a ward.');
      return;
    }

    setBedError('');
    setBedLoading(true);

    try {

      const wardId = getWardId(selectedWard, 0);
      console.log(wardId)
      console.log(dateText)



      const bedsData = await getBedList({
        wardId,
        date

      });


      console.log(typeof bedsData);
      setBeds(bedsData);

    } catch (e) {
      setBeds([]);
      setBedError(e?.message || 'Failed to load bed list.');
    } finally {
      setBedLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.brandTitle}>Testing Hospital</Text>
            <Text style={styles.brandSubtitle}>IT Admin</Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={onLogout}
        style={({ pressed }) => [styles.logoutBar, pressed && styles.pressed]}
      >
        <Text style={styles.logoutBarText}>Logout</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.panel}>
          <View style={styles.form}>
            <Text style={styles.label}>Date :</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={dateText}
                editable={false} // 
                style={styles.input}
              />

              {/* 🔥 CHANGE: open date picker */}
              <Pressable
                style={styles.calendarStub}
                onPress={() => setShowPicker(true)}
              >
                <Text style={styles.calendarStubText}>📅</Text>
              </Pressable>
            </View>

            {/* 🔥 CHANGE: date picker UI */}
            {showPicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onChangeDate}
              />
            )}

            <Text style={[styles.label, { marginTop: 14 }]}>Ward :</Text>
            <Pressable
              onPress={() => setWardPickerOpen(true)}
              disabled={loading}
              style={({ pressed }) => [
                styles.select,
                pressed && !loading ? styles.pressed : null,
              ]}
            >
              <Text style={styles.selectText}>
                {wardLabel || (loading ? 'Loading...' : 'Select')}
              </Text>
              <Text style={styles.chev}>▾</Text>
            </Pressable>

            <Pressable
              onPress={onPressBedList}
              disabled={!selectedWard || bedLoading}
              style={({ pressed }) => [
                styles.bedListBtn,
                (!selectedWard || bedLoading) && styles.bedListBtnDisabled,
                pressed && selectedWard && !bedLoading ? styles.pressed : null,
              ]}
            >
              {bedLoading ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.bedListText}>Bed List</Text>
              )}
            </Pressable>

            {!!error && <Text style={styles.error}>{error}</Text>}
            {!!bedError && <Text style={styles.error}>{bedError}</Text>}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Bed List</Text>
          {loading ? (
            <View style={styles.body}>
              <ActivityIndicator />
            </View>
          ) : (
            <FlatList
              data={beds}
              keyExtractor={item => item.key}
              contentContainerStyle={beds.length === 0 ? styles.body : undefined}
              ListEmptyComponent={() => (
                <Text style={styles.muted}>
                  {selectedWard
                    ? 'Tap "Bed List" to load patients.'
                    : 'Select a ward to continue.'}
                </Text>
              )}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.bedRow,
                    index % 2 === 1 ? styles.bedRowAlt : null,
                    item?.name ? null : styles.bedRowAlt,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName} numberOfLines={1}>
                      {item.patientName || '(no name)'}
                    </Text>
                    <Text style={styles.patientMeta} numberOfLines={1}>
                      IPID: {item.ipid || '-'}
                    </Text>
                  </View>
                  <View style={styles.bedPill}>
                    <Text style={styles.bedPillText}>
                      Bed No: {item.bedno || '-'}
                    </Text>
                  </View>

                  <Pressable
                     
                    onPress={() => navigation.navigate('DietScreen', { patient: item })}
                    style={styles.arrowStub}
                  >
                    <Text style={{ color: '#fff', fontWeight: '1900' }}>{'>'}</Text>
                  </Pressable>
                </View>

              )}
            />
          )}
        </View>
      </ScrollView>

      <Modal
        visible={wardPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setWardPickerOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setWardPickerOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => { }}>
            <Text style={styles.modalTitle}>Select Ward</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {loading ? (
                <View style={styles.modalBody}>
                  <ActivityIndicator />
                </View>
              ) : wards.length === 0 ? (
                <View style={styles.modalBody}>
                  <Text style={styles.muted}>No wards available.</Text>
                </View>
              ) : (
                wards.map((w, idx) => {
                  const name = getWardName(w, idx);
                  const isSelected = selectedWard === w;
                  return (
                    <Pressable
                      key={`${name}-${idx}`}
                      onPress={() => {
                        setSelectedWard(w);
                        setBeds([]);
                        setBedError('');
                        setWardPickerOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.modalRow,
                        isSelected && styles.modalRowSelected,
                        pressed ? styles.pressed : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalRowText,
                          isSelected && styles.modalRowTextSelected,
                        ]}
                      >
                        {name}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EEF0F4',
  },
  header: {
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#D90429',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 20,
  },
  brandSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  logoutBar: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF0F4',
  },
  logoutBarText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  pressed: {
    opacity: 0.9,
  },
  content: {
    padding: 14,
    paddingBottom: 24,
    gap: 12,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
  },
  panelTitle: {
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },
  form: {
    padding: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    color: '#111827',
  },
  calendarStub: {
    width: 44,
    height: 44,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  calendarStubText: {
    fontSize: 16,
  },
  select: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  chev: {
    color: '#6B7280',
    fontSize: 18,
    fontWeight: '900',
  },
  bedListBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  bedListBtnDisabled: {
    opacity: 0.6,
  },
  bedListText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  error: {
    marginTop: 12,
    color: '#B91C1C',
    fontWeight: '700',
  },
  body: {
    padding: 12,
  },
  muted: {
    color: '#6B7280',
    fontWeight: '600',
  },
  listWrap: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
  },
  bedRowAlt: {
    backgroundColor: '#FFFFFF',
  },
  patientName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  patientMeta: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  bedPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  bedPillText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
  },
  arrowStub: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#BDBDBD',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 16,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalTitle: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalBody: {
    padding: 14,
  },
  modalRow: {
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalRowSelected: {
    backgroundColor: '#DBEAFE',
  },
  modalRowText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  modalRowTextSelected: {
    color: '#1D4ED8',
  },
});

