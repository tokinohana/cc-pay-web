import axios from "axios";
import thousandsFormat from "./thousandsFormat";
import { browser } from '$app/environment';
import { writable } from "svelte/store";

// const API_URI = "https://ccpay-40-2fd08e733484.herokuapp.com"
const API_URI = "http://localhost:8080";

// ------------------------
// User state
// ------------------------
export const userState = writable({
    session_token: undefined,
    name: undefined,
    email: undefined,
    picture: undefined,
    balance: undefined,
    history: []
});

// ------------------------
// Load from localStorage
// ------------------------
if (browser) {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
        const parsed = JSON.parse(savedUser);
        userState.session_token = parsed.session_token;
        userState.name = parsed.name;
        userState.email = parsed.email;
        userState.picture = parsed.picture;
        userState.balance = parsed.balance;
        userState.history = parsed.history || [];
    }
}

// ------------------------
// Clear user session
// ------------------------
export const clearUserState = () => {
    userState.session_token = undefined;
    userState.name = undefined;
    userState.email = undefined;
    userState.picture = undefined;
    userState.balance = undefined;
    userState.history = [];
    localStorage.removeItem("user");
    console.log("user state cleared");
};

// ------------------------
// Generic request wrapper
// ------------------------
const request = async (endpoint, body) => {
    // Ensure session_token is sent
    if (!body.session_token) {
        body.session_token = userState.session_token;
    }

    let config = {
        method: 'POST',
        maxBodyLength: Infinity,
        url: API_URI + endpoint,
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify(body)
    };

    try {
        const result = await axios.request(config);
        return result.data;
    } catch (err) {
        console.error(err);
        if (err.response?.status === 500) {
            clearUserState();
            window.location.href = window.location.origin + "/login";
            alert("Session expired. Please login again.");
            return "Reset User Session";
        } else if (err.response?.status === 400 && endpoint === "/pay") {
            alert(err.response.data);
        } else {
            await axios.post(API_URI + "/log", {
                message: userState.email + " - " + JSON.stringify(err.response)
            });
            console.error(err);
            alert(err);
        }
    }
};

// ------------------------
// Start session (login)
// ------------------------
export const startSession = async (id_token) => {
    return request('/start_session', { id_token }).then((result) => {
        console.log(result);
        if (result.session_token) {
            userState.session_token = result.session_token;
            localStorage.setItem("user", JSON.stringify(userState));
        }
        return result;
    });
};

// ------------------------
// End session (logout)
// ------------------------
export const endSession = async () => {
    return request('/end_session', { session_token: userState.session_token })
        .then((result) => {
            console.log(result);
            clearUserState();
            return result;
        });
};

// ------------------------
// Refresh balance (coupons)
// ------------------------
export const refreshBalance = async () => {
    if (!userState.session_token) return "No session";

    return request('/balance', { session_token: userState.session_token })
        .then((res) => {
            console.log(res);
            userState.balance = "Rp" + thousandsFormat(res.balance);
        })
        .catch(() => {
            userState.balance = "Failed to refresh balance.";
        });
};

// ------------------------
// Refresh transaction history
// ------------------------
export const refreshHistory = async () => {
    if (!userState.session_token) return "No session";

    return request('/history', { session_token: userState.session_token })
        .then((res) => {
            console.log(res);
            userState.history = res;
        })
        .catch((err) => {
            console.error(err);
        });
};

// ------------------------
// Complete a payment
// ------------------------
export const completePayment = async (merchant, amount) => {
    const regex = /[^\d]+/g;
    const amount_clean = Number(amount.replaceAll(regex, ""));
    return request('/pay', {
        session_token: userState.session_token,
        merchant_name: merchant,
        amount: amount_clean
    }).then((res) => {
        console.log(res);
        return res;
    });
};

// ------------------------
// Get merchant list
// ------------------------
export const getMerchantList = async () => {
    const result = await axios.get(API_URI + "/merchants");
    return result.data;
};

// ------------------------
// Set balances (admin only)
// ------------------------
export const setBalances = async (amount, nis = []) => {
    const regex = /\d{7}/g;
    return request('/set_balances', {
        session_token: userState.session_token,
        amount,
        nis: nis.match(regex)
    }).then((res) => {
        console.log(res);
        return res;
    });
};

// ------------------------
// Deprecated helpers
// ------------------------
export const getBalance = async (name) => {
    console.warn("getBalance by name is deprecated; use session_token instead");
    return "Use session_token for current user";
};

export const getHistory = async (name) => {
    console.warn("getHistory by name is deprecated; use session_token instead");
    return "Use session_token for current user";
};
