import { getDevServerHostIp } from "./getHostIp";
const devHostIp = getDevServerHostIp();

const environment = {
  // If isDevelopment is true, user can use OTP as 05578 in Android only
  isDevelopment: false,
  // LOCAL --------------------
  // API_BASE_URL: `http://${devHostIp}:3000/agro-api/salesdash/`,

  // DEV --------------------
  API_BASE_URL: "https://dev.polygonagro.com/dash-api/agro-api/salesdash/",

  // UAT --------------------
  // API_BASE_URL: "https://sales-dash-mobile-api-uat.vercel.app/agro-api/salesdash/",

  // PROD --------------------
  // API_BASE_URL: "https://polygonagro.com/dash-api/agro-api/salesdash/",
};
export default environment;
