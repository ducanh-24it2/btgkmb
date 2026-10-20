import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Dish, Language } from '../models/types';
import { translate } from '../localization/i18n';

export function DishCard({ dish, categoryName, language, onPress }: {
  dish: Dish;
  categoryName: string;
  language: Language;
  onPress: () => void;
}) {
  const cover = dish.BIT230216_Images.find((image) => image.BIT230216_IsThumbnail) ?? dish.BIT230216_Images[0];
  const speedLabel = dish.BIT230216_PreparationTime <= 15 ? translate(language, 'quick') : translate(language, 'regular');
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {cover ? <Image source={{ uri: cover.BIT230216_ImageUrl }} style={styles.cover} /> : <View style={styles.placeholder}><Text style={styles.placeholderText}>FM</Text></View>}
      <View style={styles.content}>
        <View style={styles.topLine}>
          <Text numberOfLines={1} style={styles.title}>{dish.BIT230216_Name}</Text>
          <Text style={styles.price}>${dish.BIT230216_Price.toFixed(2)}</Text>
        </View>
        <Text numberOfLines={1} style={styles.category}>{categoryName}</Text>
        <View style={styles.metaLine}>
          <Text style={[styles.status, dish.BIT230216_IsAvailable ? styles.available : styles.unavailable]}>
            {translate(language, dish.BIT230216_IsAvailable ? 'available' : 'unavailable')}
          </Text>
          <Text style={styles.meta}>{dish.BIT230216_PreparationTime} min · {speedLabel}</Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E7E9E2', paddingVertical: 12 },
  pressed: { opacity: 0.72 }, cover: { width: 78, height: 78, borderRadius: 6, backgroundColor: '#E7E9E2' },
  placeholder: { width: 78, height: 78, borderRadius: 6, backgroundColor: '#DDE8DE', alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#1F5B49', fontWeight: '800', fontSize: 20 }, content: { flex: 1, marginHorizontal: 12, minWidth: 0 },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { color: '#202B25', fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  price: { color: '#1F5B49', fontSize: 14, fontWeight: '800' }, category: { color: '#737B73', fontSize: 12, marginTop: 4 },
  metaLine: { flexDirection: 'row', alignItems: 'center', marginTop: 9, gap: 8 }, status: { fontSize: 11, fontWeight: '700' },
  available: { color: '#287451' }, unavailable: { color: '#A45542' }, meta: { color: '#68736B', fontSize: 11 },
  chevron: { color: '#899188', fontSize: 26, paddingLeft: 2 },
});