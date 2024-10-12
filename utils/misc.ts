import i18next from "i18next";
import * as english from "shared-lib/locales/en.json";
import * as fs from "fs";
const debug = require('debug')('ea:utils-misc');
debug.log = console.log.bind(console);


/* constants */
export const auditDbName = 'eaudit';
export const staffCookieMaxAge = 5*24*3600*1000; // max age in milliseconds (5 days)

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


/**
 * Ensure that a directory exists on a filesystem before writing a file to it
 * @param dirPath 
 * @returns 
 */
export function ensureDirExists(dirPath: string) : Promise<void> {
    let options = {recursive: true};
    return new Promise((resolve, reject)=>{
        fs.mkdir(dirPath, options, (err)=>{
            if (!err || err.code === 'EEXIST') resolve();
            else {
                debug('mkdir err: \n', err);
                reject(err);
            }
        });
    });
}
