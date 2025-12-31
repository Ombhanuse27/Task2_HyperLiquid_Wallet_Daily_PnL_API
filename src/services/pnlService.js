const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);
const hlApi = require('./hyperliquid');

exports.calculatePnL = async (wallet, startStr, endStr) => {
    // 1. Fetch all required raw data
    // We fetch data slightly before start date to ensure we have a "start of day" reference
    const startTimeMs = dayjs(startStr).subtract(1, 'day').valueOf();
    
    const [portfolio, fills, fundingEvents] = await Promise.all([
        hlApi.getPortfolioHistory(wallet),
        hlApi.getFills(wallet),
        hlApi.getFunding(wallet, startTimeMs)
    ]);

    // Data structures for aggregation
    const dailyStats = [];
    const totals = {
        realized: 0, unrealized: 0, fees: 0, funding: 0, net: 0
    };

    let currentDate = dayjs(startStr);
    const endDate = dayjs(endStr);

    // Helper: Find value closest to a timestamp in a history array (for Net PnL/Equity)
    const findClosestValue = (historyArray, timestamp) => {
        if (!historyArray || historyArray.length === 0) return 0;
        // Arrays are sorted by time. Find last entry <= timestamp
        let lastVal = 0;
        for (const [t, v] of historyArray) {
            if (t > timestamp) break;
            lastVal = parseFloat(v);
        }
        return lastVal;
    };

    // 2. Iterate day by day
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
        const dayStart = currentDate.startOf('day').valueOf();
        const dayEnd = currentDate.endOf('day').valueOf();
        const dateStr = currentDate.format('YYYY-MM-DD');

        // --- A. Aggregates from Fills (Realized PnL & Fees) ---
        const dayFills = fills.filter(f => f.time >= dayStart && f.time <= dayEnd);
        
        const realized = dayFills.reduce((sum, f) => sum + parseFloat(f.closedPnl || 0), 0);
        // Fees are usually positive in API but negative for PnL. PDF asks for "Fees" as absolute value.
        const fees = dayFills.reduce((sum, f) => sum + parseFloat(f.fee || 0), 0);

        // --- B. Aggregates from Funding ---
        // Funding: Positive = received, Negative = paid. 
        const dayFunding = fundingEvents
            .filter(e => e.time >= dayStart && e.time <= dayEnd)
            .reduce((sum, e) => sum + parseFloat(e.usdc || 0), 0);

        // --- C. Net PnL & Equity (From Portfolio Snapshots) ---
        // We calculate daily Net PnL as: (Cumulative PnL at End of Day) - (Cumulative PnL at Start of Day)
        const pnlAtStart = findClosestValue(portfolio.pnlHistory, dayStart);
        const pnlAtEnd = findClosestValue(portfolio.pnlHistory, dayEnd);
        let netPnl = pnlAtEnd - pnlAtStart;
        
        // Edge case: If no portfolio history (inactive wallet), Net PnL is just realized + funding - fees
        if (!portfolio.pnlHistory?.length) {
            netPnl = realized + dayFunding - fees;
        }

        const equity = findClosestValue(portfolio.accountValueHistory, dayEnd);

        // --- D. Derived Unrealized PnL ---
        // Formula: Net = Realized + Unrealized - Fees + Funding
        // Therefore: Unrealized = Net - Realized + Fees - Funding
        const unrealized = netPnl - realized + fees - dayFunding;

        // Push Daily Object
        dailyStats.push({
            date: dateStr,
            realized_pnl_usd: parseFloat(realized.toFixed(2)),
            unrealized_pnl_usd: parseFloat(unrealized.toFixed(2)),
            fees_usd: parseFloat(fees.toFixed(2)),
            funding_usd: parseFloat(dayFunding.toFixed(2)),
            net_pnl_usd: parseFloat(netPnl.toFixed(2)),
            equity_usd: parseFloat(equity.toFixed(2))
        });

        // Update Totals
        totals.realized += realized;
        totals.unrealized += unrealized;
        totals.fees += fees;
        totals.funding += dayFunding;
        totals.net += netPnl;

        currentDate = currentDate.add(1, 'day');
    }

    return {
        daily: dailyStats,
        summary: {
            total_realized_usd: parseFloat(totals.realized.toFixed(2)),
            total_unrealized_usd: parseFloat(totals.unrealized.toFixed(2)),
            total_fees_usd: parseFloat(totals.fees.toFixed(2)),
            total_funding_usd: parseFloat(totals.funding.toFixed(2)),
            net_pnl_usd: parseFloat(totals.net.toFixed(2))
        }
    };
};