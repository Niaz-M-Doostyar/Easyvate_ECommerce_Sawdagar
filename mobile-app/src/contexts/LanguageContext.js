import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

const LanguageContext = createContext();
const LANG_KEY = 'sawdagar_lang';

const LANGS = {
  en: { label: 'English', dir: 'ltr', flag: '🇺🇸' },
  ps: { label: 'پښتو', dir: 'rtl', flag: '🇦🇫' },
  dr: { label: 'دری', dir: 'rtl', flag: '🇦🇫' },
};

const translations = {
  en: {
    home: 'Home', shop: 'Shop', cart: 'Cart', orders: 'Orders', profile: 'Profile',
    login: 'Login', register: 'Register', logout: 'Logout',
    deleteAccount: 'Delete Account',
    deleteAccountTitle: 'Delete your account?',
    deleteAccountWarning: 'This will permanently remove your account and cannot be undone.',
    deleteAccountConfirm: 'Your account will be deleted permanently. Do you want to continue?',
    accountDeleted: 'Account deleted successfully',
    deleteAccountFailed: 'Failed to delete account',
    deleting: 'Deleting...',
    email: 'Email', password: 'Password', fullName: 'Full Name', phone: 'Phone',
    search: 'Search products...', addToCart: 'Add to Cart', buyNow: 'Buy Now',
    checkout: 'Checkout', placeOrder: 'Place Order', total: 'Total', subtotal: 'Subtotal',
    province: 'Province', district: 'District', village: 'Village', landmark: 'Landmark',
    orderNumber: 'Order #', status: 'Status', pending: 'Pending', confirmed: 'Confirmed',
    shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
    editProfile: 'Edit Profile', changePassword: 'Change Password', settings: 'Settings',
    language: 'Language', theme: 'Theme', about: 'About', contact: 'Contact',
    blog: 'Blog', wishlist: 'Wishlist', notifications: 'Notifications',
    supplier: 'Supplier', delivery: 'Delivery', admin: 'Admin',
    myProducts: 'My Products', myOrders: 'My Orders', sponsorships: 'Sponsorships',
    forgotPassword: 'Forgot Password?', resetPassword: 'Reset Password',
    noResults: 'No results found', emptyCart: 'Your cart is empty',
    startShopping: 'Start Shopping', viewAll: 'View All', seeAll: 'See All',
    categories: 'Categories', trending: 'Trending', featured: 'Featured',
    sponsored: 'Sponsored', dealOfWeek: 'Deal of the Week', newArrivals: 'New Arrivals',
    description: 'Description', details: 'Details', reviews: 'Reviews',
    relatedProducts: 'Related Products', inStock: 'In Stock', outOfStock: 'Out of Stock',
    qty: 'Qty', remove: 'Remove', clear: 'Clear', apply: 'Apply',
    couponCode: 'Coupon Code', deliveryAddress: 'Delivery Address', paymentMethod: 'Payment Method',
    cashOnDelivery: 'Cash on Delivery', orderSummary: 'Order Summary',
    currentPassword: 'Current Password', newPassword: 'New Password',
    confirmPassword: 'Confirm Password', save: 'Save', cancel: 'Cancel',
    all: 'All', filter: 'Filter', sort: 'Sort', price: 'Price',
    lowToHigh: 'Low to High', highToLow: 'High to Low', newest: 'Newest',
    readMore: 'Read More', subscribe: 'Subscribe', newsletter: 'Newsletter',
    companyName: 'Company Name', role: 'Role', customer: 'Customer',
    sendResetLink: 'Send Reset Link', createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?', dontHaveAccount: "Don't have an account?",
    welcomeBack: 'Welcome Back', createYourAccount: 'Create Your Account',
    registrationSuccessTitle: 'Registration Successful',
    registrationVerifyMessageCustomer: 'Your customer account has been created. Please verify your email first, then log in.',
    registrationVerifyMessageSupplier: 'Your supplier account has been created. Please verify your email first. After verification, wait for admin approval before logging in.',
    orderPlaced: 'Order placed successfully!', orderDetails: 'Order Details',
    trackOrder: 'Track Order', items: 'Items', deliveryFee: 'Delivery Fee',
    markShipped: 'Mark as Shipped', markDelivered: 'Mark as Delivered',
    shareLocation: 'Share Location', assignedOrders: 'Assigned Orders',
    addProduct: 'Add Product', editProduct: 'Edit Product',
    approved: 'Approved', rejected: 'Rejected',
    notes: 'Notes', optional: 'Optional',
  },
  ps: {
    home: 'کور', shop: 'پلورنځی', cart: 'کارټ', orders: 'سفارښتونه', profile: 'پروفایل',
    login: 'ننوتل', register: 'نوم لیکنه', logout: 'وتل',
    deleteAccount: 'حساب ړنګول',
    deleteAccountTitle: 'خپل حساب ړنګوئ؟',
    deleteAccountWarning: 'دا به ستاسو حساب دایمي ړنګ کړي او بېرته نه راګرځي.',
    deleteAccountConfirm: 'ستاسو حساب به په بشپړ ډول ړنګ شي. دوام ورکوئ؟',
    accountDeleted: 'حساب په بریالیتوب ړنګ شو',
    deleteAccountFailed: 'د حساب ړنګول ناکام شول',
    deleting: 'ړنګېږي...',
    email: 'بریښنالیک', password: 'پاسورډ', fullName: 'بشپړ نوم', phone: 'تلیفون',
    search: 'محصولات لټول...', addToCart: 'کارټ ته اضافه کړئ', buyNow: 'اوس واخلئ',
    checkout: 'تادیه', placeOrder: 'سفارښت ورکړئ', total: 'ټول', subtotal: 'فرعي ټول',
    province: 'ولایت', district: 'ولسوالي', village: 'کلی', landmark: 'نښه',
    orderNumber: 'د سفارښت نمبر', status: 'حالت', pending: 'پاتې', confirmed: 'تایید شوی',
    shipped: 'لیږل شوی', delivered: 'تحویل شوی', cancelled: 'لغوه شوی',
    editProfile: 'پروفایل سمول', changePassword: 'پاسورډ بدلول', settings: 'تنظیمات',
    language: 'ژبه', theme: 'تم', about: 'په اړه', contact: 'اړیکه',
    blog: 'بلاګ', wishlist: 'خوښې', notifications: 'خبرتیاوې',
    supplier: 'عرضه کوونکی', delivery: 'تحویلي', admin: 'اډمین',
    myProducts: 'زما محصولات', myOrders: 'زما سفارښتونه', sponsorships: 'سپانسرشپ',
    forgotPassword: 'پاسورډ مو هیر شوی؟', resetPassword: 'پاسورډ بیا ترتیب کړئ',
    noResults: 'پایلې ونه موندل شوې', emptyCart: 'ستاسو کارټ خالي دی',
    startShopping: 'پیرود پیل کړئ', viewAll: 'ټول وګورئ', seeAll: 'ټول',
    categories: 'کټګورۍ', trending: 'ترنډینګ', featured: 'ځانګړي',
    sponsored: 'سپانسر شوي', dealOfWeek: 'د اونۍ تخفیف', newArrivals: 'نوي',
    description: 'توضیحات', details: 'جزئیات', reviews: 'بیاکتنې',
    relatedProducts: 'اړوند محصولات', inStock: 'شتون لري', outOfStock: 'نشته',
    qty: 'تعداد', remove: 'لرې کول', clear: 'پاکول', apply: 'پلي کول',
    couponCode: 'د کوپن کوډ', deliveryAddress: 'د تحویلي پته', paymentMethod: 'د تادیې طریقه',
    cashOnDelivery: 'نغدي تادیه', orderSummary: 'د سفارښت لنډیز',
    currentPassword: 'اوسنی پاسورډ', newPassword: 'نوی پاسورډ',
    confirmPassword: 'پاسورډ تایید', save: 'خوندي',  cancel: 'لغوه',
    all: 'ټول', filter: 'فلټر', sort: 'ترتیب', price: 'قیمت',
    lowToHigh: 'ټیټ نه لوړ', highToLow: 'لوړ نه ټیټ', newest: 'نوي',
    readMore: 'نور ولولئ', subscribe: 'ګډون', newsletter: 'خبرپاڼه',
    companyName: 'د شرکت نوم', role: 'رول', customer: 'پیرودونکی',
    sendResetLink: 'لینک واستوئ', createAccount: 'حساب جوړ کړئ',
    alreadyHaveAccount: 'حساب لرئ؟', dontHaveAccount: 'حساب نه لرئ؟',
    welcomeBack: 'بیرته ښه راغلاست', createYourAccount: 'خپل حساب جوړ کړئ',
    registrationSuccessTitle: 'نوم لیکنه بریالۍ شوه',
    registrationVerifyMessageCustomer: 'ستاسو د پېرودونکي حساب جوړ شو. مهرباني وکړئ لومړی خپل برېښنالیک تایید کړئ، بیا ننوتل وکړئ.',
    registrationVerifyMessageSupplier: 'ستاسو د عرضه کوونکي حساب جوړ شو. مهرباني وکړئ لومړی خپل برېښنالیک تایید کړئ. له تایید وروسته د اډمین منظورۍ ته هم انتظار وکړئ.',
    orderPlaced: 'سفارښت بریالی و!', orderDetails: 'د سفارښت جزئیات',
    trackOrder: 'سفارښت تعقیب', items: 'توکي', deliveryFee: 'د تحویلي فیس',
    markShipped: 'لیږل شوی', markDelivered: 'تحویل شوی',
    shareLocation: 'موقعیت شریک', assignedOrders: 'ټاکل شوي سفارښتونه',
    addProduct: 'محصول اضافه', editProduct: 'محصول سمول',
    approved: 'تایید شوی', rejected: 'رد شوی',
    notes: 'یادونه', optional: 'اختیاري',
  },
  dr: {
    home: 'خانه', shop: 'فروشگاه', cart: 'سبد', orders: 'سفارشات', profile: 'پروفایل',
    login: 'ورود', register: 'ثبت نام', logout: 'خروج',
    deleteAccount: 'حذف حساب',
    deleteAccountTitle: 'حساب تان حذف شود؟',
    deleteAccountWarning: 'این کار حساب شما را برای همیشه حذف می کند و قابل برگشت نیست.',
    deleteAccountConfirm: 'حساب شما به صورت دائمی حذف می شود. ادامه می دهید؟',
    accountDeleted: 'حساب با موفقیت حذف شد',
    deleteAccountFailed: 'حذف حساب ناموفق بود',
    deleting: 'در حال حذف...',
    email: 'ایمیل', password: 'رمز عبور', fullName: 'نام کامل', phone: 'تلفن',
    search: 'جستجوی محصولات...', addToCart: 'افزودن به سبد', buyNow: 'خرید فوری',
    checkout: 'تسویه', placeOrder: 'ثبت سفارش', total: 'مجموع', subtotal: 'جمع فرعی',
    province: 'ولایت', district: 'ناحیه', village: 'قریه', landmark: 'نشانی',
    orderNumber: 'شماره سفارش', status: 'وضعیت', pending: 'در انتظار', confirmed: 'تایید شده',
    shipped: 'ارسال شده', delivered: 'تحویل داده شده', cancelled: 'لغو شده',
    editProfile: 'ویرایش پروفایل', changePassword: 'تغییر رمز', settings: 'تنظیمات',
    language: 'زبان', theme: 'تم', about: 'درباره', contact: 'تماس',
    blog: 'بلاگ', wishlist: 'علاقه‌مندی‌ها', notifications: 'اعلانات',
    supplier: 'تامین کننده', delivery: 'تحویل', admin: 'مدیر',
    myProducts: 'محصولات من', myOrders: 'سفارشات من', sponsorships: 'حمایت مالی',
    forgotPassword: 'رمز را فراموش کردید؟', resetPassword: 'بازنشانی رمز',
    noResults: 'نتیجه‌ای یافت نشد', emptyCart: 'سبد خرید شما خالی است',
    startShopping: 'شروع خرید', viewAll: 'مشاهده همه', seeAll: 'همه',
    categories: 'دسته‌بندی‌ها', trending: 'پرطرفدار', featured: 'ویژه',
    sponsored: 'حمایت شده', dealOfWeek: 'تخفیف هفته', newArrivals: 'تازه‌ها',
    description: 'توضیحات', details: 'جزئیات', reviews: 'نظرات',
    relatedProducts: 'محصولات مرتبط', inStock: 'موجود', outOfStock: 'ناموجود',
    qty: 'تعداد', remove: 'حذف', clear: 'پاک کردن', apply: 'اعمال',
    couponCode: 'کد تخفیف', deliveryAddress: 'آدرس تحویل', paymentMethod: 'روش پرداخت',
    cashOnDelivery: 'پرداخت نقدی', orderSummary: 'خلاصه سفارش',
    currentPassword: 'رمز فعلی', newPassword: 'رمز جدید',
    confirmPassword: 'تایید رمز', save: 'ذخیره', cancel: 'لغو',
    all: 'همه', filter: 'فیلتر', sort: 'مرتب‌سازی', price: 'قیمت',
    lowToHigh: 'کم به زیاد', highToLow: 'زیاد به کم', newest: 'جدیدترین',
    readMore: 'بیشتر بخوانید', subscribe: 'اشتراک', newsletter: 'خبرنامه',
    companyName: 'نام شرکت', role: 'نقش', customer: 'مشتری',
    sendResetLink: 'ارسال لینک', createAccount: 'ایجاد حساب',
    alreadyHaveAccount: 'حساب دارید؟', dontHaveAccount: 'حساب ندارید؟',
    welcomeBack: 'خوش آمدید', createYourAccount: 'حساب خود را بسازید',
    registrationSuccessTitle: 'ثبت نام موفق بود',
    registrationVerifyMessageCustomer: 'حساب مشتری شما ساخته شد. لطفا ابتدا ایمیل خود را تایید کنید و سپس وارد شوید.',
    registrationVerifyMessageSupplier: 'حساب تامین‌کننده شما ساخته شد. لطفا ابتدا ایمیل خود را تایید کنید. پس از تایید، برای ورود باید منتظر تایید مدیر نیز بمانید.',
    orderPlaced: 'سفارش با موفقیت ثبت شد!', orderDetails: 'جزئیات سفارش',
    trackOrder: 'پیگیری سفارش', items: 'اقلام', deliveryFee: 'هزینه تحویل',
    markShipped: 'ارسال شده', markDelivered: 'تحویل شده',
    shareLocation: 'اشتراک موقعیت', assignedOrders: 'سفارشات تعیین شده',
    addProduct: 'افزودن محصول', editProduct: 'ویرایش محصول',
    approved: 'تایید شده', rejected: 'رد شده',
    notes: 'یادداشت', optional: 'اختیاری',
  },
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en');
  const isRTL = LANGS[lang]?.dir === 'rtl';
  const t = translations[lang] || translations.en;

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(LANG_KEY);
      if (saved && LANGS[saved]) setLangState(saved);
    })();
  }, []);

  const setLang = async (l) => {
    if (!LANGS[l]) return;
    setLangState(l);
    await AsyncStorage.setItem(LANG_KEY, l);
    I18nManager.forceRTL(LANGS[l].dir === 'rtl');
  };

  const getName = (obj, field = 'name') => {
    if (!obj) return '';
    if (lang === 'ps' && obj[field + 'Ps']) return obj[field + 'Ps'];
    if (lang === 'dr' && obj[field + 'Dr']) return obj[field + 'Dr'];
    return obj[field + 'En'] || obj[field] || '';
  };

  const getDesc = (obj) => getName(obj, 'desc');

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL, langs: LANGS, getName, getDesc }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
  return ctx;
}
