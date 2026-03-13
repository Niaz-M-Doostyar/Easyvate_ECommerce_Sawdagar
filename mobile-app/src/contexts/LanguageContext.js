import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const en = {
  site_name: "Sawdagar", home: "Home", products: "Products", categories: "Categories",
  search: "Search", search_placeholder: "Search products...", cart: "Cart", login: "Login",
  register: "Register", logout: "Logout", dashboard: "Dashboard", profile: "Profile",
  orders: "Orders", my_orders: "My Orders", order_history: "Order History", settings: "Settings",
  email: "Email", password: "Password", confirm_password: "Confirm Password", full_name: "Full Name",
  phone: "Phone Number", province: "Province", district: "District", village: "Village / Street",
  landmark: "Landmark", company_name: "Company Name", submit: "Submit", save: "Save",
  cancel: "Cancel", delete: "Delete", edit: "Edit", view: "View", pending: "Pending",
  approved: "Approved", rejected: "Rejected", add_to_cart: "Add to Cart", remove_from_cart: "Remove",
  checkout: "Checkout", place_order: "Place Order", order_total: "Order Total", subtotal: "Subtotal",
  quantity: "Quantity", price: "Price", retail_price: "Retail Price", stock: "Stock",
  in_stock: "In Stock", out_of_stock: "Out of Stock", product_name: "Product Name",
  description: "Description", category: "Category", sponsored: "Sponsored",
  sponsored_products: "Sponsored Products", new_arrivals: "New Arrivals",
  featured_categories: "Featured Categories", cash_on_delivery: "Cash on Delivery",
  cod_note: "Payment is collected in cash upon delivery.",
  delivery_address: "Delivery Address", order_placed: "Order placed successfully!",
  order_number: "Order Number", order_status: "Order Status", order_confirmed: "Confirmed",
  order_shipped: "Shipped", order_delivered: "Delivered", order_cancelled: "Cancelled",
  payment_status: "Payment Status", paid: "Paid", unpaid: "Unpaid", track_order: "Track Order",
  total_orders: "Total Orders", loading: "Loading...", error: "An error occurred",
  success: "Success", welcome: "Welcome to Sawdagar",
  hero_subtitle: "Afghanistan's Premier E-Commerce Platform",
  shop_now: "Shop Now", about: "About", contact: "Contact", about_us: "About Us",
  contact_us: "Contact Us", forgot_password: "Forgot Password?", reset_password: "Reset Password",
  new_password: "New Password", current_password: "Current Password", change_password: "Change Password",
  register_as_customer: "Register as Customer", register_as_supplier: "Register as Supplier",
  already_have_account: "Already have an account?", dont_have_account: "Don't have an account?",
  view_all: "View All", back: "Back", english: "English", pashto: "پښتو", dari: "دری",
  select_language: "Select Language", cart_empty: "Your Cart is Empty",
  cart_empty_desc: "Looks like you haven't added anything to your cart yet",
  start_shopping: "Start Shopping", clear_cart: "Clear Cart", continue_shopping: "Continue Shopping",
  cart_summary: "Cart Summary", shipping: "Shipping", free: "Free", total: "Total",
  please_sign_in: "Please Sign In", sign_in: "Sign In", browse_products: "Browse Products",
  order_notes: "Order Notes", optional: "Optional", payment_method: "Payment Method",
  cod: "Cash on Delivery (COD)", cod_desc: "Pay when you receive your order",
  order_summary: "Order Summary", qty: "Qty", placing_order: "Placing Order...",
  all: "All", confirmed: "Confirmed", shipped: "Shipped", cancelled: "Cancelled",
  date: "Date", items: "Items", status: "Status", view_details: "View Details",
  order_details: "Order Details", order_items: "Order Items", product: "Product",
  product_details: "Product Details", product_not_found: "Product Not Found",
  adding: "Adding...", added_to_cart: "Added to cart!", free_delivery: "Free Delivery",
  details: "Details", seller: "Seller", related_products: "Related Products",
  all_categories: "All Categories", no_products_found: "No Products Found",
  no_orders: "No orders yet", amount: "Amount", customer: "Customer", supplier: "Supplier",
  name: "Name", no_data: "No data", sponsorships: "Sponsorships",
};

