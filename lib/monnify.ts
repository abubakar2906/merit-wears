// Token singleton — module-level cache, not per-request
let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getMonnifyToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;
  
  const apiKey = process.env.MONNIFY_API_KEY;
  const secretKey = process.env.MONNIFY_SECRET_KEY;
  
  if (!apiKey || !secretKey) {
    throw new Error('Monnify credentials are not set in environment variables');
  }

  const credentials = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');
  
  const res = await fetch(`${process.env.MONNIFY_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}` }
  });
  
  if (!res.ok) throw new Error(`Monnify auth failed: ${res.status}`);
  const { requestSuccessful, responseBody } = await res.json();
  if (!requestSuccessful) throw new Error('Monnify auth: requestSuccessful=false');
  
  tokenCache = {
    token: responseBody.accessToken,
    expiresAt: Date.now() + 55 * 60 * 1000  // 55 min (token expires at 60)
  };
  return tokenCache.token;
}

export async function initializeTransaction(payload: {
  amount: number;
  customerName: string;
  customerEmail: string;
  paymentReference: string;
  paymentDescription: string;
  currencyCode: string;
  contractCode: string;
  redirectUrl: string;
}): Promise<{ checkoutUrl: string; transactionReference: string }> {
  const token = await getMonnifyToken();
  const res = await fetch(
    `${process.env.MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );
  
  if (!res.ok) throw new Error(`Monnify init failed: ${res.status}`);
  const { requestSuccessful, responseBody } = await res.json();
  if (!requestSuccessful) throw new Error(`Monnify init: requestSuccessful=false`);
  
  return {
    checkoutUrl: responseBody.checkoutUrl,
    transactionReference: responseBody.transactionReference
  };
}

export async function verifyTransaction(paymentReference: string) {
  const token = await getMonnifyToken();
  const url = `${process.env.MONNIFY_BASE_URL}/api/v2/merchant/transactions/query` +
    `?paymentReference=${encodeURIComponent(paymentReference)}`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) throw new Error(`Monnify verify failed: ${res.status}`);
  const { requestSuccessful, responseBody } = await res.json();
  if (!requestSuccessful) throw new Error('Monnify verify: requestSuccessful=false');
  
  return responseBody;
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const { createHmac, timingSafeEqual } = require('crypto');
  const secretKey = process.env.MONNIFY_SECRET_KEY;
  if (!secretKey) throw new Error('MONNIFY_SECRET_KEY is not set');

  const computed = createHmac('sha512', secretKey)
    .update(rawBody)
    .digest('hex');
  
  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(signature, 'hex');
  
  // timingSafeEqual throws if lengths differ — check first
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
