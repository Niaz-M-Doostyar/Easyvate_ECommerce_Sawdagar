import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProductLinks from 'sawdagar-product-links';
import { normalizeProductLink, referrerProductLink, copiedProductLink } from './productLinksCore.cjs';

const RECOVERY_DONE = 'sawdagar_product_install_recovery_v1';
let startup;
let incomingLink = null;
const acknowledge = () => AsyncStorage.setItem(RECOVERY_DONE, '1').catch(() => {});

async function recoverInitialLink() {
  const direct = normalizeProductLink(await Linking.getInitialURL());
  if (direct) {
    await acknowledge();
    return direct;
  }
  if (!ProductLinks || await AsyncStorage.getItem(RECOVERY_DONE)) return null;
  if (Platform.OS === 'android') {
    const referrer = await ProductLinks.getInstallReferrer();
    if (referrer === null) return null; // Retry transient Play service failures next launch.
    await acknowledge();
    return incomingLink ? null : referrerProductLink(referrer);
  }
  if (Platform.OS === 'ios') {
    const hasCandidate = await ProductLinks.hasPasteCandidate();
    await acknowledge();
    if (!hasCandidate || incomingLink) return null;
    return new Promise(resolve => {
      Alert.alert('Open a shared product?',
        'If you used Copy product link & install, tap Paste & open to continue to that product. Sawdagar only reads your clipboard when you choose Paste.', [
          { text: 'Not now', style: 'cancel', onPress: () => resolve(null) },
          { text: 'Paste & open', onPress: async () => {
            try {
              const link = copiedProductLink(await ProductLinks.pasteProductLink());
              if (!link) Alert.alert('No saved product link', 'Return to the shared message and tap its product link.');
              resolve(incomingLink ? null : link);
            } catch { resolve(null); }
          } },
        ], { cancelable: false });
    });
  }
  return null;
}

export function getInitialProductLink() {
  if (!startup) startup = recoverInitialLink().catch(() => null);
  return startup;
}
export function subscribeToProductLinks(listener) {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    const link = normalizeProductLink(url);
    if (!link) return;
    incomingLink = link;
    acknowledge();
    listener(link);
  });
  return () => subscription.remove();
}
