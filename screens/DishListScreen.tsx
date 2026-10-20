import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AvailabilityFilter, Dish, DishCategory, DishSort, Language } from '../models/types';
import { translate } from '../localization/i18n';
import { Button, ChoiceChip, Field } from '../components/Controls';
import { DishCard } from '../components/DishCard';

export interface DishFilters {
  search: string;
  categoryId: string;
  availability: AvailabilityFilter;
  minPrice: string;
  maxPrice: string;
  sort: DishSort;
}

export const initialFilters: DishFilters = {
  search: '', categoryId: 'all', availability: 'all', minPrice: '', maxPrice: '', sort: 'price-asc',
};

export function DishListScreen({ dishes, categories, language, filters, onFiltersChange, onOpenDish, onCreate, onManageCategories }: {
  dishes: Dish[];
  categories: DishCategory[];
  language: Language;
  filters: DishFilters;
  onFiltersChange: (filters: DishFilters) => void;
  onOpenDish: (id: string) => void;
  onCreate: () => void;
  onManageCategories: () => void;
}) {
  const minimum = filters.minPrice.trim() ? Number(filters.minPrice) : null;
  const maximum = filters.maxPrice.trim() ? Number(filters.maxPrice) : null;
  const invalidRange = (minimum !== null && (!Number.isFinite(minimum) || minimum < 0))
    || (maximum !== null && (!Number.isFinite(maximum) || maximum < 0))
    || (minimum !== null && maximum !== null && minimum > maximum);

  const visibleDishes = useMemo(() => {
    const filtered = dishes.filter((dish) => {
      const matchesName = dish.BIT230216_Name.toLocaleLowerCase().includes(filters.search.trim().toLocaleLowerCase());
      const matchesCategory = filters.categoryId === 'all' || dish.BIT230216_DishCategoryId === filters.categoryId;
      const matchesAvailability = filters.availability === 'all'
        || (filters.availability === 'available' ? dish.BIT230216_IsAvailable : !dish.BIT230216_IsAvailable);
      const matchesMinimum = minimum === null || !Number.isFinite(minimum) || dish.BIT230216_Price >= minimum;
      const matchesMaximum = maximum === null || !Number.isFinite(maximum) || dish.BIT230216_Price <= maximum;
      return matchesName && matchesCategory && matchesAvailability && matchesMinimum && matchesMaximum;
    });
    return filtered.sort((first, second) => {
      if (filters.sort === 'price-desc') return second.BIT230216_Price - first.BIT230216_Price;
      if (filters.sort === 'time-asc') return first.BIT230216_PreparationTime - second.BIT230216_PreparationTime;
      return first.BIT230216_Price - second.BIT230216_Price;
    });
  }, [dishes, filters, minimum, maximum]);

  const categoryLabel = (category: DishCategory) => {
    const key = category.BIT230216_Id === 'category_main' ? 'catMain'
      : category.BIT230216_Id === 'category_salad' ? 'catSalad'
        : category.BIT230216_Id === 'category_dessert' ? 'catDessert' : null;
    return key ? translate(language, key) : category.BIT230216_Name;
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.toolbar}>
        <Text style={styles.count}>{visibleDishes.length} {translate(language, 'dishes').toLocaleLowerCase()}</Text>
        <View style={styles.actions}>
          <Button title={translate(language, 'manageCategories')} compact onPress={onManageCategories} />
          <Button title={`＋ ${translate(language, 'addDish')}`} kind="primary" compact onPress={onCreate} />
        </View>
      </View>

      <Field
        label={translate(language, 'search')}
        value={filters.search}
        onChangeText={(search) => onFiltersChange({ ...filters, search })}
        autoCapitalize="none"
      />

      <Text style={styles.sectionLabel}>{translate(language, 'category')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        <ChoiceChip label={translate(language, 'allCategories')} selected={filters.categoryId === 'all'} onPress={() => onFiltersChange({ ...filters, categoryId: 'all' })} />
        {categories.map((category) => (
          <ChoiceChip key={category.BIT230216_Id} label={categoryLabel(category)} selected={filters.categoryId === category.BIT230216_Id} onPress={() => onFiltersChange({ ...filters, categoryId: category.BIT230216_Id })} />
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>{translate(language, 'allStatuses')}</Text>
      <View style={styles.chipRow}>
        <ChoiceChip label={translate(language, 'allStatuses')} selected={filters.availability === 'all'} onPress={() => onFiltersChange({ ...filters, availability: 'all' })} />
        <ChoiceChip label={translate(language, 'availableOnly')} selected={filters.availability === 'available'} onPress={() => onFiltersChange({ ...filters, availability: 'available' })} />
        <ChoiceChip label={translate(language, 'unavailable')} selected={filters.availability === 'unavailable'} onPress={() => onFiltersChange({ ...filters, availability: 'unavailable' })} />
      </View>

      <View style={styles.priceFields}>
        <View style={styles.priceField}><Field label={translate(language, 'minPrice')} value={filters.minPrice} onChangeText={(minPrice) => onFiltersChange({ ...filters, minPrice })} keyboardType="decimal-pad" /></View>
        <View style={styles.priceField}><Field label={translate(language, 'maxPrice')} value={filters.maxPrice} onChangeText={(maxPrice) => onFiltersChange({ ...filters, maxPrice })} keyboardType="decimal-pad" /></View>
      </View>
      {invalidRange ? <Text accessibilityRole="alert" style={styles.rangeError}>{translate(language, 'invalidPriceRange')}</Text> : null}

      <Text style={styles.sectionLabel}>{translate(language, 'sort')}</Text>
      <View style={styles.chipRow}>
        <ChoiceChip label={translate(language, 'priceAsc')} selected={filters.sort === 'price-asc'} onPress={() => onFiltersChange({ ...filters, sort: 'price-asc' })} />
        <ChoiceChip label={translate(language, 'priceDesc')} selected={filters.sort === 'price-desc'} onPress={() => onFiltersChange({ ...filters, sort: 'price-desc' })} />
        <ChoiceChip label={translate(language, 'timeAsc')} selected={filters.sort === 'time-asc'} onPress={() => onFiltersChange({ ...filters, sort: 'time-asc' })} />
      </View>
      <View style={styles.resetRow}><Button title={translate(language, 'resetFilters')} compact onPress={() => onFiltersChange(initialFilters)} /></View>

      <View style={styles.results}>
        {visibleDishes.length ? visibleDishes.map((dish) => (
          <DishCard
            key={dish.BIT230216_Id}
            dish={dish}
            language={language}
            categoryName={categoryLabel(categories.find((category) => category.BIT230216_Id === dish.BIT230216_DishCategoryId) ?? {
              BIT230216_Id: '', BIT230216_Name: translate(language, 'category'), BIT230216_Description: '',
            })}
            onPress={() => onOpenDish(dish.BIT230216_Id)}
          />
        )) : <Text style={styles.empty}>{translate(language, 'noDishes')}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 36, backgroundColor: '#F5F4EF' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 8 },
  count: { color: '#677168', fontSize: 12, fontWeight: '700', flexShrink: 1 },
  actions: { flexDirection: 'row', gap: 7 }, sectionLabel: { color: '#344139', fontSize: 13, fontWeight: '800', marginBottom: 8, marginTop: 5 },
  chipRow: { flexDirection: 'row', marginBottom: 8 }, priceFields: { flexDirection: 'row', gap: 12 }, priceField: { flex: 1 },
  rangeError: { color: '#A53E32', fontSize: 12, marginTop: -8, marginBottom: 10 }, resetRow: { alignItems: 'flex-end', marginBottom: 9 },
  results: { marginTop: 4 }, empty: { color: '#727A72', textAlign: 'center', paddingVertical: 34, fontSize: 14 },
});