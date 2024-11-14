import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

interface Message {
  nombre: string;
  mensaje: string;
}

export async function getMessages(): Promise<Message[]> {
  try {
    console.log('Iniciando conexión con Google Sheets...');
    
    const SCOPES = [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
    ];

    // Verificar que tenemos las variables de entorno
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
      console.error('Faltan variables de entorno necesarias');
      return [];
    }

    const jwt = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: SCOPES,
    });

    console.log('JWT creado, intentando acceder al documento...');

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, jwt);
    await doc.loadInfo();

    console.log('Documento cargado, buscando hoja "Mensajes"...');

    const sheet = doc.sheetsByTitle['Mensajes'];
    if (!sheet) {
      console.error('No se encontró la hoja "Mensajes"');
      return [];
    }

    console.log('Obteniendo filas...');
    const rows = await sheet.getRows({
        offset: 1,
        limit: 50
    });
    console.log('Filas obtenidas:', rows.length);

    const messages = rows
      .map(row => {
        const nombre = String(row.get('Nombre') || '').trim();
        const mensaje = String(row.get('Mensaje') || '').trim();
        console.log('Procesando mensaje:', { nombre, mensaje });
        
        if (nombre && mensaje && nombre !== 'ee' && mensaje !== 'red') {
          return { nombre, mensaje };
        }
        return null;
      })
      .filter((msg): msg is Message => msg !== null);

    console.log('Mensajes procesados:', messages.length);
    console.log('Mensajes finales:', messages);

    return messages;

  } catch (error) {
    console.error('Error detallado en getMessages:', error);
    return [];
  }
} 