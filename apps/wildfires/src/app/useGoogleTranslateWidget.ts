import { useEffect } from 'react';

function useGoogleTranslateScript() {
  useEffect(() => {
    const addScript = document.createElement('script');
    addScript.setAttribute(
      'src',
      '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    );
    document.body.appendChild(addScript);

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          layout:
            window.google.translate.TranslateElement.InlineLayout.VERTICAL,
          autoDisplay: false,
          includedLanguages: 'en,es,zh-CN,ko,tl,hy,fa,ru,ja,vi,fr',
        },
        'google_translate_element'
      );
    };
    return () => {
      const script = document.querySelector(
        'script[src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"]'
      );
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);
}

export default useGoogleTranslateScript;
