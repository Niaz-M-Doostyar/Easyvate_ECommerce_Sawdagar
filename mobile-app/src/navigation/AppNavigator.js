import React from 'react';
import { View, Platform, useWindowDimensions } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BrandLogo from '../components/BrandLogo';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import HomeScreen from '../screens/home/HomeScreen';
import ProductsScreen from '../screens/products/ProductsScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import SearchScreen from '../screens/products/SearchScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/cart/CheckoutScreen';
import OrderSuccessScreen from '../screens/cart/OrderSuccessScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import BlogScreen from '../screens/blog/BlogScreen';
import BlogDetailScreen from '../screens/blog/BlogDetailScreen';
import ContactScreen from '../screens/misc/ContactScreen';
import AboutScreen from '../screens/misc/AboutScreen';
import PrivacyPolicyScreen from '../screens/misc/PrivacyPolicyScreen';
import SupplierProductsScreen from '../screens/supplier/SupplierProductsScreen';
import SupplierAddProductScreen from '../screens/supplier/SupplierAddProductScreen';
import SupplierOrdersScreen from '../screens/supplier/SupplierOrdersScreen';
import SupplierSponsorshipsScreen from '../screens/supplier/SupplierSponsorshipsScreen';
import DeliveryOrdersScreen from '../screens/delivery/DeliveryOrdersScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const noHeader = { headerShown: false };

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Products" component={ProductsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Blog" component={BlogScreen} />
      <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </Stack.Navigator>
  );
}

function ShopStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="Products" component={ProductsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
    </Stack.Navigator>
  );
}

function CartStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Blog" component={BlogScreen} />
      <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="SupplierProducts" component={SupplierProductsScreen} />
      <Stack.Screen name="SupplierAddProduct" component={SupplierAddProductScreen} />
      <Stack.Screen name="SupplierOrders" component={SupplierOrdersScreen} />
      <Stack.Screen name="SupplierSponsorships" component={SupplierSponsorshipsScreen} />
      <Stack.Screen name="DeliveryOrders" component={DeliveryOrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { count: cartCount } = useCart();
  const c = theme.colors;
  const isTablet = width >= 768;
  const tabBarWidth = isTablet ? Math.min(width - 32, 720) : undefined;
  const tabBarHeight = Platform.OS === 'ios' ? (isTablet ? 78 : 84) : (isTablet ? 72 : 68);
  const tabBarPaddingBottom = Platform.OS === 'ios' ? (isTablet ? 14 : 20) : 10;
  const tabBarMarginBottom = Platform.OS === 'ios' ? (isTablet ? 16 : 12) : 10;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarStyle: {
          backgroundColor: c.surfaceElevated,
          borderColor: c.border,
          borderWidth: 1,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 8,
          marginHorizontal: 12,
          marginBottom: tabBarMarginBottom,
          borderRadius: 28,
          width: tabBarWidth,
          alignSelf: isTablet ? 'center' : undefined,
          shadowColor: c.black,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: theme.dark ? 0.28 : 0.08,
          shadowRadius: 24,
          elevation: 10,
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
        tabBarLabelStyle: {
          fontSize: isTablet ? 12 : 11,
          fontWeight: '600',
          marginTop: 1,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            HomeTab: focused ? 'home-variant' : 'home-variant-outline',
            ShopTab: focused ? 'view-grid' : 'view-grid-outline',
            CartTab: focused ? 'cart' : 'cart-outline',
            OrdersTab: focused ? 'clipboard-text' : 'clipboard-text-outline',
            ProfileTab: focused ? 'account-circle' : 'account-circle-outline',
          };
          return (
            <View style={{
              width: isTablet ? 38 : 34,
              height: isTablet ? 32 : 30,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: focused ? c.primary + '1A' : 'transparent',
            }}>
              <MaterialCommunityIcons name={icons[route.name]} size={22} color={color} />
            </View>
          );
        },
        tabBarBadge: route.name === 'CartTab' && cartCount > 0 ? cartCount : undefined,
        tabBarBadgeStyle: {
          backgroundColor: c.error,
          color: '#FFF',
          fontSize: 10,
          fontWeight: '700',
          minWidth: 18,
          height: 18,
          lineHeight: 18,
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: t.home }} />
      <Tab.Screen name="ShopTab" component={ShopStack} options={{ tabBarLabel: t.shop }} />
      <Tab.Screen name="CartTab" component={CartStack} options={{ tabBarLabel: t.cart }} />
      <Tab.Screen name="OrdersTab" component={OrdersStack} options={{ tabBarLabel: t.orders }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: t.profile }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { loading } = useAuth();
  const c = theme.colors;
  const isTablet = width >= 768;

  const navTheme = {
    ...(theme.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.dark ? DarkTheme.colors : DefaultTheme.colors),
      primary: c.primary,
      background: c.background,
      card: c.card,
      text: c.text,
      border: c.border,
    },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, justifyContent: 'center', alignItems: 'center' }}>
        <BrandLogo variant="symbol" size={96} />
        <BrandLogo width={172} style={{ marginTop: 18 }} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={noHeader}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Auth"
          component={AuthStack}
          options={{
            presentation: Platform.OS === 'ios' ? 'fullScreenModal' : 'modal',
            animation: Platform.OS === 'ios' && isTablet ? 'slide_from_bottom' : 'default',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
