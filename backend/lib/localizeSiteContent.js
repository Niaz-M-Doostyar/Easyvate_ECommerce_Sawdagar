// Remove known template content without changing genuine customer records.
function localizeSiteContent(content) {
  const next = JSON.parse(JSON.stringify(content));
  const home = next.home || {};
  const demoNames = new Set(['Sylvia H Green', 'Gordo Novak', 'Reid E Butt', 'Parker Jimenez']);
  const placeholder = /there are many variations|contrary to popular belief|if you are going use passage/i;
  home.testimonialItems = (home.testimonialItems || []).filter(item => !demoNames.has(item.name) && !placeholder.test(item.text || ''));
  home.brandItems = (home.brandItems || []).filter(item => !/^Brand \d+$/.test(item.name || ''));
  home.blogItems = (home.blogItems || []).filter(item => !placeholder.test(`${item.title || ''} ${item.excerpt || ''}`));
  for (const key of ['galleryImages', 'instagramItems']) {
    home[key] = (home[key] || []).filter(item => !/^\/assets\/img\/(gallery|instagram)\//.test(item.image || ''));
  }
  if (home.video?.videoUrl === 'https://www.youtube.com/watch?v=ckHzmP1evNU') home.video.videoUrl = '';
  if (home.hero) {
    home.hero.description = 'Shop products from Afghan sellers on Sawdagar. Browse in Pashto, Dari or English and check prices in Afghan afghanis (AFN).';
    home.hero.badge = 'Online shopping in Afghanistan';
    home.hero.priceValue = '';
    home.hero.priceLabel = '';
    for (const slide of home.hero.slides || []) {
      if (placeholder.test(slide.description || '')) slide.description = 'Explore products for your home and everyday needs on Sawdagar.';
      if (/^\/assets\/img\/hero\//.test(slide.image || '')) {
        slide.subtitle = 'Shop with Sawdagar';
        slide.priceLabel = '';
        slide.priceValue = '';
      }
    }
  }
  const promos = {
    'Best Travel Sale\nCollections': ['Everyday essentials', 'Find Your Everyday\nEssentials'],
    'Headphone Sale\nCollections': ['Explore products', 'Discover More\nOn Sawdagar'],
    'Summer Shoe Sale\nUp To 50% Off': ['Shop the collection', 'Explore Our\nLatest Products'],
  };
  for (const banner of home.promoBanners || []) {
    if (promos[banner.title]) [banner.label, banner.title] = promos[banner.title];
    if (banner.buttonHref && !banner.buttonHref.startsWith('/')) banner.buttonHref = '/search';
  }
  if (home.bigBanner?.title === 'Huge Sale Up To 40% Off') {
    Object.assign(home.bigBanner, { subtitle: 'Shop Sawdagar', title: 'Discover Products for Everyday Life', description: 'Browse our online marketplace in Afghanistan.' });
  }
  if (home.dealOfWeek?.countdownDate === '2027/12/30') {
    Object.assign(home.dealOfWeek, { badge: 'Explore the store', title: 'Find Your Next Purchase', description: 'Browse available products and check current prices in AFN.', discountPercent: '', countdownDate: '' });
  }
  const features = {
    'Free Delivery': ['Delivery information', 'Check delivery details at checkout'],
    'Get Refund': ['Order assistance', 'Contact us about returns'],
    'Safe Payment': ['Cash on delivery', 'Pay when your order arrives'],
    '24/7 Support': ['Customer support', 'Contact the Sawdagar team'],
  };
  for (const feature of home.features || []) {
    if (features[feature.title]) [feature.title, feature.desc] = features[feature.title];
  }
  if (next.about) {
    next.about.stats = (next.about.stats || []).filter(item => !['Happy Customers', 'Products', 'Provinces Covered', 'Trusted Suppliers'].includes(item.label));
    next.about.heroDescription = 'An online marketplace connecting Afghan suppliers, retailers and customers.';
    next.about.ctaDescription = 'Explore products and shop with Sawdagar in Afghanistan.';
  }
  const phone = '+93 706 151 322';
  const email = 'onlinesawdagar@gmail.com';
  for (const section of [next.header, next.footer]) {
    if (!section) continue;
    if (/^\+93 (700|799) 000 000$/.test(section.phone || '')) section.phone = phone;
    if (['info@sawdagar.af', 'support@sawdagar.af'].includes(section.email)) section.email = email;
  }
  if (next.footer?.aboutText?.startsWith("Afghanistan's premier")) next.footer.aboutText = 'Sawdagar connects Afghan suppliers, retailers and customers through online shopping. Browse products in Pashto, Dari and English, with prices in AFN.';
  for (const card of next.contact?.cards || []) {
    if (card.title === 'Phone' && card.lines?.some(line => /^\+93 (700|799) 000 000$/.test(line))) card.lines = [next.header?.phone || phone];
    if (card.title === 'Email' && card.lines?.some(line => ['info@sawdagar.af', 'support@sawdagar.af'].includes(line))) card.lines = [next.header?.email || email];
    if (card.title === 'Our Office' && card.lines?.includes('District 5, Main Street')) card.lines = ['Kandahar, Afghanistan'];
  }
  return next;
}

module.exports = { localizeSiteContent };
