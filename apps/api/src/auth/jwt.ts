import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export interface JwtPayload extends JWTPayload {
  sub: string;
  email: string;
}

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signJwt(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  secret: string
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey(secret));
}

export async function verifyJwt(
  token: string,
  secret: string
): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secretKey(secret));
  return payload as JwtPayload;
}
