import { ConnectConfig, SendConfig, SmtpClient } from "./smtp.ts"

interface mailBody {
    connect: ConnectConfig;
    mail: SendConfig;
}

const port = +(Deno.env.get('PORT') ?? 80);

export async function handler(req: Request) {
    try {
        const body = (await req.json()) as mailBody;
        const client = new SmtpClient();
        await client.connect(body.connect);
        await client.send(body.mail);
        await client.close();
        return new Response(undefined, { status: 200 });
    } catch (e) {
        console.log(e);
        return new Response(JSON.stringify(e), { status: 400 });
    }
}

if (import.meta.main) Deno.serve({ port }, handler);
