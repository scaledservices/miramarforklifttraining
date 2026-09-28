import { renderCertificatePdf } from '../server/certificate-template';
import { mkdir, writeFile } from 'node:fs/promises';
const out = '/tmp/miramar-0917-preview';
await mkdir(out, { recursive: true });
process.env.CERTIFICATE_BASE_URL = 'https://exquisite-perception-staging-725a.up.railway.app';
for (const language of ['en', 'es']) {
  const buffer = await renderCertificatePdf({
    cert: { certificateNumber: 'PREVIEW-NOT-VALID', issuedAt: '2026-09-17T12:00:00Z', expiresAt: '2029-09-17T12:00:00Z' },
    user: { name: 'SAMPLE - NOT A VALID CERTIFICATE' },
    course: { slug: 'online-forklift-operator-certification', title: language === 'es' ? 'Certificación de Operador de Montacargas' : 'Forklift Operator Certification', language },
    trainingEnrollment: { completedAt: '2026-09-17T12:00:00Z' },
  });
  await writeFile(`${out}/certificate-${language}.pdf`, buffer);
  console.log(`${language}: rendered ${buffer.length} bytes; no database or issuance used`);
}
