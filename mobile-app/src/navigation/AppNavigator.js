import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { colors, fontSize } from '../theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ProductsStack = createNativeStackNavigator();
const CartStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function HomeStackScreen() {
  const { t } = useLanguage();
  return (
    <HomeStack.Navigator screenOptions={stackOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: t('home') }} />
      <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: t('product_details') }} />
    </HomeStack.Navigator>
  );
}

function ProductsStackScreen() {
  const { t } = useLanguage();
  return (
    <ProductsStack.Navigator screenOptions={stackOptions}>
      <ProductsStack.Screen name="Products" component={ProductsScreen} options={{ title: t('products') }} />
      <ProductsStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: t('product_details') }} />
    </ProductsStack.Navigator>
  );
}

function CartStackScreen() {
  const { t } = useLanguage();
  return (
    <CartStack.Navigator screenOptions={stackOptions}>
      <CartStack.Screen name="Cart" component={CartScreen} options={{ title: t('cart') }} />
      <CartStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: t('checkout') }} />
      <CartStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: t('order_details') }} />
    </CartStack.Navigator>
  );
}

function OrdersStackScreen() {
  const { t } = useLanguage();
  return (
    <OrdersStack.Navigator screenOptions={stackOptions}>
      <OrdersStack.Screen name="Orders" component={OrdersScreen} options={{ title: t('my_orders') }} />
      <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: t('order_details') }} />
    </OrdersStack.Navigator>
  );
}

function ProfileStackScreen() {
  const { t } = useLanguage();
  return (
    <ProfileStack.Navigator screenOptions={stackOptions}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ title: t('profile') }} />
    </ProfileStack.Navigator>
  );
}

function CartTabIcon({ color, size }) {
  const { itemCount } = useCart();
  return (
    <View>
      <Ionicons name="cart-outline" size={size} color={color} />
      {itemCount > 0 && (
        <View style={{ position: 'absolute', top: -4, right: -10, backgroundColor: colors.danger, borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
          <Text style={{ color: colors.white, fontSize: 10, fontWeight: 'bold' }}>{itemCount > 99 ? '99+' : itemCount}</Text>
        </View>
      )}
    </View>
  );
}

function MainTabs() {
  const { t, isRTL } = useLanguage();

  const tabs = [
    { name: 'HomeTab', component: HomeStackScreen, label: t('home'), icon: 'home-outline' },
    { name: 'ProductsTab', component: ProductsStackScreen, label: t('products'), icon: 'grid-outline' },
    { name: 'CartTab', component: CartStackScreen, label: t('cart'), icon: 'cart-outline', customIcon: true },
    { name: 'OrdersTab', component: OrdersStackScreen, label: t('orders'), icon: 'receipt-outline' },
    { name: 'ProfileTab', component: ProfileStackScreen, label: t('profile'), icon: 'person-outline' },
  ];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.grayLight,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      {tabs.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: tab.label,
            tabBarIcon: tab.customIcon
              ? ({ color, size }) => <CartTabIcon color={color} size={size} />
              : ({ color, size }) => <Ionicons name={tab.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

function AuthStack() {
  const { t } = useLanguage();
  return (
    <Stack.Navigator screenOptions={{ ...stackOptions, headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

const stackOptions = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.dark,
  headerTitleStyle: { fontWeight: '600', fontSize: fontSize.lg },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
};

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary }}>
        <Text style={{ fontSize: 36, fontWeight: 'bold', color: colors.white }}>Sawdagar</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}
