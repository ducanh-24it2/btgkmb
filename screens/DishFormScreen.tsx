import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { Dish, DishCategory, DishDraft, Language } from '../models/types';
import { translate } from '../localization/i18n';
import { Button, ChoiceChip, Field } from '../components/Controls';

export function DishFormScreen({ dish, dishes, categories, language, onCancel, onSubmit }: {
  dish: Dish | null;
  dishes: Dish[];
  categories: DishCategory[];
  language: Language;
  onCancel: () => void;
  onSubmit: (draft: DishDraft) => Promise<void>;
}) {
  const [name, setName] = useState(dish?.BIT230216_Name ?? '');
  const [price, setPrice] = useState(dish ? String(dish.BIT230216_Price) : '');
  const [preparationTime, setPreparationTime] = useState(dish ? String(dish.BIT230216_PreparationTime) : '');
  const [description, setDescription] = useState(dish?.BIT230216_Description ?? '');
  const [categoryId, setCategoryId] = useState(dish?.BIT230216_DishCategoryId ?? categories[0]?.BIT230216_Id ?? '');
  const [available, setAvailable] = useState(dish?.BIT230216_IsAvailable ?? true);
  const [imageUrls, setImageUrls] = useState(dish?.BIT230216_Images.map((image) => image.BIT230216_ImageUrl).join('\n') ?? '');
  const [thumbnailIndex, setThumbnailIndex] = useState(() => dish?.BIT230216_Images.findIndex((image) => image.BIT230216_IsThumbnail) ?? 0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const urls = useMemo(() => imageUrls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean), [imageUrls]);

  const submit = async () => {
    setError('');
    const trimmedName = name.trim();
    const numericPrice = Number(price);
    const numericTime = Number(preparationTime);
    if (!trimmedName) return setError(translate(language, 'nameRequired'));
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) return setError(translate(language, 'priceInvalid'));
    if (!Number.isFinite(numericTime) || numericTime <= 0) return setError(translate(language, 'timeInvalid'));
    if (!categoryId) return setError(translate(language, 'categoryRequired'));
    const duplicate = dishes.some((item) => item.BIT230216_Id !== dish?.BIT230216_Id
      && item.BIT230216_DishCategoryId === categoryId
      && item.BIT230216_Name.trim().toLocaleLowerCase() === trimmedName.toLocaleLowerCase());
    if (duplicate) return setError(translate(language, 'duplicateDish'));
    if (urls.some((url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol !== 'http:' && parsed.protocol !== 'https:';
      } catch {
        return true;
      }
    })) return setError(translate(language, 'imageUrlInvalid'));

    const draft: DishDraft = {
      BIT230216_Name: trimmedName,
      BIT230216_Price: numericPrice,
      BIT230216_PreparationTime: numericTime,
      BIT230216_IsAvailable: available,
      BIT230216_Description: description.trim(),
      BIT230216_DishCategoryId: categoryId,
      BIT230216_Images: urls.map((url, index) => ({
        BIT230216_ImageUrl: url,
        BIT230216_IsThumbnail: index === Math.max(0, Math.min(thumbnailIndex, urls.length - 1)),
      })),
    };
    setSaving(true);
    try {
      await onSubmit(draft);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : translate(language, 'error'));
    } finally {
      setSaving(false);
    }
  };

  const localizedCategory = (category: DishCategory) => {
    const key = category.BIT230216_Id === 'category_main' ? 'catMain'
      : category.BIT230216_Id === 'category_salad' ? 'catSalad'
        : category.BIT230216_Id === 'category_dessert' ? 'catDessert' : null;
    return key ? translate(language, key) : category.BIT230216_Name;
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Field label={translate(language, 'name')} value={name} onChangeText={setName} maxLength={100} />
      <View style={styles.row}>
        <View style={styles.half}><Field label={translate(language, 'price')} value={price} onChangeText={setPrice} keyboardType="decimal-pad" /></View>
        <View style={styles.half}><Field label={translate(language, 'prepTime')} value={preparationTime} onChangeText={setPreparationTime} keyboardType="decimal-pad" /></View>
      </View>
      <Text style={styles.label}>{translate(language, 'category')}</Text>
      <View style={styles.choices}>
        {categories.map((category) => (
          <ChoiceChip key={category.BIT230216_Id} label={localizedCategory(category)} selected={categoryId === category.BIT230216_Id} onPress={() => setCategoryId(category.BIT230216_Id)} />
        ))}
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.label}>{translate(language, available ? 'available' : 'unavailable')}</Text>
        <Switch value={available} onValueChange={setAvailable} trackColor={{ false: '#C8CDC5', true: '#8DB6A0' }} thumbColor={available ? '#1F5B49' : '#F4F4F0'} />
      </View>
      <Field label={translate(language, 'description')} value={description} onChangeText={setDescription} multiline maxLength={500} />
      <Field label={translate(language, 'imageUrls')} value={imageUrls} onChangeText={setImageUrls} multiline autoCapitalize="none" keyboardType="url" />
      <Text style={styles.hint}>{translate(language, 'imageHint')}</Text>
      {urls.length ? (
        <View style={styles.thumbnailSection}>
          <Text style={styles.label}>{translate(language, 'thumbnail')}</Text>
          <View style={styles.choices}>
            {urls.map((url, index) => (
              <ChoiceChip key={`${url}-${index}`} label={`${translate(language, 'images')} ${index + 1}`} selected={thumbnailIndex === index} onPress={() => setThumbnailIndex(index)} />
            ))}
          </View>
        </View>
      ) : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <View style={styles.actions}>
        <Button title={translate(language, 'cancel')} onPress={onCancel} />
        <Button title={dish ? translate(language, 'save') : translate(language, 'create')} kind="primary" onPress={submit} disabled={saving} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 36, backgroundColor: '#F5F4EF' }, row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 }, label: { color: '#4E5A52', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E0E3DC', marginBottom: 17 },
  hint: { color: '#737B73', fontSize: 12, marginTop: -9, marginBottom: 12 }, thumbnailSection: { marginTop: 4 },
  error: { color: '#A53E32', backgroundColor: '#F4E2DE', borderRadius: 6, padding: 11, marginTop: 3, marginBottom: 13, fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 7 },
});