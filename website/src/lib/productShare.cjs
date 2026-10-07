const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sawdagar.com').replace(/\/$/, '');
const { createHash } = require('node:crypto');
const ANDROID_PACKAGE = 'com.ahmadwali.afghan_bazar.afghan_bazar';
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function productImage(product) {
  const raw = product.images?.[0]?.url;
  if (!raw) return `${SITE_URL}/assets/img/logo/logo.png`;
  // Uploaded images sometimes retain an old/private API hostname.
  const upload = raw.replace(/\\/g, '/').match(/(?:^|\/)uploads\/[^?#]+/i);
  if (upload) return `${SITE_URL}/${upload[0].replace(/^\//, '')}`;
  try {
    const url = new URL(raw, `${SITE_URL}/`);
    return /^https?:$/.test(url.protocol) ? url.href : `${SITE_URL}/assets/img/logo/logo.png`;
  } catch { return `${SITE_URL}/assets/img/logo/logo.png`; }
}
function productUploadPath(product) {
  try {
    const pathname = decodeURIComponent(new URL(productImage(product)).pathname);
    return pathname.startsWith('/uploads/') && !pathname.includes('..') ? pathname : null;
  } catch { return null; }
}
function productPreview(product) {
  if (!productUploadPath(product)) return { url: productImage(product) };
  const version = createHash('sha256').update(`${product.images[0].url}:${product.updatedAt || ''}`).digest('hex').slice(0, 12);
  return { url: `${SITE_URL}/share/products/${encodeURIComponent(product.id)}/image.jpg?v=2-${version}`, type: 'image/jpeg', width: 1200, height: 630 };
}
function shareDocument(product) {
  const id = encodeURIComponent(product.id).replace(/'/g, '%27');
  const title = product.nameEn || product.nameDr || product.namePs || 'Sawdagar product';
  const description = (product.descEn || `Shop ${title} on Sawdagar.`).replace(/<[^>]*>/g, '').slice(0, 300);
  const url = `${SITE_URL}/share/products/${id}?preview=2`;
  const appUrl = `sawdagar://products/${id}`;
  const referrer = encodeURIComponent(`sawdagar_product=${id}`);
  const playUrl = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&referrer=${referrer}`;
  const configuredStore = process.env.IOS_APP_STORE_URL || 'https://apps.apple.com/app/sawdagar/id6763734260';
  const iosUrl = /^https:\/\/apps\.apple\.com\//.test(configuredStore) ? configuredStore : '';
  const image = productImage(product);
  const preview = productPreview(product);
  const e = escapeHtml;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(title)} | Sawdagar</title><meta name="description" content="${e(description)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Sawdagar"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${e(url)}"><meta property="og:image" content="${e(preview.url)}"><meta property="og:image:secure_url" content="${e(preview.url)}">${preview.type ? `<meta property="og:image:type" content="${preview.type}"><meta property="og:image:width" content="${preview.width}"><meta property="og:image:height" content="${preview.height}">` : ''}<meta property="og:image:alt" content="${e(title)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(description)}"><meta name="twitter:image" content="${e(preview.url)}">
${iosUrl ? `<meta name="apple-itunes-app" content="app-id=6763734260, app-argument=${e(url)}">` : ''}
<style>[hidden]{display:none!important}body{margin:0;background:#fff8f2;color:#272727;font:17px system-ui,sans-serif}main{max-width:440px;margin:40px auto;padding:24px;background:white;border-radius:24px}img{width:100%;height:280px;object-fit:contain}h1{font-size:26px}button{border:0;width:100%;font:inherit;cursor:pointer}a,button{display:block;margin:12px 0;padding:14px;border-radius:12px;text-align:center;color:#222;background:#f3f3f3;text-decoration:none}#open{background:#f59a57}p{line-height:1.6}small{color:#555}</style></head>
<body><main><img src="${e(image)}" alt="${e(title)}"><h1>${e(title)}</h1><p>Open this product in Sawdagar.</p><a id="open" href="${e(appUrl)}">Open in Sawdagar</a><a id="android" href="${e(playUrl)}">Get it on Google Play</a>${iosUrl ? `<button id="copy-install" hidden>Copy product link &amp; install</button><a id="ios" href="${e(iosUrl)}">Download without saving product</a>` : '<p id="ios-unavailable" hidden>The iOS download link is not available yet.</p>'}<p id="install-help">Install Sawdagar to open this product.</p><p id="copy-error" role="status" hidden>Could not copy the link. Download the app, then return to this message and open the product.</p><a href="${e(SITE_URL)}/products/${id}">View product on the website</a></main>
<script>
(function () {
  var android = /Android/i.test(navigator.userAgent);
  var ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var open = document.getElementById('open');
  var play = document.getElementById('android');
  var apple = document.getElementById('ios');
  var copy = document.getElementById('copy-install');
  var help = document.getElementById('install-help');
  var crawler = /facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot/i.test(navigator.userAgent);
  // In-app browsers (WhatsApp, Facebook, etc.) suppress Universal Links, so
  // when the app is installed we must nudge it open via the custom scheme.
  // In plain Safari a working Universal Link opens the app before this page
  // ever renders, so reaching this page there means the app is not installed.
  var inAppBrowser = /FBAN|FBAV|FBIOS|Instagram|WhatsApp|Twitter|Line|Snapchat|TikTok|Telegram/i.test(navigator.userAgent);
  function openApp() {
    window.location.replace('${appUrl}');
  }
  open.addEventListener('click', function (event) {
    event.preventDefault();
    openApp();
  });
  if (ios) {
    play.hidden = true;
    if (copy) copy.hidden = false;
    var missing = document.getElementById('ios-unavailable');
    if (missing) missing.hidden = false;
    help.textContent = 'Save the product link before downloading. On first launch, choose Paste & open and allow pasting if iOS asks.';
    if (copy) copy.addEventListener('click', async function () {
      try {
        await navigator.clipboard.writeText('${url}' + '&sawdagar_install=' + Date.now());
        window.location.assign(apple.href);
      } catch (error) {
        document.getElementById('copy-error').hidden = false;
      }
    });
    // Single automatic attempt, only inside in-app browsers. If Sawdagar is
    // installed the user gets exactly one "Open in Sawdagar?" prompt; if it
    // is not installed nothing happens and the install UI stays on screen —
    // we never redirect to the App Store automatically.
    if (!crawler && inAppBrowser) openApp();
  }
  if (android) {
    if (apple) apple.hidden = true;
    help.textContent = 'Install from Google Play, then tap Open to continue to this product.';
    open.href = 'intent://products/${id}#Intent;scheme=sawdagar;package=${ANDROID_PACKAGE};S.browser_fallback_url=' + encodeURIComponent(play.href) + ';end';
    // Installed apps normally bypass this page via verified App Links. The
    // intent covers in-app browsers and carries its own Play Store fallback.
    if (!crawler) window.location.replace(open.href);
  }

})();
</script></body></html>`;
}
module.exports = { productImage, productUploadPath, productPreview, shareDocument };
