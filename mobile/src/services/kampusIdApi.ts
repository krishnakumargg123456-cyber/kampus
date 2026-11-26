import API_BASE_URL from '../config/api';
import type {
  KampusIdRecord,
  RoleInfoResponse,
  PublicStudentProfilePayload,
  VerificationRequestPayload,
} from '../../../src/types/kampusId';

export interface KampusIdBootstrapResponse {
  identity: KampusIdRecord;
  roleInfo: RoleInfoResponse;
  qrPayload: {
    token: string;
    expiresAt: string;
    verifyUrl: string;
    nonce: string;
  };
  publicVerificationUrl: string;
}

export interface QrVerifyResponse {
  success: boolean;
  message?: string;
  identity?: {
    kampusIdNumber: string;
    fullName: string;
    college: string;
    course: string;
    avatarUrl?: string;
    accountStatus: string;
    verificationStatus: string;
    statusBadge: string;
  };
}

function getHeaders(token?: string | null, userId?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (userId) {
    headers['x-user-id'] = userId;
  }
  return headers;
}

export const kampusIdApi = {
  /**
   * 1. Bootstrap / get student's permanent KAMPUS ID & signed QR payload
   */
  async getBootstrap(token?: string | null, userId?: string | null): Promise<KampusIdBootstrapResponse> {
    const res = await fetch(`${API_BASE_URL}/api/kampus-id/bootstrap`, {
      method: 'POST',
      headers: getHeaders(token, userId),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Bootstrap failed with status ${res.status}`);
    }
    return await res.json();
  },

  /**
   * 2. Rotate signed verification QR (revokes prior nonce, 5-minute TTL)
   */
  async rotateQr(token?: string | null, userId?: string | null): Promise<{
    token: string;
    expiresAt: string;
    verifyUrl: string;
    nonce: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/kampus-id/me/rotate-verification`, {
      method: 'POST',
      headers: getHeaders(token, userId),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `QR rotation failed with status ${res.status}`);
    }
    const data = await res.json();
    return data.qrPayload;
  },

  /**
   * 3. Submit formal institutional student verification request with evidence
   */
  async requestVerification(
    payload: VerificationRequestPayload,
    token?: string | null,
    userId?: string | null
  ): Promise<KampusIdRecord> {
    const res = await fetch(`${API_BASE_URL}/api/kampus-id/me/verification-request`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Verification request failed with status ${res.status}`);
    }
    const data = await res.json();
    return data.identity;
  },

  /**
   * 4. Update student profile details (preserves permanent unique ID)
   */
  async updateProfile(
    updates: Partial<KampusIdRecord>,
    token?: string | null,
    userId?: string | null
  ): Promise<KampusIdRecord> {
    const res = await fetch(`${API_BASE_URL}/api/kampus-id/profile`, {
      method: 'PUT',
      headers: getHeaders(token, userId),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Profile update failed with status ${res.status}`);
    }
    const data = await res.json();
    return data.identity;
  },

  /**
   * 5. Verify a scanned QR code token
   */
  async verifyQrToken(tokenString: string): Promise<QrVerifyResponse> {
    const res = await fetch(`${API_BASE_URL}/api/kampus-id/verify-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenString }),
    });
    return await res.json();
  },

  /**
   * 6. Fetch public student profile by ID or slug
   */
  async getPublicProfile(identifier: string): Promise<PublicStudentProfilePayload> {
    const res = await fetch(`${API_BASE_URL}/api/kampus-id/public/${encodeURIComponent(identifier)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Identity record not found');
    }
    const data = await res.json();
    return data.profile;
  },
};