const ps = {
  site_name: "سوداګر", home: "کور", products: "محصولات", categories: "کټګورۍ",
  search: "لټون", search_placeholder: "محصولات ولټوئ...", cart: "کارټ", login: "ننوتل",
  register: "راجستر", logout: "وتل", dashboard: "ډشبورډ", profile: "پروفایل",
  orders: "امرونه", my_orders: "زما امرونه", order_history: "د امرونو تاریخ", settings: "تنظیمات",
  email: "بریښنالیک", password: "پټنوم", confirm_password: "پټنوم تایید", full_name: "بشپړ نوم",
  phone: "تلیفون شمیره", province: "ولایت", district: "ولسوالي", village: "کلی / سړک",
  landmark: "نښه", company_name: "د شرکت نوم", submit: "سپارل", save: "خوندي کول",
  cancel: "لغوه", delete: "حذف", edit: "سمول", view: "لیدل", pending: "په تمه",
  approved: "تایید شوی", rejected: "رد شوی", add_to_cart: "کارټ ته اضافه", remove_from_cart: "لرې کول",
  checkout: "چک اوټ", place_order: "امر ورکول", order_total: "ټول مبلغ", subtotal: "فرعي مجموعه",
  quantity: "مقدار", price: "قیمت", retail_price: "پرچون قیمت", stock: "ذخیره",
  in_stock: "شتون لري", out_of_stock: "نه شته", product_name: "د محصول نوم",
  description: "تفصیل", category: "کټګوري", sponsored: "سپانسر شوی",
  sponsored_products: "سپانسر شوي محصولات", new_arrivals: "نوي محصولات",
  featured_categories: "ځانګړې کټګورۍ", cash_on_delivery: "نغدي تحویلي",
  cod_note: "تادیه د تحویلي پر مهال په نغدو کیږي.",
  delivery_address: "د تحویلي پته", order_placed: "امر په بریالیتوب ثبت شو!",
  order_number: "د امر شمیره", order_status: "د امر حالت", order_confirmed: "تایید شوی",
  order_shipped: "لیږل شوی", order_delivered: "تحویل شوی", order_cancelled: "لغوه شوی",
  payment_status: "د تادیې حالت", paid: "تادیه شوی", unpaid: "تادیه نشوی",
  track_order: "امر تعقیب", total_orders: "ټول امرونه", loading: "لوډیږي...",
  error: "ستونزه رامنځته شوه", success: "بریالیتوب", welcome: "سوداګر ته ښه راغلاست",
  hero_subtitle: "د افغانستان لومړی برېښنایي سوداګریز پلاتفورم",
  shop_now: "اوس خریداري", about: "په اړه", contact: "اړیکه", about_us: "زموږ په اړه",
  contact_us: "موږ سره اړیکه", forgot_password: "پټنوم مو هیر شوی؟", reset_password: "پټنوم بیرته",
  new_password: "نوی پټنوم", current_password: "اوسنی پټنوم", change_password: "پټنوم بدلول",
  register_as_customer: "د پیرودونکي ثبت", register_as_supplier: "د عرضه کونکي ثبت",
  already_have_account: "حساب لرئ؟", dont_have_account: "حساب نلرئ؟",
  view_all: "ټول وګورئ", back: "شاته", english: "English", pashto: "پښتو", dari: "دری",
  select_language: "ژبه غوره کړئ", cart_empty: "ستاسو کارټ خالي دی",
  cart_empty_desc: "داسې بریښي چې تاسو لا کارټ ته هیڅ ندي اضافه کړي",
  start_shopping: "خریداري پیل کړئ", clear_cart: "کارټ پاک کړئ",
  continue_shopping: "خریداري ته دوام ورکړئ", cart_summary: "د کارټ لنډیز",
  shipping: "لیږدول", free: "وړیا", total: "ټول",
  please_sign_in: "مهرباني وکړئ ننوځئ", sign_in: "ننوتل",
  browse_products: "محصولات وګورئ", order_notes: "د امر یادونې",
  optional: "اختیاري", payment_method: "د تادیې طریقه",
  cod: "نغدي تحویلي (COD)", cod_desc: "کله چې امر ترلاسه کړئ تادیه وکړئ",
  order_summary: "د امر لنډیز", qty: "مقدار", placing_order: "امر ثبتیږي...",
  all: "ټول", confirmed: "تایید شوی", shipped: "لیږل شوی", cancelled: "لغوه شوی",
  date: "نیټه", items: "توکي", status: "حالت", view_details: "تفصیلات",
  order_details: "د امر تفصیلات", order_items: "د امر توکي", product: "محصول",
  product_details: "د محصول تفصیلات", product_not_found: "محصول ونه موندل شو",
  adding: "اضافه کیږي...", added_to_cart: "کارټ ته اضافه شو!",
  free_delivery: "وړیا لیږدول", details: "تفصیلات", seller: "پلورونکی",
  related_products: "اړوند محصولات", all_categories: "ټولې کټګورۍ",
  no_products_found: "محصول ونه موندل شو", no_orders: "لا امر نشته",
  amount: "مبلغ", customer: "پیرودونکی", supplier: "عرضه کونکی", name: "نوم",
  no_data: "معلومات نشته", sponsorships: "سپانسرشپ",
};

