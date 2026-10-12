import { JWTPayload, SignJWT, exportJWK, generateKeyPair } from 'jose';
import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';

const KEY_ID = 'test-key';

export type SignOptions = { expiresIn?: string; issuer?: string };

export type TestAuthServer = {
  url: string;
  origin: string;
  sign: (claims?: JWTPayload, options?: SignOptions) => Promise<string>;
  close: () => Promise<void>;
};

// Serves a JWKS like Neon Auth and signs EdDSA tokens with its private key.
export const startTestAuthServer = async (): Promise<TestAuthServer> => {
  const { publicKey, privateKey } = await generateKeyPair('EdDSA', { crv: 'Ed25519' });
  const jwk = { ...(await exportJWK(publicKey)), alg: 'EdDSA', kid: KEY_ID, use: 'sig' };
  const server = createServer((req, res) => {
    if (req.url?.endsWith('/.well-known/jwks.json')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ keys: [jwk] }));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  const origin = `http://127.0.0.1:${port}`;

  return {
    url: `${origin}/neondb/auth`,
    origin,
    sign: (claims = {}, { expiresIn = '15m', issuer = origin } = {}) =>
      new SignJWT(claims)
        .setProtectedHeader({ alg: 'EdDSA', kid: KEY_ID })
        .setIssuedAt()
        .setIssuer(issuer)
        .setExpirationTime(expiresIn)
        .sign(privateKey),
    close: () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      ),
  };
};
