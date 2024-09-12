import i18next from "i18next";
import * as english from "shared-lib/locales/en.json";


// initialize i18next
i18next.init({
    lng: 'en', // define only when not using language detector
    //debug: true,
    resources: {
        en: {
            translation: english
        }
    }
});
//.then(()=>{});