const dr = {
  site_name: "سوداگر", home: "خانه", products: "محصولات", categories: "دسته‌بندی‌ها",
  search: "جستجو", search_placeholder: "محصولات را جستجو کنید...", cart: "سبد", login: "ورود",
  register: "ثبت نام", logout: "خروج", dashboard: "داشبورد", profile: "پروفایل",
  orders: "سفارشات", my_orders: "سفارشات من", order_history: "تاریخچه سفارشات",
  settings: "تنظیمات", email: "ایمیل", password: "رمز عبور", confirm_password: "تأیید رمز",
  full_name: "نام کامل", phone: "شماره تلفن", province: "ولایت", district: "ولسوالی",
  village: "قریه / سرک", landmark: "نشانی", company_name: "نام شرکت", submit: "ارسال",
  save: "ذخیره", cancel: "لغو", delete: "حذف", edit: "ویرایش", view: "مشاهده",
  pending: "در انتظار", approved: "تأیید شده", rejected: "رد شده",
  add_to_cart: "افزودن به سبد", remove_from_cart: "حذف", checkout: "پرداخت",
  place_order: "ثبت سفارش", order_total: "مبلغ کل", subtotal: "جمع فرعی",
  quantity: "تعداد", price: "قیمت", retail_price: "قیمت خرده", stock: "موجودی",
  in_stock: "موجود", out_of_stock: "ناموجود", product_name: "نام محصول",
  description: "توضیحات", category: "دسته‌بندی", sponsored: "حمایت شده",
  sponsored_products: "محصولات حمایت شده", new_arrivals: "محصولات جدید",
  featured_categories: "دسته‌بندی‌های ویژه", cash_on_delivery: "پرداخت نقدی",
  cod_note: "پرداخت هنگام تحویل به صورت نقدی انجام می‌شود.",
  delivery_address: "آدرس تحویل", order_placed: "سفارش با موفقیت ثبت شد!",
  order_number: "شماره سفارش", order_status: "وضعیت سفارش", order_confirmed: "تأیید شده",
  order_shipped: "ارسال شده", order_delivered: "تحویل داده شده", order_cancelled: "لغو شده",
  payment_status: "وضعیت پرداخت", paid: "پرداخت شده", unpaid: "پرداخت نشده",
  track_order: "پیگیری سفارش", total_orders: "کل سفارشات", loading: "در حال بارگذاری...",
  error: "خطایی رخ داد", success: "موفق", welcome: "به سوداگر خوش آمدید",
  hero_subtitle: "نخستین پلتفرم تجارت الکترونیکی افغانستان",
  shop_now: "خرید کنید", about: "درباره", contact: "تماس", about_us: "درباره ما",
  contact_us: "تماس با ما", forgot_password: "رمز خود را فراموش کردید؟",
  reset_password: "بازنشانی رمز", new_password: "رمز جدید", current_password: "رمز فعلی",
  change_password: "تغییر رمز", register_as_customer: "ثبت نام مشتری",
  register_as_supplier: "ثبت نام تأمین‌کننده", already_have_account: "حساب دارید؟",
  dont_have_account: "حساب ندارید؟", view_all: "مشاهده همه", back: "بازگشت",
  english: "English", pashto: "پښتو", dari: "دری", select_language: "انتخاب زبان",
  cart_empty: "سبد شما خالی است", cart_empty_desc: "هنوز محصولی به سبد اضافه نکرده‌اید",
  start_shopping: "شروع خرید", clear_cart: "پاک کردن سبد",
  continue_shopping: "ادامه خرید", cart_summary: "خلاصه سبد",
  shipping: "ارسال", free: "رایگان", total: "مجموع",
  please_sign_in: "لطفاً وارد شوید", sign_in: "ورود",
  browse_products: "مشاهده محصولات", order_notes: "یادداشت سفارش",
  optional: "اختیاری", payment_method: "روش پرداخت",
  cod: "پرداخت نقدی (COD)", cod_desc: "هنگام دریافت سفارش پرداخت کنید",
  order_summary: "خلاصه سفارش", qty: "تعداد", placing_order: "در حال ثبت...",
  all: "همه", confirmed: "تأیید شده", shipped: "ارسال شده", cancelled: "لغو شده",
  date: "تاریخ", items: "اقلام", status: "وضعیت", view_details: "جزئیات",
  order_details: "جزئیات سفارش", order_items: "اقلام سفارش", product: "محصول",
  product_details: "جزئیات محصول", product_not_found: "محصول یافت نشد",
  adding: "در حال افزودن...", added_to_cart: "به سبد اضافه شد!",
  free_delivery: "ارسال رایگان", details: "جزئیات", seller: "فروشنده",
  related_products: "محصولات مرتبط", all_categories: "همه دسته‌ها",
  no_products_found: "محصولی یافت نشد", no_orders: "سفارشی ندارید",
  amount: "مبلغ", customer: "مشتری", supplier: "تأمین‌کننده", name: "نام",
  no_data: "داده‌ای نیست", sponsorships: "حمایت‌ها",
};

