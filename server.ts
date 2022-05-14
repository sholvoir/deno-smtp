import { Status } from 'https://deno.land/std@0.138.0/http/http_status.ts';
import { serve } from "https://deno.land/std@0.138.0/http/server.ts";
import { ConnectConfig, SendConfig, SmtpClient } from "./smtp.ts"

interface mailBody {
    ntls?: boolean;
    connect: ConnectConfig;
    mail: SendConfig;
}

const port = +Deno.env.get('PORT')!;

export async function handler(req: Request) {
    try {
        const body = (await req.json()) as mailBody;
        const client = new SmtpClient();
        if (body.ntls) await client.connect(body.connect);
        else await client.connectTLS(body.connect);
        await client.send(body.mail);
        client.close();
        return new Response(undefined, { status: Status.OK });
    } catch (e) {
        console.log(e);
        return new Response(JSON.stringify(e), { status: Status.InternalServerError });
    }
}

if (import.meta.main) await serve(handler, { port });
