import { createToken, verifyToken } from "./jwt.ts";

Deno.test('Create Token', async () => {
    const token = await createToken();
    console.log(`token: ${token}`);
    console.log(await verifyToken(token));
});