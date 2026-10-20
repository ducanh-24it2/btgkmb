import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import * as Network from 'expo-network';
import {
  createCategory,
  deleteCategory,
  deleteDish,
  getCategories,
  getDishById,
  getDishes,
  getPendingSyncCount,
  getSavedLanguage,
  initializeDatabase,
  saveDish,
  saveLanguage,
  setThumbnail,
} from './database/database';
import { translate } from './localization/i18n';
import type { Dish, DishDraft, DishCategory, Language } from './models/types';
import { syncPendingChanges } from './services/mockApiSync';
import { Button } from './components/Controls';
import { CategoryManagerScreen } from './screens/CategoryManagerScreen';
import { DishDetailScreen } from './screens/DishDetailScreen';
import { DishFormScreen } from './screens/DishFormScreen';
import { DishListScreen, initialFilters, type DishFilters } from './screens/DishListScreen';

type Screen = 'list' | 'detail' | 'form' | 'categories';
type NetworkStatus = 'online' | 'offline' | 'syncing' | 'error';

export default function App() {
  const [ready, setReady] = useState(false);
  const [startupError, setStartupError] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [screen, setScreen] = useState<Screen>('list');
  const [formReturnScreen, setFormReturnScreen] = useState<'list' | 'detail'>('list');
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [filters, setFilters] = useState<DishFilters>(initialFilters);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('offline');
  const [pendingSync, setPendingSync] = useState(0);
  const [syncConfigured, setSyncConfigured] = useState(false);

  const refreshData = async () => {
    const [nextDishes, nextCategories, nextPending] = await Promise.all([
      getDishes(), getCategories(), getPendingSyncCount(),
    ]);
    setDishes(nextDishes);
    setCategories(nextCategories);
    setPendingSync(nextPending);
  };

  const runSync = async () => {
    try {
      const result = await syncPendingChanges();
      setSyncConfigured(result.configured);
      const count = await getPendingSyncCount();
      setPendingSync(count);
      const state = await Network.getNetworkStateAsync();
      setNetworkStatus(state.isConnected && state.isInternetReachable !== false
        ? (count > 0 && result.synced === 0 ? 'error' : 'online')
        : 'offline');
    } catch {
      setNetworkStatus('error');
      try { setPendingSync(await getPendingSyncCount()); } catch { /* Database startup owns this failure. */ }
    }
  };

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      try {
        await initializeDatabase();
        const [savedLanguage, nextDishes, nextCategories, nextPending] = await Promise.all([
          getSavedLanguage(), getDishes(), getCategories(), getPendingSyncCount(),
        ]);
        if (!mounted) return;
        setLanguage(savedLanguage);
        setDishes(nextDishes);
        setCategories(nextCategories);
        setPendingSync(nextPending);
        setReady(true);
        void runSync();
      } catch {
        if (mounted) setStartupError(true);
      }
    };
    void initialize();

    const networkSubscription = Network.addNetworkStateListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) void runSync();
      else setNetworkStatus('offline');
    });
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void runSync();
    });
    return () => {
      mounted = false;
      networkSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  const updateLocalView = async () => {
    await refreshData();
    void runSync();
  };

  const dish = dishes.find((item) => item.BIT230216_Id === selectedDishId) ?? null;
  const categoryFor = (id: string) => categories.find((category) => category.BIT230216_Id === id);
  const categoryLabel = (category: DishCategory | undefined) => {
    if (!category) return translate(language, 'category');
    const key = category.BIT230216_Id === 'category_main' ? 'catMain'
      : category.BIT230216_Id === 'category_salad' ? 'catSalad'
        : category.BIT230216_Id === 'category_dessert' ? 'catDessert' : null;
    return key ? translate(language, key) : category.BIT230216_Name;
  };

  const switchLanguage = () => {
    const nextLanguage = language === 'en' ? 'vi' : 'en';
    setLanguage(nextLanguage);
    void saveLanguage(nextLanguage).catch(() => Alert.alert(translate(language, 'error')));
  };

  const openCreate = () => {
    setSelectedDishId(null);
    setFormReturnScreen('list');
    setScreen('form');
  };

  const openEdit = () => {
    setFormReturnScreen('detail');
    setScreen('form');
  };

  const submitDish = async (draft: DishDraft) => {
    const savedId = await saveDish(draft, screen === 'form' && formReturnScreen === 'detail' ? selectedDishId ?? undefined : undefined);
    setSelectedDishId(savedId);
    await updateLocalView();
    setScreen(formReturnScreen === 'detail' ? 'detail' : 'list');
  };

  const changeAvailability = async (available: boolean) => {
    if (!dish) return;
    const draft: DishDraft = {
      BIT230216_Name: dish.BIT230216_Name,
      BIT230216_Price: dish.BIT230216_Price,
      BIT230216_PreparationTime: dish.BIT230216_PreparationTime,
      BIT230216_IsAvailable: available,
      BIT230216_Description: dish.BIT230216_Description,
      BIT230216_DishCategoryId: dish.BIT230216_DishCategoryId,
      BIT230216_Images: dish.BIT230216_Images.map((image) => ({
        BIT230216_ImageUrl: image.BIT230216_ImageUrl,
        BIT230216_IsThumbnail: image.BIT230216_IsThumbnail,
      })),
    };
    try {
      await saveDish(draft, dish.BIT230216_Id);
      await updateLocalView();
    } catch {
      Alert.alert(translate(language, 'error'));
    }
  };

  const removeDish = async () => {
    if (!selectedDishId) return;
    try {
      await deleteDish(selectedDishId);
      await updateLocalView();
      setScreen('list');
    } catch {
      Alert.alert(translate(language, 'error'));
    }
  };

  const changeThumbnail = async (imageId: string) => {
    if (!selectedDishId) return;
    try {
      await setThumbnail(selectedDishId, imageId);
      await updateLocalView();
    } catch {
      Alert.alert(translate(language, 'error'));
    }
  };

  const back = () => {
    if (screen === 'form') setScreen(formReturnScreen);
    else setScreen('list');
  };

  const title = screen === 'list' ? translate(language, 'dishes')
    : screen === 'detail' ? translate(language, 'details')
      : screen === 'categories' ? translate(language, 'manageCategories')
        : dish ? translate(language, 'edit') : translate(language, 'addDish');
  const statusText = networkStatus === 'offline' ? translate(language, 'noInternet')
    : networkStatus === 'syncing' ? translate(language, 'syncPending')
      : networkStatus === 'error' ? translate(language, 'syncFailed')
        : pendingSync > 0 ? `${translate(language, 'syncPending')} · ${pendingSync}`
          : syncConfigured ? translate(language, 'syncConfigured') : translate(language, 'syncUnavailable');

  if (startupError) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>{translate(language, 'error')}</Text>
        <Button title={translate(language, 'retry')} kind="primary" onPress={() => { setStartupError(false); setReady(false); void initializeDatabase().then(refreshData).then(() => setReady(true)).catch(() => setStartupError(true)); }} />
      </SafeAreaView>
    );
  }
  if (!ready) {
    return <SafeAreaView style={styles.center}><ActivityIndicator color="#1F5B49" size="large" /><Text style={styles.loading}>{translate(language, 'loading')}</Text></SafeAreaView>;
  }

  const dishCounts = dishes.reduce<Record<string, number>>((counts, item) => {
    counts[item.BIT230216_DishCategoryId] = (counts[item.BIT230216_DishCategoryId] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F4EF" />
      <View style={styles.header}>
        {screen === 'list' ? (
          <View style={styles.brand}>
            <Text style={styles.eyebrow}>BIT230216_FoodManager</Text>
            <Text style={styles.headerTitle}>{translate(language, 'appName')}</Text>
          </View>
        ) : (
          <View style={styles.titleWrap}>
            <Pressable onPress={back} accessibilityRole="button" style={styles.backButton}><Text style={styles.backGlyph}>‹</Text></Pressable>
            <Text numberOfLines={1} style={styles.screenTitle}>{title}</Text>
          </View>
        )}
        <Pressable accessibilityRole="button" onPress={switchLanguage} style={styles.languageButton}>
          <Text style={styles.languageText}>{language === 'en' ? 'EN' : 'VI'}</Text>
        </Pressable>
      </View>
      <View style={[styles.statusBar, networkStatus === 'offline' && styles.offlineBar, networkStatus === 'error' && styles.errorBar]}>
        <View style={[styles.statusDot, networkStatus === 'online' && styles.onlineDot, networkStatus === 'syncing' && styles.syncDot]} />
        <Text numberOfLines={1} style={styles.statusText}>{statusText}</Text>
        {networkStatus === 'syncing' ? <ActivityIndicator size="small" color="#456A58" /> : null}
      </View>
      <View style={styles.content}>
        {screen === 'list' ? (
          <DishListScreen
            dishes={dishes}
            categories={categories}
            language={language}
            filters={filters}
            onFiltersChange={setFilters}
            onOpenDish={(id) => { setSelectedDishId(id); setScreen('detail'); }}
            onCreate={openCreate}
            onManageCategories={() => setScreen('categories')}
          />
        ) : null}
        {screen === 'detail' ? (
          <DishDetailScreen
            dish={dish}
            categoryName={categoryLabel(dish ? categoryFor(dish.BIT230216_DishCategoryId) : undefined)}
            language={language}
            onBack={back}
            onEdit={openEdit}
            onDelete={() => void removeDish()}
            onSetThumbnail={(id) => void changeThumbnail(id)}
            onToggleAvailability={(available) => void changeAvailability(available)}
          />
        ) : null}
        {screen === 'form' ? (
          <DishFormScreen
            key={`${selectedDishId ?? 'new'}-${screen}`}
            dish={dish}
            dishes={dishes}
            categories={categories}
            language={language}
            onCancel={back}
            onSubmit={submitDish}
          />
        ) : null}
        {screen === 'categories' ? (
          <CategoryManagerScreen
            categories={categories}
            dishCounts={dishCounts}
            language={language}
            onBack={back}
            onCreate={async (name) => { await createCategory(name); await updateLocalView(); }}
            onDelete={async (id) => { await deleteCategory(id); await updateLocalView(); }}
          />
        ) : null}
      </View>
      {screen === 'list' ? <Text style={styles.credit}>Trần Đăng Khôi · BIT230216</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F4EF' }, content: { flex: 1 },
  header: { minHeight: 72, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#E3E5DE' },
  brand: { justifyContent: 'center' }, eyebrow: { color: '#68746B', fontSize: 10, fontWeight: '800', marginBottom: 2 },
  headerTitle: { color: '#20332A', fontSize: 22, fontWeight: '800' }, screenTitle: { color: '#20332A', fontSize: 18, fontWeight: '800', flexShrink: 1 },
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 }, backButton: { width: 38, height: 42, justifyContent: 'center' },
  backGlyph: { fontSize: 35, lineHeight: 38, color: '#1F5B49' }, languageButton: { minWidth: 42, height: 36, borderRadius: 6, backgroundColor: '#E3E9E2', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  languageText: { color: '#1F5B49', fontSize: 12, fontWeight: '900' },
  statusBar: { minHeight: 30, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#E8EEE7' },
  offlineBar: { backgroundColor: '#ECEAE2' }, errorBar: { backgroundColor: '#F3E6E2' }, statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#8A9088' },
  onlineDot: { backgroundColor: '#2C8054' }, syncDot: { backgroundColor: '#BD7B31' }, statusText: { color: '#566258', fontSize: 11, flex: 1 },
  credit: { color: '#899087', fontSize: 10, textAlign: 'center', paddingBottom: 5, backgroundColor: '#F5F4EF' },
  center: { flex: 1, backgroundColor: '#F5F4EF', justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  loading: { color: '#59645B', fontSize: 14 }, errorTitle: { color: '#A53E32', fontSize: 16, fontWeight: '700' },
});