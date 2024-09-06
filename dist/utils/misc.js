"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const i18next_1 = __importDefault(require("i18next"));
// initialize i18next
i18next_1.default.init({
    lng: 'en', // define only when not using language detector
    //debug: true,
    resources: {
        en: {
            translation: {
                'hallo': "hello world"
            }
        }
    }
})
    .then(() => {
    console.log('translated: ', i18next_1.default.t('hallo'));
});
