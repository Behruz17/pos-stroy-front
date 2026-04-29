import { Button, Space } from 'antd';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
  { code: 'tg', label: 'TG', flag: '🇹🇯' },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Space size="small">
      {languages.map((lang) => (
        <Button
          key={lang.code}
          size="small"
          type={i18n.language === lang.code ? 'primary' : 'default'}
          onClick={() => changeLanguage(lang.code)}
          style={{ minWidth: '40px' }}
        >
          {lang.flag} {lang.label}
        </Button>
      ))}
    </Space>
  );
};
