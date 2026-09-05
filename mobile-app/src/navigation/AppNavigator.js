import React from 'react';
import { View, Platform, useWindowDimensions } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BrandLogo from '../components/BrandLogo';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { fontSize, fontWeight } from '../theme';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import HomeScreen from '../screens/home/HomeScreen';
import ProductsScreen from '../screens/products/ProductsScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import SearchScreen from '../screens/products/SearchScreen';
import CategoriesScreen from '../screens/products/CategoriesScreen';
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

// Deep links: https://sawdagaraf.com/products/<id> and sawdagar://products/<id>
// open the app directly on that product's detail screen.
const linking = {
  prefixes: ['https://sawdagaraf.com', 'https://www.sawdagaraf.com', 'sawdagar://'],
  config: {
    screens: {
      Main: {
        screens: {
          ShopTab: {
            screens: {
              ProductDetail: 'products/:id',
            },
          },
        },
      },
    },
  },
};

const noHeader = { headerShown: false };
function hideTabBar(Component) {
  return Component;
}

const HiddenProductsScreen = hideTabBar(ProductsScreen);
const HiddenProductDetailScreen = hideTabBar(ProductDetailScreen);
const HiddenSearchScreen = hideTabBar(SearchScreen);
const HiddenBlogScreen = hideTabBar(BlogScreen);
const HiddenBlogDetailScreen = hideTabBar(BlogDetailScreen);
const HiddenContactScreen = hideTabBar(ContactScreen);
const HiddenAboutScreen = hideTabBar(AboutScreen);
const HiddenPrivacyPolicyScreen = hideTabBar(PrivacyPolicyScreen);
const HiddenCheckoutScreen = hideTabBar(CheckoutScreen);
const HiddenOrderSuccessScreen = hideTabBar(OrderSuccessScreen);
const HiddenOrderDetailScreen = hideTabBar(OrderDetailScreen);
const HiddenEditProfileScreen = hideTabBar(EditProfileScreen);
const HiddenChangePasswordScreen = hideTabBar(ChangePasswordScreen);
const HiddenSettingsScreen = hideTabBar(SettingsScreen);
const HiddenSupplierProductsScreen = hideTabBar(SupplierProductsScreen);
const HiddenSupplierAddProductScreen = hideTabBar(SupplierAddProductScreen);
const HiddenSupplierOrdersScreen = hideTabBar(SupplierOrdersScreen);
const HiddenSupplierSponsorshipsScreen = hideTabBar(SupplierSponsorshipsScreen);
const HiddenDeliveryOrdersScreen = hideTabBar(DeliveryOrdersScreen);

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Products" component={HiddenProductsScreen} />
      <Stack.Screen name="ProductDetail" component={HiddenProductDetailScreen} />
      <Stack.Screen name="Search" component={HiddenSearchScreen} />
      <Stack.Screen name="Blog" component={HiddenBlogScreen} />
      <Stack.Screen name="BlogDetail" component={HiddenBlogDetailScreen} />
      <Stack.Screen name="Contact" component={HiddenContactScreen} />
      <Stack.Screen name="About" component={HiddenAboutScreen} />
      <Stack.Screen name="PrivacyPolicy" component={HiddenPrivacyPolicyScreen} />
    </Stack.Navigator>
  );
}

function ShopStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="Products" component={ProductsScreen} />
      <Stack.Screen name="ProductDetail" component={HiddenProductDetailScreen} />
      <Stack.Screen name="Search" component={HiddenSearchScreen} />
    </Stack.Navigator>
  );
}

function CategoriesStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="Products" component={HiddenProductsScreen} />
      <Stack.Screen name="ProductDetail" component={HiddenProductDetailScreen} />
      <Stack.Screen name="Search" component={HiddenSearchScreen} />
    </Stack.Navigator>
  );
}

function CartStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={HiddenCheckoutScreen} />
      <Stack.Screen name="OrderSuccess" component={HiddenOrderSuccessScreen} />
      <Stack.Screen name="OrderDetail" component={HiddenOrderDetailScreen} />
      <Stack.Screen name="ProductDetail" component={HiddenProductDetailScreen} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={HiddenOrderDetailScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={HiddenEditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={HiddenChangePasswordScreen} />
      <Stack.Screen name="Settings" component={HiddenSettingsScreen} />
      <Stack.Screen name="Blog" component={HiddenBlogScreen} />
      <Stack.Screen name="BlogDetail" component={HiddenBlogDetailScreen} />
      <Stack.Screen name="Contact" component={HiddenContactScreen} />
      <Stack.Screen name="About" component={HiddenAboutScreen} />
      <Stack.Screen name="PrivacyPolicy" component={HiddenPrivacyPolicyScreen} />
      <Stack.Screen name="SupplierProducts" component={HiddenSupplierProductsScreen} />
      <Stack.Screen name="SupplierAddProduct" component={HiddenSupplierAddProductScreen} />
      <Stack.Screen name="SupplierOrders" component={HiddenSupplierOrdersScreen} />
      <Stack.Screen name="SupplierSponsorships" component={HiddenSupplierSponsorshipsScreen} />
      <Stack.Screen name="DeliveryOrders" component={HiddenDeliveryOrdersScreen} />
      <Stack.Screen name="OrderDetail" component={HiddenOrderDetailScreen} />
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
  const rootRouteByTab = {
    HomeTab: 'Home',
    ShopTab: 'Products',
    CategoriesTab: 'Categories',
    CartTab: 'Cart',
    OrdersTab: 'Orders',
    ProfileTab: 'Profile',
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const focusedRouteName = getFocusedRouteNameFromRoute(route);
        const hideBar = Boolean(focusedRouteName && focusedRouteName !== rootRouteByTab[route.name]);

        return ({
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarStyle: hideBar ? { display: 'none' } : {
          backgroundColor: c.surfaceElevated,
          borderColor: c.border,
          borderWidth: 1,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 8,
          marginHorizontal: isTablet ? 12 : 6,
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
          minWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: isTablet ? 12 : 9,
          fontWeight: fontWeight.semibold,
          letterSpacing: isTablet ? 0 : -0.45,
          marginTop: 1,
        },
        tabBarAllowFontScaling: false,
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            HomeTab: focused ? 'home-variant' : 'home-variant-outline',
            ShopTab: focused ? 'view-grid' : 'view-grid-outline',
            CategoriesTab: focused ? 'shape' : 'shape-outline',
            CartTab: focused ? 'cart' : 'cart-outline',
            OrdersTab: focused ? 'clipboard-text' : 'clipboard-text-outline',
            ProfileTab: focused ? 'account-circle' : 'account-circle-outline',
          };
          return (
            <View style={{
              width: isTablet ? 38 : 30,
              height: isTablet ? 32 : 30,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: focused ? c.primary + '1A' : 'transparent',
            }}>
              <MaterialCommunityIcons name={icons[route.name]} size={isTablet ? 22 : 20} color={color} />
            </View>
          );
        },
        tabBarBadge: route.name === 'CartTab' && cartCount > 0 ? cartCount : undefined,
        tabBarBadgeStyle: {
          backgroundColor: c.error,
          color: c.white,
          fontSize: fontSize.xs,
          fontWeight: fontWeight.bold,
          minWidth: 20,
          paddingHorizontal: 5,
        },
        });
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: t.home }} />
      <Tab.Screen name="ShopTab" component={ShopStack} options={{ tabBarLabel: t.shop }} />
      <Tab.Screen name="CategoriesTab" component={CategoriesStack} options={{ tabBarLabel: t.categories || 'Categories' }} />
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
    <NavigationContainer theme={navTheme} linking={linking}>
      <Stack.Navigator screenOptions={noHeader}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Auth"
          component={AuthStack}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
