'use strict';

import i18next from "i18next";
import * as english from "shared-lib/locales/en.json";


/* constants */
const auditDbName = 'eaudit';
const staffCookieMaxAge = 5*24*3600*1000; // max age in milliseconds (5 days)

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


module.exports = {
    auditDbName,
    staffCookieMaxAge
};
