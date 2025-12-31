const pnlService = require('./services/pnlService');

exports.getPnl = async (req, res, next) => {
    try {
        const { wallet } = req.params;
        const { start, end } = req.query;

        // Basic Validation
        if (!wallet.startsWith('0x') || wallet.length !== 42) {
            return res.status(400).json({ error: "Invalid wallet address" });
        }
        if (!start || !end) {
            return res.status(400).json({ error: "Start and End dates required" });
        }

        const data = await pnlService.calculatePnL(wallet, start, end);

        // Format Response exactly as requested
        res.json({
            wallet,
            start,
            end,
            daily: data.daily,
            summary: data.summary,
            diagnostics: {
                data_source: "hyperliquid_api",
                last_api_call: new Date().toISOString(),
                notes: "Unrealized PnL derived from (Net - Realized - Funding + Fees) to ensure balance."
            }
        });
    } catch (err) {
        next(err);
    }
};