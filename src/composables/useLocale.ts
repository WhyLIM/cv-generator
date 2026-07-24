import { ref, computed } from 'vue';
import { en, type TranslationKey } from '../locales/en';
import { zh } from '../locales/zh';

export type Locale = 'en' | 'zh';

const translations = { en, zh };

const currentLocale = ref<Locale>('en');

export function useLocale() {
  const t = (key: TranslationKey): string => {
    return translations[currentLocale.value][key] || translations.en[key] || key;
  };

  const locale = computed(() => currentLocale.value);
  
  const isZh = computed(() => currentLocale.value === 'zh');
  const isEn = computed(() => currentLocale.value === 'en');

  const setLocale = (newLocale: Locale) => {
    currentLocale.value = newLocale;
    localStorage.setItem('locale', newLocale);
  };

  const toggleLocale = () => {
    setLocale(currentLocale.value === 'en' ? 'zh' : 'en');
  };

  // Initialize from localStorage
  const initLocale = () => {
    const saved = localStorage.getItem('locale') as Locale | null;
    if (saved && (saved === 'en' || saved === 'zh')) {
      currentLocale.value = saved;
    }
  };

  return {
    t,
    locale,
    isZh,
    isEn,
    setLocale,
    toggleLocale,
    initLocale,
  };
}
