import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export const useTranslate = () => {
  const { t, i18n } = useTranslation();

  // Toggle RTL class dynamically
  useEffect(() => {
    if (i18n.language === 'ar') {
      document.documentElement.dir = 'rtl';
      document.body.classList.add('rtl');
    } else {
      document.documentElement.dir = 'ltr';
      document.body.classList.remove('rtl');
    }
  }, [i18n.language]);

  const translate = (key, options = {}) => t(key, options);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return {
    translate,
    changeLanguage,
    currentLang: i18n.language,
  };
};