const translations = { en, ps, dr };
const rtlLanguages = ['ps', 'dr'];

const LANG_KEY = 'sawdagar_language';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then(stored => {
      if (stored && translations[stored]) {
        applyLanguage(stored);
      }
    });
  }, []);

  const applyLanguage = useCallback((lang) => {
    const rtl = rtlLanguages.includes(lang);
    setLanguageState(lang);
    setIsRTL(rtl);
    I18nManager.forceRTL(rtl);
    AsyncStorage.setItem(LANG_KEY, lang);
  }, []);

  const setLanguage = useCallback((lang) => {
    applyLanguage(lang);
  }, [applyLanguage]);

  const t = useCallback((key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  }, [language]);

  const getLocalizedName = useCallback((item) => {
    if (!item) return '';
    if (language === 'ps' && item.namePs) return item.namePs;
    if (language === 'dr' && item.nameDr) return item.nameDr;
    return item.nameEn || item.name || '';
  }, [language]);

  const getLocalizedDesc = useCallback((item) => {
    if (!item) return '';
    if (language === 'ps' && item.descPs) return item.descPs;
    if (language === 'dr' && item.descDr) return item.descDr;
    return item.descEn || item.description || '';
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, isRTL, t, setLanguage, getLocalizedName, getLocalizedDesc }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
