import React from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { Dish, Language } from '../models/types';
import { translate } from '../localization/i18n';
import { Button } from '../components/Controls';

export function DishDetailScreen({ dish, categoryName, language, onBack, onEdit, onDelete, onSetThumbnail, onToggleAvailability }: {
  dish: Dish | null;
  categoryName: string;
  language: Language;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetThumbnail: (imageId: string) => void;
  onToggleAvailability: (available: boolean) => void;
}) {
  if (!dish) {
    return <View style={styles.missing}><Text style={styles.body}>{translate(language, 'notFound')}</Text><Button title={translate(language, 'back')} onPress={onBack} /></View>;
  }
  const speedKey = dish.BIT230216_PreparationTime <= 15 ? 'quick' : 'regular';
  const confirmDelete = () => {
    const title = translate(language, 'confirmDelete');
    const prompt = translate(language, 'deleteDishPrompt');
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${prompt}`)) onDelete();
      return;
    }
    Alert.alert(title, prompt, [
      { text: translate(language, 'cancel'), style: 'cancel' },
      { text: translate(language, 'delete'), style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        {dish.BIT230216_Images.length ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {dish.BIT230216_Images.map((image) => (
              <Image key={image.BIT230216_Id} source={{ uri: image.BIT230216_ImageUrl }} style={styles.heroImage} />
            ))}
          </ScrollView>
        ) : <View style={styles.noImage}><Text style={styles.noImageText}>{translate(language, 'emptyImages')}</Text></View>}
      </View>

      {dish.BIT230216_Images.length > 0 ? (
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>{translate(language, 'images')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dish.BIT230216_Images.map((image, index) => (
              <View key={image.BIT230216_Id} style={styles.thumbWrap}>
                <Image source={{ uri: image.BIT230216_ImageUrl }} style={styles.thumb} />
                <Button
                  title={image.BIT230216_IsThumbnail ? `✓ ${translate(language, 'thumbnail')}` : `${translate(language, 'setThumbnail')} ${index + 1}`}
                  compact
                  kind={image.BIT230216_IsThumbnail ? 'primary' : 'secondary'}
                  onPress={() => onSetThumbnail(image.BIT230216_Id)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{dish.BIT230216_Name}</Text>
          <Text style={styles.price}>${dish.BIT230216_Price.toFixed(2)}</Text>
        </View>
        <Text style={styles.category}>{categoryName}</Text>
        <View style={styles.badges}>
          <Text style={[styles.badge, dish.BIT230216_IsAvailable ? styles.available : styles.unavailable]}>
            {translate(language, dish.BIT230216_IsAvailable ? 'available' : 'unavailable')}
          </Text>
          <Text style={styles.badge}>{dish.BIT230216_PreparationTime} min · {translate(language, speedKey)}</Text>
        </View>
        <View style={styles.availabilityRow}>
          <Text style={styles.sectionTitle}>{translate(language, dish.BIT230216_IsAvailable ? 'available' : 'unavailable')}</Text>
          <Switch value={dish.BIT230216_IsAvailable} onValueChange={onToggleAvailability} trackColor={{ false: '#C8CDC5', true: '#8DB6A0' }} thumbColor={dish.BIT230216_IsAvailable ? '#1F5B49' : '#F4F4F0'} />
        </View>
        <Text style={styles.sectionTitle}>{translate(language, 'description')}</Text>
        <Text style={styles.body}>{dish.BIT230216_Description || '—'}</Text>
      </View>

      <View style={styles.footer}>
        <Button title={translate(language, 'edit')} kind="primary" onPress={onEdit} />
        <Button title={translate(language, 'delete')} kind="danger" onPress={confirmDelete} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 32, backgroundColor: '#F5F4EF' }, hero: { height: 270, backgroundColor: '#E4E7DF' },
  heroImage: { width: 390, height: 270, resizeMode: 'cover' }, noImage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noImageText: { color: '#69736A', fontSize: 14 }, imageSection: { paddingHorizontal: 18, paddingTop: 18 },
  sectionTitle: { color: '#344139', fontSize: 13, fontWeight: '800', marginBottom: 9 }, thumbWrap: { marginRight: 10, width: 138, gap: 7 },
  thumb: { width: 138, height: 90, borderRadius: 6, backgroundColor: '#E7E9E2' }, details: { padding: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  title: { color: '#202B25', fontSize: 23, fontWeight: '800', flex: 1 }, price: { color: '#1F5B49', fontSize: 18, fontWeight: '800' },
  category: { color: '#6D786F', fontSize: 14, marginTop: 5 }, badges: { flexDirection: 'row', gap: 8, marginTop: 15, marginBottom: 24 },
  badge: { overflow: 'hidden', color: '#425048', backgroundColor: '#E5E9E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 5, fontSize: 12, fontWeight: '700' },
  available: { color: '#287451', backgroundColor: '#DCEBE0' }, unavailable: { color: '#A45542', backgroundColor: '#F2E2DD' },
  availabilityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E0E3DC', paddingVertical: 14, marginBottom: 18 },
  body: { color: '#59645B', fontSize: 15, lineHeight: 23 }, footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 18 },
  missing: { padding: 24, gap: 16 },
});
