import { create, verify, type Header, type Payload } from "djwt";
import { decodeBase64 } from '$std/encoding/base64.ts';

const key = await crypto.subtle.importKey(
    'raw',
    decodeBase64(Deno.env.get('MAIL_KEY')!),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
);
const tokenHeader: Header = { alg: "HS256", typ: "JWT" };
const expire = () => Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60;

export async function createToken(payload?: Payload) {
    return await create(tokenHeader, { iss: "sholvoir.com", sub: "mail", exp: expire(), ...payload }, key);
}

export async function verifyToken(token: string): Promise<Payload> {
    return await verify(token, key);
}