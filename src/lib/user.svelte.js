import axios from "axios";
import { writable, get } from "svelte/store";
import { browser } from "$app/environment";
import thousandsFormat from "./thousandsFormat";

const API_URI = "https://ccpay-mun-fa716ec87e52.herokuapp.com";
// const API_URI = "http://localhost:8080";

/* ======================================================
    USER STORE
====================================================== */

const initialUserState = {
    session_token: undefined,
    name: undefined,
    email: undefined,
    picture: undefined,
    balance: undefined,
    history: []
};

export const userState = writable({ ...initialUserState });

/* ======================================================
   LOCAL STORAGE SYNC
====================================================== */

if (browser) {
    const saved = localStorage.getItem("user");
    if (saved) {
        try {
            userState.set(JSON.parse(saved));
        } catch {
            localStorage.removeItem("user");
        }
    }

    // persist automatically
    userState.subscribe((state) => {
        if (state?.session_token) {
            localStorage.setItem("user", JSON.stringify(state));
        }
    });
}

/* ======================================================
   HELPERS
====================================================== */

const authGuard = () => {
    const { session_token } = get(userState);
    if (!session_token) {
        throw new Error("NO_SESSION");
    }
    return session_token;
};

const request = async (endpoint, body = {}) => {
    try {
        const token = get(userState).session_token;
        if (token && !body.session_token) {
            body.session_token = token;
        }

        const res = await axios.post(`${API_URI}${endpoint}`, body, {
            headers: { "Content-Type": "application/json" }
        });

        return res.data;

    } catch (err) {
        console.error("API ERROR:", err.response || err);

        if (err.response?.status === 401 || err.response?.status === 500) {
            clearUserState();
            window.location.href = "/login";
            alert("Session expired. Please login again.");
        }

        throw err;
    }
};

/* ======================================================
   AUTH
====================================================== */

export const startSession = async (id_token) => {
    const res = await request("/start_session", { id_token });

    if (res.session_token) {
        userState.update((u) => ({
            ...u,
            session_token: res.session_token
        }));
    }

    return res;
};

export const endSession = async () => {
    try {
        await request("/end_session");
    } finally {
        clearUserState();
    }
};

export const clearUserState = () => {
    userState.set({ ...initialUserState });
    localStorage.removeItem("user");
};

/* ======================================================
   DATA REFRESH
====================================================== */

export const refreshBalance = async () => {
    authGuard();

    const res = await request("/balance");

    userState.update((u) => ({
        ...u,
        balance: res.balance
    }));
};

export const refreshHistory = async () => {
    authGuard();

    const res = await request("/history");

    userState.update((u) => ({
        ...u,
        history: res
    }));
};

/* ======================================================
   PAYMENTS
====================================================== */

export const completePayment = async (merchant, amount) => {
    authGuard();

    const cleaned = Number(String(amount).replace(/[^\d]/g, ""));

    if (cleaned < 5000) {
        throw new Error("Minimum transaction is Rp. 5,000");
    }

    const res = await request("/pay", {
        merchant_name: merchant,
        amount: cleaned
    });

    await Promise.all([refreshBalance(), refreshHistory()]);
    return res;
};

/* ======================================================
   MERCHANTS
====================================================== */

export const getMerchantList = async () => {
    const res = await axios.get(`${API_URI}/merchants`);
    return res.data;
};

export const getMerchantHistory = async (merchant_name) => {
    // No auth guard needed as per requirements (frontend selects merchant)
    // But good practice to ensure we have a session if backend requires it (it currently doesn't for this endpoint based on implementation)
    // The implementation in endpoints.js only requires merchant_name in body

    // However, for consistency with other POST requests that might expect session_token if we used request() helper
    // Let's use request helper which attaches session token if available.
    // Backend implementation does not check for session_token, so it's fine.

    // Actually, let's use axios directly if we want to bypass auth check entirely or use request if we want to be consistent.
    // Since this is an admin/merchant feature, let's assume it might need auth later.
    // For now, simple post.

    const res = await axios.post(`${API_URI}/merchant_history`, { merchant_name });
    return res.data;
};

/* ======================================================
   ADMIN
======================================= =============== */

export const setBalances = async (amount, input = "") => {
    authGuard();

    const cleanAmount = parseInt(String(amount).replace(/\D/g, ''));
    const inputStr = typeof input === 'string' ? input : "";

    // Extract 7-digit numbers as NIS
    const cleanNis = inputStr.match(/\d{7}/g) || [];

    // Extract emails
    const cleanEmails = inputStr.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];

    const res = await request("/set_balances", {
        amount: cleanAmount,
        nis: cleanNis,
        emails: cleanEmails
    });

    return res;
};
