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
  Image,
} from 'react-native';

import { getBedList, getWardList } from '../services/api';
import { clearToken, getToken } from '../utils/authStorage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';

const DEFAULT_HOSPITAL_LOGO = require('../images/triotree-technologies-original.webp');
const DEFAULT_HOSPITAL_NAME = 'Testing Hospital';
const DEFAULT_HOSPITAL_TAGLINE = 'IT Admin';

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
      <View style={styles.bg} pointerEvents="none">
        <View style={styles.bgBase} />
        <View style={styles.bgBlob1} />
        <View style={styles.bgBlob2} />
        <View style={styles.bgBlob3} />
        <View style={styles.bgWhiteCurve} />
      </View>

      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image
            source={DEFAULT_HOSPITAL_LOGO}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.brandTitle}>{DEFAULT_HOSPITAL_NAME}</Text>
            <Text style={styles.brandSubtitle}>{DEFAULT_HOSPITAL_TAGLINE}</Text>
          </View>
        </View>

        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
        >
          <Text style={styles.logoutBtnText}>Logout</Text>
        </Pressable>
      </View>

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
                     
                    onPress={() =>
                      navigation.navigate('DietScreen', { patient: item, orderDate: date })
                    }
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
    backgroundColor: 'transparent',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0EA5E9',
  },
  bgBlob1: {
    position: 'absolute',
    top: -100,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#38BDF8',
    opacity: 0.55,
  },
  bgBlob2: {
    position: 'absolute',
    bottom: -140,
    right: -150,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#0B5FA5',
    opacity: 0.65,
  },
  bgBlob3: {
    position: 'absolute',
    top: 140,
    right: 40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#22C55E',
    opacity: 0.12,
  },
  bgWhiteCurve: {
    position: 'absolute',
    left: -80,
    right: -80,
    bottom: -160,
    height: 360,
    borderRadius: 220,
    backgroundColor: '#FFFFFF',
    opacity: 0.92,
  },
  header: {
    backgroundColor: '#0B79C7',
    borderBottomWidth: 0,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandLogo: {
    width: 68,
    height: 50,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  brandSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
    fontStyle: 'italic',
  },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  logoutArrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutArrowText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  pressed: {
    opacity: 0.9,
  },
  content: {
    padding: 18,
    paddingBottom: 30,
    gap: 16,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
    marginBottom: 4,
  },
  panelTitle: {
    paddingHorizontal: 16,
    paddingTop: 14,
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  form: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    marginTop: 18,
    height: 52,
    borderRadius: 10,
    borderWidth: 0,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B79C7',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bedListBtnDisabled: {
    opacity: 0.6,
  },
  bedListText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0B79C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
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

