// /api/rsvp.js
// Endpoint único para el RSVP. Vive en el mismo dominio de Vercel que la página,
// así que no hay problemas de CORS como con Apps Script.
//
// GET  /api/rsvp?id=JL-001        -> busca al invitado por su código
// POST /api/rsvp {id, asiste, acompanantes, restricciones} -> guarda su confirmación
//
// Variables de entorno necesarias en Vercel (Project Settings > Environment Variables):
//   GOOGLE_SERVICE_ACCOUNT_EMAIL
//   GOOGLE_PRIVATE_KEY
//   GOOGLE_SHEET_ID
//
// Estructura esperada de la hoja "Invitados" (fila 1 = encabezados, datos desde la fila 2):
//   A: ID (JL-001)  B: Nombre  C: Confirmado (SI/NO/PENDIENTE)
//   D: Acompañantes E: Restricciones  F: Mesa  G: Fecha de confirmación

const { google } = require('googleapis');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const RANGE = 'Invitados!A2:G';

function getAuth() {
  return new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
}

module.exports = async (req, res) => {
  // Mismo origen en producción, pero dejamos esto abierto por si pruebas en local.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // --- BUSCAR INVITADO POR CÓDIGO ---
    if (req.method === 'GET') {
      const id = String(req.query.id || '').trim().toUpperCase();
      if (!id) return res.status(400).json({ error: 'Falta el código de invitación.' });

      const result = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: RANGE });
      const rows = result.data.values || [];
      const row = rows.find(r => (r[0] || '').trim().toUpperCase() === id);

      if (!row) return res.status(404).json({ error: 'No encontramos ese código. Revisa tu invitación.' });

      return res.status(200).json({
          id: row[0],
          nombre: row[1] || '',
          confirmado: row[2] || 'PENDIENTE',
          boletos: row[3] || '1',
          restricciones: row[4] || '',
          mesa: row[5] || ''
      });
    }

    // --- GUARDAR CONFIRMACIÓN ---
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        const { id, asiste, restricciones } = body;
        const cleanId = String(id || '').trim().toUpperCase();
        if (!cleanId) return res.status(400).json({ error: 'Falta el código de invitación.' });

        const result = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: RANGE });
        const rows = result.data.values || [];
        const rowIndex = rows.findIndex(r => (r[0] || '').trim().toUpperCase() === cleanId);

        if (rowIndex === -1) return res.status(404).json({ error: 'No encontramos ese código.' });

        const boletosActuales = rows[rowIndex][3] || '1';
        const mesaActual = rows[rowIndex][5] || '';
        const sheetRow = rowIndex + 2;

        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `Invitados!C${sheetRow}:G${sheetRow}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    asiste ? 'SI' : 'NO',
                    boletosActuales,
                    asiste ? (restricciones || '') : '',
                    mesaActual,
                    new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })
                ]]
            }
        });

      return res.status(200).json({
        status: 'success',
        message: asiste
          ? '¡Gracias! Tu asistencia quedó registrada.'
          : 'Gracias por avisarnos. ¡Te extrañaremos!',
        mesa: mesaActual
      });
    }

    return res.status(405).json({ error: 'Método no permitido.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error del servidor. Intenta de nuevo en un momento.' });
  }
};
