import { Status } from 'std/http/http_status.ts';
import { ConnectConfig, SendConfig, SmtpClient } from "./smtp.ts"

interface mailBody {
    connect: ConnectConfig;
    mail: SendConfig;
}

const port = +Deno.env.get('PORT')!;

export async function handler(req: Request) {
    try {
        try {
            const body = (await req.json()) as mailBody;
            const client = new SmtpClient();
            await client.connect(body.connect);
            await client.send(body.mail);
            await client.close();
            return new Response(undefined, { status: Status.OK });
        } catch (e) {
            return new Response(JSON.stringify(e), { status: Status.BadRequest });
        }
    } catch (e) {
        console.log(e);
        return new Response(JSON.stringify(e), { status: Status.InternalServerError });
    }
}

if (import.meta.main) Deno.serve({ port }, handler);
