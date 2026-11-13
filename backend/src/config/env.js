require('dotenv').config();

// Sin valores por defecto: un secreto conocido permitiría falsificar sesiones y boletos
for (const name of ['JWT_SECRET', 'QR_HMAC_SECRET']) {
  if (!process.env[name] || process.env[name].length < 32) {
    console.error(`[Config] Falta la variable ${name} o tiene menos de 32 caracteres. El servidor no arranca sin ella.`);
    process.exit(1);
  }
}
