import { JWT } from "sholvoir/jwt.ts";
import { SmtpClient, type Config, type Mail } from "./smtp.ts"

const jwt = await new JWT().importKey(Deno.env.get('APP_KEY')!);

const config: Config = {
    hostname: Deno.env.get('MAIL_SERVER')!,
    mailPort: +(Deno.env.get('MAIL_PORT') ?? 465),
    username: Deno.env.get('MAIL_USER')!,
    password: Deno.env.get('MAIL_PASS')!,
};

const port = +(Deno.env.get('PORT') ?? 80);

export async function handler(req: Request) {
    try {
        const token = req.headers.get('Authorization')?.match(/Bearer (.*)/)?.at(1);
        if (!token || !await jwt.verifyToken(token)) return new Response(undefined, { status: 401 });
        const mail = await req.json() as Mail;
        const client = new SmtpClient();
        await client.connect(config);
        await client.send(mail);
        await client.close();
        return new Response(undefined, { status: 200 });
    } catch (e) {
        console.log(e);
        return new Response(JSON.stringify(e), { status: 400 });
    }
}

if (import.meta.main) Deno.serve({ port }, handler);
