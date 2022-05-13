import { BufReader, BufWriter } from 'https://deno.land/std@0.138.0/io/buffer.ts'
import { TextProtoReader } from "https://deno.land/std@0.138.0/textproto/mod.ts";

const CommandCode = {
    READY: 220,
    AUTHO_SUCCESS: 235,
    OK: 250,
    BEGIN_DATA: 354,
    FAIL: 554,
};

export interface ConnectConfig {
    hostname: string;
    port?: number;
    username?: string;
    password?: string;
}

export interface SendConfig {
    to: string;
    from: string;
    date?: string;
    subject: string;
    content: string;
    html?: string;
}

const encoder = new TextEncoder();

interface Command {
    code: number;
    args: string;
}


enum ContentTransferEncoding {
    "7bit" = "7bit",
    "8bit" = "8bit",
    "base64" = "base64",
    "binary" = "binary",
    "quoted-printable" = "quoted-printable",
}

interface SmtpClientOptions {
    content_encoding?: "7bit" | "8bit" | "base64" | "binary" | "quoted-printable";
    console_debug?: boolean;
}

function assertCode(cmd: Command | null, code: number, msg?: string) {
    if (!cmd) {
        throw new Error(`invalid cmd`);
    }
    if (cmd.code !== code) {
        throw new Error(msg || cmd.code + ": " + cmd.args);
    }
}

export function parseAddress(email: string): [string, string] {
    const m = email.toString().match(/(.*)\s<(.*)>/);
    return m?.length === 3
        ? [`<${m[2]}>`, email]
        : [`<${email}>`, `<${email}>`];
}

export class SmtpClient {
    private _conn: Deno.Conn | null;
    private _reader: TextProtoReader | null;
    private _writer: BufWriter | null;

    private _console_debug = false;
    private _content_encoding: ContentTransferEncoding;

    constructor({
        content_encoding = ContentTransferEncoding["quoted-printable"],
        console_debug = false,
    }: SmtpClientOptions = {}) {
        this._conn = null;
        this._reader = null;
        this._writer = null;
        this._console_debug = console_debug;

        const _content_encoding = String(content_encoding).toLowerCase();
        if (!(_content_encoding in ContentTransferEncoding)) {
            throw new Error(
                `${JSON.stringify(content_encoding)} is not a valid content encoding`,
            );
        }
        this._content_encoding = _content_encoding as ContentTransferEncoding;
    }

    async connect(config: ConnectConfig) {
        const conn = await Deno.connect({
            hostname: config.hostname,
            port: config.port || 25,
        });
        await this._connect(conn, config);
    }

    async connectTLS(config: ConnectConfig) {
        const conn = await Deno.connectTls({
            hostname: config.hostname,
            port: config.port || 465,
        });
        await this._connect(conn, config);
    }

    close() {
        this._conn?.close();
    }

    async send(config: SendConfig) {
        const [from, fromData] = parseAddress(config.from);
        const [to, toData] = parseAddress(config.to);
        const date = config.date ?? new Date().toString();

        await this.writeCmd("MAIL", "FROM:", from);
        assertCode(await this.readCmd(), CommandCode.OK);
        await this.writeCmd("RCPT", "TO:", to);
        assertCode(await this.readCmd(), CommandCode.OK);
        await this.writeCmd("DATA");
        assertCode(await this.readCmd(), CommandCode.BEGIN_DATA);

        await this.writeCmd("Subject: ", config.subject);
        await this.writeCmd("From: ", fromData);
        await this.writeCmd("To: ", toData);
        await this.writeCmd("Date: ", date);

        if (config.html) {
            await this.writeCmd("Content-Type: multipart/alternative; boundary=AlternativeBoundary", "\r\n");
            await this.writeCmd("--AlternativeBoundary");
            await this.writeCmd('Content-Type: text/plain; charset="utf-8"', "\r\n");
            await this.writeCmd(config.content, "\r\n");
            await this.writeCmd("--AlternativeBoundary");
            await this.writeCmd('Content-Type: text/html; charset="utf-8"', "\r\n");
            await this.writeCmd(config.html, "\r\n.\r\n");
        } else {
            await this.writeCmd("MIME-Version: 1.0");
            await this.writeCmd("Content-Type: text/plain;charset=utf-8");
            await this.writeCmd(`Content-Transfer-Encoding: ${this._content_encoding}`,"\r\n");
            await this.writeCmd(config.content, "\r\n.\r\n");
        }

        assertCode(await this.readCmd(), CommandCode.OK);
    }

    private async _connect(conn: Deno.Conn, config: ConnectConfig) {
        this._conn = conn;
        const reader = new BufReader(this._conn);
        this._writer = new BufWriter(this._conn);
        this._reader = new TextProtoReader(reader);

        assertCode(await this.readCmd(), CommandCode.READY);

        await this.writeCmd("EHLO", config.hostname);
        while (true) {
            const cmd = await this.readCmd();
            if (!cmd || !cmd.args.startsWith("-")) break;
        }

        if (config.username && config.password) {
            await this.writeCmd("AUTH", "LOGIN");
            assertCode(await this.readCmd(), 334);

            await this.writeCmd(btoa(config.username));
            assertCode(await this.readCmd(), 334);

            await this.writeCmd(btoa(config.password));
            assertCode(await this.readCmd(), CommandCode.AUTHO_SUCCESS);
        }
    }

    private async readCmd(): Promise<Command | null> {
        if (!this._reader) {
            return null;
        }
        const result = await this._reader.readLine();
        if (result === null) return null;
        const cmdCode = parseInt(result.slice(0, 3).trim());
        const cmdArgs = result.slice(3).trim();
        return {
            code: cmdCode,
            args: cmdArgs,
        };
    }

    private async writeCmd(...args: string[]) {
        if (!this._writer) {
            return null;
        }

        if (this._console_debug) {
            console.table(args);
        }

        const data = encoder.encode([...args].join(" ") + "\r\n");
        await this._writer.write(data);
        await this._writer.flush();
    }
}
