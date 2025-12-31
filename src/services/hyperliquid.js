const axios = require('axios');

const HL_API_URL = 'https://api.hyperliquid.xyz/info';


//Fetches Portfolio History (Net PnL & Equity over time).

exports.getPortfolioHistory = async (user) => {
    try {
        const res = await axios.post(HL_API_URL, { type: "portfolio", user });
        // The API returns [["daily", ...], ["weekly", ...], ...]. We want the most granular data usually found in index 0.
        // Structure: [time_period_name, { accountValueHistory: [[t, v], ...], pnlHistory: [[t, v], ...] }]
        return res.data.find(d => d[0] === 'daily' || d[0] === 'allTime')?.[1] || {};
    } catch (e) {
        console.error("Error fetching portfolio:", e.message);
        return {};
    }
};


//Fetches Trade Fills (Realized PnL & Fees).
exports.getFills = async (user) => {
    try {
        const res = await axios.post(HL_API_URL, { type: "userFills", user });
        return res.data || [];
    } catch (e) {
        console.error("Error fetching fills:", e.message);
        return [];
    }
};

/**
 * Fetches Funding History (Funding Fees Paid/Received).
 */
exports.getFunding = async (user, startTime) => {
    try {
        const res = await axios.post(HL_API_URL, { 
            type: "userFunding", 
            user, 
            startTime: startTime || 0 
        });
        return res.data || [];
    } catch (e) {
        console.error("Error fetching funding:", e.message);
        return [];
    }
};