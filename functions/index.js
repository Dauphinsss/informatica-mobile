const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const serviceAccount = require('./mobile-1dae0-firebase-adminsdk-fbsvc-c0a0ef2f4e.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

exports.enviarPushNuevaNotificacion = functions.firestore
  .document('notificacionesUsuario/{notifUserId}')
  .onCreate(async (snap, context) => {
    const notifUsuario = snap.data();
    const { userId, notificacionId } = notifUsuario;
    const notifUsuarioId = context.params?.notifUserId;

    console.log(`[FCM] Nueva notificación para usuario: ${userId}, notifId: ${notificacionId}`);

    const notifDoc = await admin.firestore()
      .collection('notificaciones')
      .doc(notificacionId)
      .get();
    const notifData = notifDoc.data();

    if (!notifData) {
      console.log('[FCM] Notificación no encontrada');
      return null;
    }

    console.log(`[FCM] Metadata: ${JSON.stringify(notifData.metadata)}`);

     if (notifData.metadata?.accion === 'ver_publicacion' || notifData.metadata?.publicacionId) {
      console.log('[FCM] Es notificación de publicación, ignorando en esta función');
      return null;
    }

    const usuarioDoc = await admin.firestore()
      .collection('usuarios')
      .doc(userId)
      .get();
    
    if (!usuarioDoc.exists) {
      console.log(`[FCM] Usuario ${userId} no existe`);
      return null;
    }

    const userData = usuarioDoc.data();
    const tokens = userData?.pushTokens || [];

    console.log(`[FCM] Usuario: ${userData.nombre || 'Sin nombre'}, Tokens: ${tokens.length}`);

    if (tokens.length === 0) {
      console.log(`[FCM] Usuario ${userData.nombre || userId} sin tokens registrados`);
      return null;
    }

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

    console.log(`[FCM] Enviando a token: ${tokens[0].substring(0, 20)}...`);

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`[FCM] Notificaciones enviadas: ${response.successCount}/${response.responses.length}`);
      
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.log(`[FCM] Error en token ${idx}: ${resp.error?.message}`);
          }
        });
      }
    } catch (error) {
      console.log('[FCM] Error enviando notificaciones push:', error);
    }

    return null;
  });

// Nueva función dedicada a notificaciones de nueva publicación
exports.enviarPushNuevaPublicacion = functions.firestore
  .document('notificacionesUsuario/{notifUserId}')
  .onCreate(async (snap, context) => {
    const notifUsuario = snap.data();
    const { userId, notificacionId } = notifUsuario;
    const notifUsuarioId = context.params?.notifUserId;

    const notifDoc = await admin.firestore()
      .collection('notificaciones')
      .doc(notificacionId)
      .get();
    const notifData = notifDoc.data();

    if (!notifData) {
      console.log('Notificación no encontrada (publicacion)');
      return null;
    }

    // Solo procesar notificaciones que correspondan a publicaciones
    if (!(notifData.metadata?.accion === 'ver_publicacion' || notifData.metadata?.publicacionId)) {
      console.log('ℹ️ [Functions] Notificación no es de tipo publicacion — ignorando en enviarPushNuevaPublicacion');
      return null;
    }

    // Obtiene los tokens del usuario
    const usuarioDoc = await admin.firestore()
      .collection('usuarios')
      .doc(userId)
      .get();
    const tokens = usuarioDoc.data()?.pushTokens || [];

    if (tokens.length === 0) {
      console.log('Usuario sin tokens registrados (publicacion)');
      return null;
    }

    const materiaId = notifData.metadata?.materiaId || '';
    const publicacionId = notifData.metadata?.publicacionId || '';

    const message = {
      notification: {
        title: notifData.titulo,
        body: notifData.descripcion,
      },
      tokens: [tokens[0]],
      data: {
        materiaId,
        materiaNombre: notifData.metadata?.materiaNombre || '',
        accion: 'ver_publicacion',
        publicacionId,
        deepLink: materiaId && publicacionId ? `informatica://materias/${materiaId}/publicaciones/${publicacionId}` : '',
      },
    };

    try {
      console.log(`ℹ️ [Functions] Enviando notificacion publicacion user=${userId} notifUser=${notifUsuarioId} tokens=${tokens.length} target=${tokens[0]}`);
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log('Notificaciones enviadas (publicacion):', response.successCount, 'responses:', response.responses?.length);

      // Marcar el documento como procesado para evitar duplicados posteriores
      try {
        const ref = admin.firestore().collection('notificacionesUsuario').doc(notifUsuarioId);
        await ref.update({ enviadoPublicacion: true });
        console.log(`✅ Marcado notificacionesUsuario/${notifUsuarioId} como enviadoPublicacion`);
      } catch (err) {
        console.log('⚠️ Error marcando notificacionesUsuario como enviadoPublicacion:', err);
      }
    } catch (error) {
      console.log('Error enviando notificaciones push (publicacion):', error);
    }

    return null;
  });