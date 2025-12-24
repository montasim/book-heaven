import * as jose from "jose";

export async function generateZhipuToken(apiKey: string) {
    const [id, secret] = apiKey.split(".");
    const timestamp = Date.now();
    const payload = {
        api_key: id,
        exp: timestamp + 3600000, // 1 hour
        timestamp: timestamp,
    };
    const secretKey = new TextEncoder().encode(secret);
    const token = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: "HS256", sign_type: "SIGN" })
        .sign(secretKey);
    return token;
}
