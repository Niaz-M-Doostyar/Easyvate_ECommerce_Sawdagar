import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BrandLogo from '../components/BrandLogo';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { fontWeight } from '../theme';

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
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { count: cartCount } = useCart();
  const c = theme.colors;
  const isTablet = width >= 768;
  const tabBarWidth = isTablet ? Math.min(width - 48, 720) : undefined;
  const tabBarHeight = isTablet ? 76 : 72;
  const tabBarMarginBottom = Math.max(insets.bottom, 10);
  const rootRouteByTab = {
    HomeTab: 'Home',
    ShopTab: 'Products',
    CategoriesTab: 'Categories',
    CartTab: 'Cart',
    OrdersTab: 'Orders',
    ProfileTab: 'Profile',
  };
  const labelByTab = {
    HomeTab: t.home,
    ShopTab: t.shop,
    CategoriesTab: t.categories || 'Categories',
    CartTab: t.cart,
    OrdersTab: t.orders,
    ProfileTab: t.profile,
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const focusedRouteName = getFocusedRouteNameFromRoute(route);
        const hideBar = Boolean(focusedRouteName && focusedRouteName !== rootRouteByTab[route.name]);

        return ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: 'below-icon',
        tabBarAccessibilityLabel: labelByTab[route.name],
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarStyle: hideBar ? { display: 'none' } : {
          backgroundColor: c.tabBar,
          borderColor: c.borderLight,
          borderWidth: 1,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: 8,
          paddingTop: 8,
          marginHorizontal: isTablet ? 24 : 12,
          marginBottom: tabBarMarginBottom,
          borderRadius: 26,
          width: tabBarWidth,
          alignSelf: isTablet ? 'center' : undefined,
          shadowColor: c.black,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: theme.dark ? 0.24 : 0.09,
          shadowRadius: 18,
          elevation: 8,
        },
        tabBarItemStyle: {
          paddingTop: 0,
          minWidth: 0,
          minHeight: 48,
        },
        tabBarIconStyle: { width: isTablet ? 52 : 42, height: 32 },
        tabBarLabel: ({ focused, color }) => (
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            maxFontSizeMultiplier={1.2}
            style={{ fontSize: isTablet ? 12 : 10, lineHeight: isTablet ? 17 : 15, fontWeight: focused ? fontWeight.bold : fontWeight.medium, textAlign: 'center', marginTop: 3, color }}
          >
            {labelByTab[route.name]}
          </Text>
        ),
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
              width: isTablet ? 52 : 42,
              height: 32,
              borderRadius: 14,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: focused ? c.brandSurfaceStrong : 'transparent',
            }}>
              <MaterialCommunityIcons name={icons[route.name]} size={23} color={color} />
            </View>
          );
        },
        tabBarBadge: route.name === 'CartTab' && cartCount > 0 ? (cartCount > 99 ? '99+' : cartCount) : undefined,
        tabBarBadgeStyle: {
          backgroundColor: theme.dark ? c.primaryDark : c.primary,
          color: c.white,
          fontSize: 10,
          fontWeight: fontWeight.bold,
          minWidth: 18,
          height: 18,
          lineHeight: 16,
          borderWidth: 2,
          borderColor: c.tabBar,
          paddingHorizontal: 3,
        },
        });
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: t.home }} />
      <Tab.Screen name="ShopTab" component={ShopStack} options={{ title: t.shop }} />
      <Tab.Screen name="CategoriesTab" component={CategoriesStack} options={{ title: t.categories || 'Categories' }} />
      <Tab.Screen name="CartTab" component={CartStack} options={{ title: t.cart }} />
      <Tab.Screen name="OrdersTab" component={OrdersStack} options={{ title: t.orders }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: t.profile }} />
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
