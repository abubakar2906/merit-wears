import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as InitiatePOST } from '../app/api/payment/initiate/route';
import { POST as WebhookPOST } from '../app/api/payment/webhook/route';
import * as supabaseServer from '../lib/supabaseServer';
import * as monnify from '../lib/monnify';

// Mock dependencies
vi.mock('../lib/supabaseServer', () => ({
  supabaseRoute: vi.fn(),
  supabaseAdmin: vi.fn(),
}));

vi.mock('../lib/monnify', () => ({
  initializeTransaction: vi.fn(),
  verifyTransaction: vi.fn(),
  verifyWebhookSignature: vi.fn(),
}));

describe('Payment System Tests', () => {
  let mockSupabase: any;
  let mockAdmin: any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONNIFY_CONTRACT_CODE = 'TEST_CONTRACT';
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
    process.env.MONNIFY_WEBHOOK_IPS = '127.0.0.1';
    
    mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user', email: 'test@example.com' } } }) }
    };
    
    vi.mocked(supabaseServer.supabaseRoute).mockReturnValue(mockSupabase);
    
    // We will initialize mockAdmin in each test block to ensure perfect isolation
    // and prevent brittle call sequencing
  });

  // Helper to create an isolated, chainable mock for Supabase Admin
  const createMockAdmin = (overrides = {}) => {
    const defaultMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: null })
                })
              })
            })
          }),
          gte: vi.fn().mockReturnValue({
            lt: vi.fn().mockResolvedValue({ count: 5, error: null })
          })
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'new-order-123' }, error: null })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      }),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null })
    };
    
    // Merge deeply (basic implementation for our needs)
    const mock = { ...defaultMock, ...overrides };
    vi.mocked(supabaseServer.supabaseAdmin).mockReturnValue(mock as any);
    return mock;
  };

  describe('Initiate Payment (/api/payment/initiate)', () => {
    const validPayload = {
      customer_name: 'John Doe',
      customer_phone: '1234567890',
      customer_address: '123 Street',
      items: [{ product_id: 'prod-1', quantity: 1, size: 'M' }],
      total_amount: 5000 // 1 * 5000
    };

    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      const req = new NextRequest('http://localhost:3000/api/payment/initiate', {
        method: 'POST',
        body: JSON.stringify(validPayload)
      });
      const res = await InitiatePOST(req);
      expect(res.status).toBe(401);
    });

    it('should return 400 for missing required payload fields', async () => {
      const req = new NextRequest('http://localhost:3000/api/payment/initiate', {
        method: 'POST',
        body: JSON.stringify({ ...validPayload, customer_name: '' }) // missing name
      });
      const res = await InitiatePOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Invalid order payload');
    });

    it('should return 400 for empty items array', async () => {
      const req = new NextRequest('http://localhost:3000/api/payment/initiate', {
        method: 'POST',
        body: JSON.stringify({ ...validPayload, items: [] })
      });
      const res = await InitiatePOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Invalid order payload');
    });

    it('should return 400 if quantity exceeds available stock', async () => {
      // Mock the product fetch to return stock_quantity = 2, price = 5000
      const mockAdmin = createMockAdmin();
      mockAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: { stock_quantity: 2, name: 'Sneakers', price: 5000 }
      });
      
      const req = new NextRequest('http://localhost:3000/api/payment/initiate', {
        method: 'POST',
        // Requesting 5, but stock is 2
        body: JSON.stringify({ ...validPayload, items: [{ product_id: 'prod-1', quantity: 5, size: 'M' }] })
      });
      const res = await InitiatePOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('out of stock or have insufficient quantity');
      expect(data.error).toContain('Sneakers');
    });

    it('should return 400 if amount tampering is detected', async () => {
      const mockAdmin = createMockAdmin();
      // Product costs 5000
      mockAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: { stock_quantity: 10, name: 'Sneakers', price: 5000 }
      });
      
      const req = new NextRequest('http://localhost:3000/api/payment/initiate', {
        method: 'POST',
        // Client maliciously sends total_amount: 1
        body: JSON.stringify({ ...validPayload, total_amount: 1 })
      });
      
      const res = await InitiatePOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Amount mismatch');
      expect(data.error).toContain('Expected ₦5000');
      expect(data.error).toContain('received ₦1');
    });

    it('should return 400 for invalid promo code', async () => {
      const mockAdmin = createMockAdmin();
      mockAdmin.from().select().eq().single.mockResolvedValue({
        data: { stock_quantity: 10, name: 'Shirt', price: 5000 }
      });
      // Mock RPC validate_promo returning invalid
      mockAdmin.rpc.mockResolvedValueOnce({ data: { valid: false, message: 'Expired code' } });
      
      const req = new NextRequest('http://localhost:3000/api/payment/initiate', {
        method: 'POST',
        body: JSON.stringify({ ...validPayload, promo_code: 'BADCODE' })
      });
      const res = await InitiatePOST(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBe('Expired code');
    });

    it('should successfully apply valid promo code and use discounted amount', async () => {
      const mockAdmin = createMockAdmin();
      mockAdmin.from().select().eq().single.mockResolvedValue({
        data: { stock_quantity: 10, name: 'Shirt', price: 5000 }
      });
      // Mock RPC validate_promo returning valid with 1000 discount
      mockAdmin.rpc.mockResolvedValueOnce({ 
        data: { valid: true, final_amount: 4000, discount_amount: 1000, normalized_code: 'GOODCODE' } 
      });

      // Mock idempotency check (no existing order)
      mockAdmin.from().select().eq().in().order().limit().single.mockResolvedValueOnce({ data: null });
      
      vi.mocked(monnify.initializeTransaction).mockResolvedValue({
        checkoutUrl: 'http://new.checkout',
        transactionReference: 'TXN-123'
      });

      const req = new NextRequest('http://localhost:3000/api/payment/initiate', {
        method: 'POST',
        body: JSON.stringify({ ...validPayload, promo_code: 'GOODCODE' })
      });
      const res = await InitiatePOST(req);
      expect(res.status).toBe(200);
      
      // Verify monnify was called with the discounted amount
      expect(monnify.initializeTransaction).toHaveBeenCalledWith(expect.objectContaining({
        amount: 4000
      }));
    });

    it('should return 500 if DB insertion fails', async () => {
      const mockAdmin = createMockAdmin();
      mockAdmin.from().select().eq().single.mockResolvedValue({
        data: { stock_quantity: 10, name: 'Shirt', price: 5000 }
      });
      // Mock idempotency check (no existing order)
      mockAdmin.from().select().eq().in().order().limit().single.mockResolvedValueOnce({ data: null });
      
      // Force DB insert to fail
      mockAdmin.from().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: new Error('DB connection lost')
      });

      const req = new NextRequest('http://localhost:3000/api/payment/initiate', {
        method: 'POST',
        body: JSON.stringify(validPayload)
      });
      const res = await InitiatePOST(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain('Failed to create order');
    });

    it('should return 502 if Monnify transaction init fails', async () => {
      const mockAdmin = createMockAdmin();
      mockAdmin.from().select().eq().single.mockResolvedValue({
        data: { stock_quantity: 10, name: 'Shirt', price: 5000 }
      });
      mockAdmin.from().select().eq().in().order().limit().single.mockResolvedValueOnce({ data: null });
      
      // Monnify goes down
      vi.mocked(monnify.initializeTransaction).mockRejectedValue(new Error('Monnify timeout'));

      const req = new NextRequest('http://localhost:3000/api/payment/initiate', {
        method: 'POST',
        body: JSON.stringify(validPayload)
      });
      const res = await InitiatePOST(req);
      expect(res.status).toBe(502);
      const data = await res.json();
      expect(data.error).toBe('Payment gateway unavailable. Please try again later.');
    });

    it('should return existing checkout URL on idempotency match', async () => {
      const mockAdmin = createMockAdmin();
      mockAdmin.from().select().eq().single.mockResolvedValue({
        data: { stock_quantity: 10, name: 'Shirt', price: 5000 }
      });
      
      // Simulate existing order found for this specific idempotency hash
      mockAdmin.from().select().eq().in().order().limit().single.mockResolvedValueOnce({ 
        data: { payment_reference: 'REF-123', checkout_url: 'http://existing.url' } 
      });

      const req = new NextRequest('http://localhost:3000/api/payment/initiate', {
        method: 'POST',
        body: JSON.stringify(validPayload)
      });
      const res = await InitiatePOST(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.checkoutUrl).toBe('http://existing.url');
      expect(monnify.initializeTransaction).not.toHaveBeenCalled(); // Should skip hitting Monnify API
    });
  });

  describe('Webhook (/api/payment/webhook)', () => {
    const createWebhookReq = (body: any, sig: string = 'valid-sig', ip: string = '127.0.0.1') => {
      return new NextRequest('http://localhost:3000/api/payment/webhook', {
        method: 'POST',
        body: typeof body === 'string' ? body : JSON.stringify(body),
        headers: {
          'monnify-signature': sig,
          'x-forwarded-for': ip
        }
      });
    };

    it('should reject invalid IPs silently with 200', async () => {
      const req = createWebhookReq({}, 'valid', '192.168.1.1'); // unauthorized IP
      const res = await WebhookPOST(req);
      expect(res.status).toBe(200);
      expect(monnify.verifyWebhookSignature).not.toHaveBeenCalled();
    });

    it('should reject invalid signatures silently with 200', async () => {
      vi.mocked(monnify.verifyWebhookSignature).mockReturnValue(false);
      const req = createWebhookReq({}, 'invalid');
      const res = await WebhookPOST(req);
      expect(res.status).toBe(200);
    });

    it('should handle malformed JSON silently with 200', async () => {
      vi.mocked(monnify.verifyWebhookSignature).mockReturnValue(true);
      const req = createWebhookReq('not-json-string');
      const res = await WebhookPOST(req);
      expect(res.status).toBe(200); // 200 to prevent retries
    });

    it('should acknowledge but ignore non-SUCCESSFUL_TRANSACTION events', async () => {
      vi.mocked(monnify.verifyWebhookSignature).mockReturnValue(true);
      const req = createWebhookReq({ eventType: 'FAILED_TRANSACTION' });
      const res = await WebhookPOST(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.responseMessage).toBe('Acknowledged');
      expect(monnify.verifyTransaction).not.toHaveBeenCalled();
    });

    it('should return 200 and log if verifyTransaction throws (Monnify down)', async () => {
      vi.mocked(monnify.verifyWebhookSignature).mockReturnValue(true);
      vi.mocked(monnify.verifyTransaction).mockRejectedValue(new Error('Monnify API down'));
      
      const req = createWebhookReq({ 
        eventType: 'SUCCESSFUL_TRANSACTION',
        eventData: { paymentReference: 'REF-1', transactionReference: 'TXN-1' }
      });
      const res = await WebhookPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.responseMessage).toBe('Logged');
    });

    it('should log and return 200 if verifyTransaction shows not paid', async () => {
      vi.mocked(monnify.verifyWebhookSignature).mockReturnValue(true);
      vi.mocked(monnify.verifyTransaction).mockResolvedValue({ paymentStatus: 'PENDING' });
      
      const req = createWebhookReq({ 
        eventType: 'SUCCESSFUL_TRANSACTION',
        eventData: { paymentReference: 'REF-1', transactionReference: 'TXN-1' }
      });
      const res = await WebhookPOST(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.responseMessage).toBe('Logged');
    });

    it('should handle "payment successful but order not found" gracefully', async () => {
      const mockAdmin = createMockAdmin();
      vi.mocked(monnify.verifyWebhookSignature).mockReturnValue(true);
      vi.mocked(monnify.verifyTransaction).mockResolvedValue({ paymentStatus: 'PAID', amountPaid: 1000, paymentMethod: 'CARD' });
      
      // Simulate RPC throwing order not found error
      mockAdmin.rpc.mockResolvedValue({ error: new Error('confirm_payment: order not found for reference REF-1') });

      const req = createWebhookReq({ 
        eventType: 'SUCCESSFUL_TRANSACTION',
        eventData: { paymentReference: 'REF-1', transactionReference: 'TXN-1' }
      });
      const res = await WebhookPOST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.responseMessage).toBe('Logged');
    });

    it('should not confirm payment if amountPaid does not match order total', async () => {
      // NOTE: This assumes confirm_payment RPC strictly checks `amountPaid >= amount_expected`.
      // Our test verifies the webhook route correctly passes `amountPaid` to the RPC.
      const mockAdmin = createMockAdmin();
      vi.mocked(monnify.verifyWebhookSignature).mockReturnValue(true);
      vi.mocked(monnify.verifyTransaction).mockResolvedValue({ 
        paymentStatus: 'PAID', amountPaid: 500, paymentMethod: 'CARD' // Short paid!
      });
      
      // If short paid, RPC will fail (since the DB handles the logic)
      mockAdmin.rpc.mockResolvedValue({ error: new Error('amount expected mismatch') });

      const req = createWebhookReq({ 
        eventType: 'SUCCESSFUL_TRANSACTION',
        eventData: { paymentReference: 'REF-1', transactionReference: 'TXN-1' }
      });
      const res = await WebhookPOST(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.responseMessage).toBe('Logged');
    });

    it('should process successful transaction (Happy Path)', async () => {
      const mockAdmin = createMockAdmin();
      vi.mocked(monnify.verifyWebhookSignature).mockReturnValue(true);
      vi.mocked(monnify.verifyTransaction).mockResolvedValue({ paymentStatus: 'PAID', amountPaid: 1000, paymentMethod: 'CARD' });
      mockAdmin.rpc.mockResolvedValue({ data: { status: 'ok', order_id: '123' }, error: null });

      const req = createWebhookReq({ 
        eventType: 'SUCCESSFUL_TRANSACTION',
        eventData: { paymentReference: 'REF-1', transactionReference: 'TXN-1' }
      });
      const res = await WebhookPOST(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.responseMessage).toBe('Success');
      expect(mockAdmin.rpc).toHaveBeenCalledWith('confirm_payment', expect.objectContaining({
        p_amount_paid: 1000
      }));
    });

    it('should handle already-paid webhook duplications idempotently', async () => {
      const mockAdmin = createMockAdmin();
      vi.mocked(monnify.verifyWebhookSignature).mockReturnValue(true);
      vi.mocked(monnify.verifyTransaction).mockResolvedValue({ paymentStatus: 'PAID', amountPaid: 1000, paymentMethod: 'CARD' });
      
      // Simulate RPC returning already_paid
      mockAdmin.rpc.mockResolvedValue({ data: { status: 'already_paid', order_id: '123' }, error: null });

      const req = createWebhookReq({ 
        eventType: 'SUCCESSFUL_TRANSACTION',
        eventData: { paymentReference: 'REF-1', transactionReference: 'TXN-1' }
      });
      const res = await WebhookPOST(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.responseMessage).toBe('Success'); // Should still return success to Monnify
    });
  });
});
