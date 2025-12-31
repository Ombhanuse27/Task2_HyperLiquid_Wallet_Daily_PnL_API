const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/hyperliquid', routes);

// Global Error Handler
app.use((err, req, res, next) => {
    // console.error(err); // Silence logs during tests
    res.status(500).json({ error: "Internal Server Error", message: err.message });
});

// Only start server if run directly (not in tests)
if (require.main === module) {
    const PORT = 3000;
    app.listen(PORT, () => console.log(`HyperLiquid PnL Service running on port ${PORT}`));
}

module.exports = app;
