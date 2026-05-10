import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../../components/Button';
import BrandLogo from '../../components/BrandLogo';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '../../theme';

export default function OrderSuccessScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const c = theme.colors;
  const order = route.params?.order;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <View style={styles.center}>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, shadows.lg]}>
          <BrandLogo variant="symbol" size={72} style={styles.logo} />
          <View style={[styles.iconWrap, { backgroundColor: c.success + '20' }]}> 
            <MaterialCommunityIcons name="check-circle" size={72} color={c.success} />
          </View>
          <Text style={[styles.eyebrow, { color: c.primary }]}>Order received</Text>
          <Text style={[styles.title, { color: c.text }]}>{t.orderPlaced}</Text>
          {order?.orderNumber ? <Text style={[styles.ordNum, { color: c.textSecondary }]}>{t.orderNumber} #{order.orderNumber}</Text> : null}
          <Text style={[styles.sub, { color: c.textSecondary }]}>We saved your order and you can follow every status update from the orders tab.</Text>

          <View style={[styles.note, { backgroundColor: c.brandSurface }]}> 
            <MaterialCommunityIcons name="truck-fast-outline" size={18} color={c.primary} />
            <Text style={[styles.noteText, { color: c.textSecondary }]}>Delivery progress updates will appear as soon as the order is confirmed.</Text>
          </View>

          <Button
            title={t.orderDetails}
            onPress={() => navigation.replace('OrderDetail', { id: order?.id })}
            style={styles.primaryAction}
            icon={<MaterialCommunityIcons name="receipt-text-check-outline" size={20} color={c.white} />}
          />
          <Button
            title={t.startShopping}
            onPress={() => navigation.navigate('HomeTab')}
            variant="outline"
            style={styles.secondaryAction}
            icon={<MaterialCommunityIcons name="shopping-outline" size={20} color={c.primary} />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  card: { width: '100%', borderWidth: 1, borderRadius: borderRadius.xxl, padding: spacing.xl, alignItems: 'center' },
  logo: { marginBottom: spacing.base },
  iconWrap: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  eyebrow: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: spacing.sm },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginBottom: 8 },
  ordNum: { fontSize: fontSize.md, fontWeight: '500', marginBottom: 8 },
  sub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 22 },
  note: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: borderRadius.xl, padding: spacing.base, marginTop: spacing.xl },
  noteText: { flex: 1, fontSize: fontSize.sm, lineHeight: 21 },
  primaryAction: { marginTop: spacing.xl, width: '100%' },
  secondaryAction: { marginTop: spacing.md, width: '100%' },
});
