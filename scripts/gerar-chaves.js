// Gera as chaves das notificações (rode uma única vez: npm run chaves)
import webpush from "web-push";
import { randomBytes } from "node:crypto";
const k = webpush.generateVAPIDKeys();
console.log("\nCopie estas variáveis para a Vercel (Settings → Environment Variables):\n");
console.log(`VAPID_PUBLIC_KEY=${k.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${k.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:seu-email@exemplo.com`);
console.log(`PAINEL_SENHA=${randomBytes(9).toString("base64url")}   (sugestão — pode trocar)\n`);
