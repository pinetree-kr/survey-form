import { createHmac } from 'crypto';

/**
 * 랜덤 시크릿 키 생성
 */
export function generateSecretKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * JWT 토큰 페이로드 타입
 */
export interface TokenPayload {
    iss: string;          // issuer (설문 ID)
    aud: string;          // audience (응답자 식별자)
    iat: number;          // issued at
    exp: number;          // expires at (1시간 후)
    metadata?: any;       // redirect 시 전달할 메시지
}

/**
 * Base64 URL 인코딩
 */
function base64UrlEncode(str: string): string {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Base64 URL 디코딩
 */
function base64UrlDecode(str: string): string {
    // 패딩 추가
    str += '='.repeat((4 - str.length % 4) % 4);
    // URL-safe 문자를 표준 base64로 변환
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(str, 'base64').toString();
}

/**
 * JWT 토큰 생성
 * @param payload 토큰 페이로드
 * @param secretKey 서명용 시크릿 키
 * @returns JWT 토큰
 */
export function generateJWTToken(payload: TokenPayload, secretKey: string): string {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    
    const signature = createHmac('sha256', secretKey)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * JWT 토큰 검증 및 페이로드 추출
 * @param token JWT 토큰
 * @param secretKey 검증용 시크릿 키
 * @returns 검증된 페이로드 또는 null
 */
export function validateAndParseJWT(token: string, secretKey: string): TokenPayload | null {
    if (!token || !secretKey) {
        return null;
    }

    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        const [encodedHeader, encodedPayload, signature] = parts;
        
        // 서명 검증
        const expectedSignature = createHmac('sha256', secretKey)
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        if (signature !== expectedSignature) {
            return null;
        }

        // 페이로드 디코딩
        const payload: TokenPayload = JSON.parse(base64UrlDecode(encodedPayload));
        
        // 만료 시간 확인
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            return null; // 토큰 만료
        }

        return payload;
    } catch (error) {
        return null;
    }
}

/**
 * 액세스 토큰 생성 (편의 함수)
 * @param surveyId 설문 ID
 * @param respondentId 응답자 식별자
 * @param secretKey 시크릿 키
 * @param metadata 추가 메타데이터
 * @returns JWT 토큰
 */
export function generateAccessToken(
    surveyId: string, 
    respondentId: string, 
    secretKey: string,
    metadata?: any
): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
        iss: surveyId,
        aud: respondentId,
        iat: now,
        exp: now + 3600, // 1시간 후 만료
        metadata
    };

    return generateJWTToken(payload, secretKey);
}

/**
 * 액세스 토큰 검증 (기존 호환성)
 * @param token 검증할 토큰
 * @param secretKey 설문의 시크릿 키
 * @returns 검증 성공 여부
 */
export function validateAccessToken(token: string, secretKey: string): boolean {
    const payload = validateAndParseJWT(token, secretKey);
    return payload !== null;
}

/**
 * 토큰에서 응답자 ID 추출
 * @param token JWT 토큰
 * @param secretKey 시크릿 키
 * @returns 응답자 ID 또는 null
 */
export function extractRespondentFromToken(token: string, secretKey: string): string | null {
    const payload = validateAndParseJWT(token, secretKey);
    return payload ? payload.aud : null;
}