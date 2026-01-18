import axios from "axios";
import { writable, get } from "svelte/store";
import { browser } from "$app/environment";
import thousandsFormat from "./thousandsFormat";

// const API_URI = "https://ccpay-40-2fd08e733484.herokuapp.com";
const API_URI = "http://localhost:8080";

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
        balance: "Rp" + thousandsFormat(res.balance)
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

    const cleaned = Number(amount.replace(/[^\d]/g, ""));

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

/* ======================================================
   ADMIN
====================================================== */

export const setBalances = async (amount, nis = []) => {
    authGuard();

    const res = await request("/set_balances", {
        amount,
        nis: nis.match(/\d{7}/g)
    });

    return res;
};
