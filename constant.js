const MICROSOFT_CALLBACK_URL = process.env.TARGET_ENV === 'development' ?
            `${process.env.MICROSOFT_DEV_CALLBACK_URL}` :
            `${process.env.MICROSOFT_PROD_CALLBACK_URL}`;

const FRONT_URL = process.env.TARGET_ENV === 'development' ?
            `${process.env.FRONTEND_DEV_URL}` :
            `${process.env.FRONTEND_PROD_URL}`;
const API_URL = process.env.TARGET_ENV === 'development' ?
            `${process.env.API_URL_DEV}` :
            `${process.env.API_URL}`;

module.exports = {
    MICROSOFT_CALLBACK_URL,
    FRONT_URL,
    API_URL,
}