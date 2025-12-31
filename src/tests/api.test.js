const request = require('supertest');
const app = require('../app');
const pnlService = require('../services/pnlService');

// Mock the Service Layer to isolate API testing
jest.mock('../services/pnlService');

describe('GET /api/hyperliquid/:wallet/pnl', () => {
    
    // Test 1: Validation Error (Missing Dates)
    it('should return 400 if dates are missing', async () => {
        // FIX: Use a valid length wallet (42 chars) so we pass the wallet check and hit the date check
        const validLengthWallet = '0x' + '0'.repeat(40); 
        const res = await request(app).get(`/api/hyperliquid/${validLengthWallet}/pnl`);
        
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Start and End dates required');
    });

    // Test 2: Validation Error (Invalid Wallet)
    it('should return 400 if wallet is invalid', async () => {
        const res = await request(app).get('/api/hyperliquid/invalid-wallet/pnl?start=2024-01-01&end=2024-01-02');
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Invalid wallet address');
    });

    // Test 3: Successful Response
    it('should return 200 and correct structure for valid input', async () => {
        // Mock data that the service WOULD return
        const mockData = {
            daily: [],
            summary: {
                total_realized_usd: 100,
                total_unrealized_usd: 0,
                total_fees_usd: 1,
                total_funding_usd: 0,
                net_pnl_usd: 99
            }
        };
        pnlService.calculatePnL.mockResolvedValue(mockData);

        const validWallet = '0xdf2ec9648bb4470404c0006764426543b5711136';
        const res = await request(app)
            .get(`/api/hyperliquid/${validWallet}/pnl?start=2024-01-01&end=2024-01-02`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('wallet');
        expect(res.body).toHaveProperty('summary');
        expect(res.body.summary.net_pnl_usd).toBe(99);
    });

    // Test 4: Handling Service Errors
    it('should return 500 if service throws error', async () => {
        pnlService.calculatePnL.mockRejectedValue(new Error('HyperLiquid API down'));
        
        const validWallet = '0xdf2ec9648bb4470404c0006764426543b5711136';
        const res = await request(app)
            .get(`/api/hyperliquid/${validWallet}/pnl?start=2024-01-01&end=2024-01-02`);
        
        expect(res.statusCode).toEqual(500);
        expect(res.body).toHaveProperty('error', 'Internal Server Error');
    });
});
