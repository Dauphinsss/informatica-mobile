const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const serviceAccount = require('./mobile-1dae0-firebase-adminsdk-fbsvc-80d9e727aa.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

exports.enviarPushNuevaNotificacion = functions.firestore
  .document('notificacionesUsuario/{notifUserId}')
  .onCreate(async (snap, context) => {
    const notifUsuario = snap.data();
    const { userId, notificacionId } = notifUsuario;

    // Obtiene la notificación base para título y descripción
    const notifDoc = await admin.firestore()
      .collection('notificaciones')
      .doc(notificacionId)
      .get();
    const notifData = notifDoc.data();

    if (!notifData) {
      console.log('Notificación no encontrada');
      return null;
    }

    // Obtiene los tokens del usuario
    const usuarioDoc = await admin.firestore()
      .collection('usuarios')
      .doc(userId)
      .get();
    const tokens = usuarioDoc.data()?.pushTokens || [];

    if (tokens.length === 0) {
      console.log('Usuario sin tokens registrados');
      return null;
    }

    // Construye el mensaje
    const message = {
      notification: {
        title: notifData.titulo,
        body: notifData.descripcion,
      },
      tokens: [tokens[0]],
      data: {
        materiaId: notifData.metadata?.materiaId || '',
        materiaNombre: notifData.metadata?.materiaNombre || '',
        accion: notifData.metadata?.accion || '',
      },
    };

    try {
      // Envía la notificación a todos los dispositivos
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log('Notificaciones enviadas:', response.successCount);
    } catch (error) {
      console.log('Error enviando notificaciones push:', error);
    }

    return null;
  });
