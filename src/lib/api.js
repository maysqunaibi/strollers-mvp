// src/lib/api.js
// Thin client-side wrapper around your Node backend (/api/*)
// so components don't deal with fetch details.

// You can override API base with Vite env: VITE_API_BASE=http://localhost:4000/api
export const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
  "/api";

/** Basic JSON fetch with better error reporting */
async function toJSON(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(
      `[CLIENT_PARSE_ERROR] ${e.message} | raw: ${text.slice(0, 200)}`
    );
  }
}

async function request(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[HTTP ${res.status}] ${text}`);
  }
  return toJSON(res);
}

/* ------------------------------ Site APIs ------------------------------ */
export function getSiteSlots(siteNo) {
  if (!siteNo) throw new Error("siteNo required");
  return request("GET", `/site/${encodeURIComponent(siteNo)}/slots`);
}

export function getSiteMeals(siteNo) {
  if (!siteNo) throw new Error("siteNo required");
  return request("GET", `/site/${encodeURIComponent(siteNo)}/meals`);
}

export function getDefaultMeals(siteNo) {
  if (!siteNo) throw new Error("siteNo required");
  return request("GET", `/site/${encodeURIComponent(siteNo)}/default-meals`);
}

/**
 * Save (append/update) meals for a site.
 * @param {{siteNo: string, setMeals: Array<{setMealName:string, amount:number, coin:number, status?:'ENABLE'|'UNENABLE'}>, siteOrderType?:'LAUNCH'|'RECHARGE', type?:'SITE'|'ALL'|'COMMON'}} payload
 */
export function saveMeals(payload) {
  return request("POST", `/setMeal/save`, payload);
}

/* ----------------------------- Device APIs ----------------------------- */
export function bindDevice({ deviceNo, siteNo, orders, coinsPerTime }) {
  if (!deviceNo || !siteNo || !orders || !coinsPerTime)
    throw new Error("deviceNo, siteNo, orders, coinsPerTime required");
  return request("POST", `/bind`, { deviceNo, siteNo, orders, coinsPerTime });
}

export function unbindDevice({ deviceNo }) {
  if (!deviceNo) throw new Error("deviceNo required");
  return request("POST", `/unbind`, { deviceNo });
}

export function getDeviceInfo(deviceNo) {
  if (!deviceNo) throw new Error("deviceNo required");
  return request("GET", `/device/${encodeURIComponent(deviceNo)}/info`);
}

export function getDeviceStatus(deviceNo) {
  if (!deviceNo) throw new Error("deviceNo required");
  return request("POST", `/device-status`, { deviceNo });
}

export function getDeviceParams(deviceNo) {
  if (!deviceNo) throw new Error("deviceNo required");
  return request("GET", `/device/${encodeURIComponent(deviceNo)}/params`);
}

export function addScore({ deviceNo, coinNum, amount }) {
  if (!deviceNo) throw new Error("deviceNo required");
  return request("POST", `/device/score`, { deviceNo, coinNum, amount });
}

/* ------------------------------ Site CRUD ------------------------------ */
export function addSite({
  siteName,
  province,
  city,
  county,
  address,
  siteType,
}) {
  return request("POST", `/site/add`, {
    siteName,
    province,
    city,
    county,
    address,
    siteType,
  });
}

export function listSites() {
  return request("GET", `/site/list`);
}

export function updateSite({
  siteNo,
  siteName,
  province,
  city,
  county,
  address,
  siteType,
}) {
  return request("POST", `/site/update`, {
    siteNo,
    siteName,
    province,
    city,
    county,
    address,
    siteType,
  });
}

export function removeSite({ siteNo }) {
  return request("POST", `/site/remove`, { siteNo });
}

/* ------------------------------ Re-exports ------------------------------ */
export default {
  API_BASE,
  getSiteSlots,
  getSiteMeals,
  getDefaultMeals,
  saveMeals,
  bindDevice,
  unbindDevice,
  getDeviceInfo,
  getDeviceStatus,
  getDeviceParams,
  addScore,
  addSite,
  listSites,
  updateSite,
  removeSite,
};
