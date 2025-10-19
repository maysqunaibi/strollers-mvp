

export const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
  "/api";

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

export async function getLocalPackages(siteNo, siteType = "SHOPPING_MALL") {
  const q = new URLSearchParams();
  if (siteNo) q.set("siteNo", siteNo);
  if (siteType) q.set("siteType", siteType);

  const res = await request("GET", `/catalog/packages?${q.toString()}`);

  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) {
    console.log("thissss is the pckgs in front: ", res.data);
    return res.data;
  }
  return []; // fallback
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

/** ---------------------------
 * HandCart (stroller) helpers
 * ---------------------------
 */

// Get carts (strollers) currently in a device (rack).
export function getCartList({ deviceNo }) {
  return request("POST", `/handcart/list`, { deviceNo });
}

// Unlock a specific slot (cartIndex) on a device after payment.

export function unlockCart({ deviceNo, cartIndex, cartNo }) {
  return request("POST", `/handcart/unlock`, { deviceNo, cartIndex, cartNo });
}

// Bind carts (IC card numbers) to this merchant (one-time association).
 
export function bindCarts({ cartNo }) {
  return request("POST", `/handcart/bind`, { cartNo });
}

// Unbind carts from this merchant.

export function unbindCarts({ cartNo }) {
  const list = Array.isArray(cartNo) ? cartNo : [cartNo].filter(Boolean);
  return request("POST", `/handcart/unbind`, { cartNo: list });
}

/* ------------------------------ Orders and Payments ------------------------------ */
// Orders
export function listOrders(limit = 50) {
  return request("GET", `/orders/list?limit=${limit}`);
}

export const getOrder = (id) => request("GET", `/orders/${id}`);
export const listActiveOrders = () => request("GET", `/orders/active`);
export const markOrderReturned = (id, body = {}) =>
  request("POST", `/orders/${id}/mark-returned`, body);
export const cancelOrder = (id) => request("POST", `/orders/${id}/cancel`);

// Payments
export const listPayments = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request("GET", `/payments${q ? "?" + q : ""}`);
};
export const getPayment = (id) => request("GET", `/payments/${id}`);

export function confirmAndUnlock({
  paymentId,
  deviceNo,
  cartNo,
  cartIndex,
  siteNo,
  amountHalalas,
}) {
  console.log("[API] confirmAndUnlock payload:", {
    paymentId,
    deviceNo,
    cartNo,
    cartIndex,
    siteNo,
    amountHalalas,
  });
  return request("POST", "/payments/confirm-and-unlock", {
    paymentId,
    deviceNo,
    cartNo,
    cartIndex,
    siteNo,
    amountHalalas,
  });
}

/* ------------------------------ Re-exports ------------------------------ */
export default {
  API_BASE,
  getSiteSlots,
  getLocalPackages,
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
  unbindCarts,
  bindCarts,
  unlockCart,
  getCartList,
  listOrders,
  getOrder,
  listActiveOrders,
  markOrderReturned,
  cancelOrder,
  listPayments,
  getPayment,
  confirmAndUnlock,
};
