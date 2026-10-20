import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DishCategory, Language } from '../models/types';
import { translate } from '../localization/i18n';
import { Button, Field } from '../components/Controls';

export function CategoryManagerScreen({ categories, dishCounts, language, onBack, onCreate, onDelete }: {
  categories: DishCategory[];
  dishCounts: Record<string, number>;
  language: Language;
  onBack: () => void;
  onCreate: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const categoryLabel = (category: DishCategory) => {
    const key = category.BIT230216_Id === 'category_main' ? 'catMain'
      : category.BIT230216_Id === 'category_salad' ? 'catSalad'
        : category.BIT230216_Id === 'category_dessert' ? 'catDessert' : null;
    return key ? translate(language, key) : category.BIT230216_Name;
  };

  const add = async () => {
    const trimmed = name.trim();
    if (!trimmed) return setError(translate(language, 'nameRequired'));
    if (categories.some((category) => category.BIT230216_Name.toLocaleLowerCase() === trimmed.toLocaleLowerCase())) {
      return setError(translate(language, 'categoryExists'));
    }
    setBusy(true);
    try {
      await onCreate(trimmed);
      setName('');
      setError('');
    } catch {
      setError(translate(language, 'error'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = (category: DishCategory) => {
    const remove = () => {
      void onDelete(category.BIT230216_Id).catch((deleteError: unknown) => {
        setError(deleteError instanceof Error && deleteError.message === 'CATEGORY_IN_USE'
          ? translate(language, 'categoryInUse')
          : translate(language, 'error'));
      });
    };
    const title = translate(language, 'confirmDelete');
    const prompt = translate(language, 'deleteCategoryPrompt');
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${prompt}`)) remove();
      return;
    }
    Alert.alert(title, prompt, [
      { text: translate(language, 'cancel'), style: 'cancel' },
      { text: translate(language, 'delete'), style: 'destructive', onPress: remove },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Field label={translate(language, 'categoryName')} value={name} onChangeText={setName} maxLength={80} />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Button title={translate(language, 'addCategory')} kind="primary" onPress={add} disabled={busy} />
      <View style={styles.list}>
        {categories.length ? categories.map((category) => (
          <View key={category.BIT230216_Id} style={styles.item}>
            <View style={styles.info}>
              <Text style={styles.title}>{categoryLabel(category)}</Text>
              <Text style={styles.count}>{dishCounts[category.BIT230216_Id] ?? 0} {translate(language, 'dishesCount')}</Text>
            </View>
            <Button title={translate(language, 'delete')} kind="danger" compact onPress={() => confirmDelete(category)} />
          </View>
        )) : <Text style={styles.empty}>{translate(language, 'emptyCategories')}</Text>}
      </View>
      <Button title={translate(language, 'back')} onPress={onBack} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 36, backgroundColor: '#F5F4EF' },
  error: { color: '#A53E32', backgroundColor: '#F4E2DE', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: 13 },
  list: { marginVertical: 20 }, item: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#E0E3DC', gap: 10 },
  info: { flex: 1 }, title: { color: '#26342E', fontSize: 15, fontWeight: '700' }, count: { color: '#747D74', fontSize: 12, marginTop: 4 },
  empty: { color: '#727A72', textAlign: 'center', paddingVertical: 22 },
});
