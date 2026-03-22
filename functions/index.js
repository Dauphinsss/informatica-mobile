const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

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
      data: {
        materiaId: notifData.metadata?.materiaId || '',
        materiaNombre: notifData.metadata?.materiaNombre || '',
        accion: notifData.metadata?.accion || '',
      },
      tokens: [tokens[0]],
      android: {
        priority: 'high',
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

async function registrarActividad(tipo, titulo, descripcion, actorUid = null, actorNombre = null, relacionadoUid = null, metadata = {}) {
  try {
    const actividadRef = admin.firestore().collection('actividad_reciente');
    const snapshot = await actividadRef.orderBy('timestamp', 'desc').get();
    if (snapshot.size >= 200) {
      const exceso = snapshot.size - 199;
      const docsAEliminar = snapshot.docs.slice(-exceso);
      
      const batch = admin.firestore().batch();
      docsAEliminar.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      
      console.log(`[Actividad] Eliminados ${exceso} registros antiguos`);
    }
    
    await actividadRef.add({
      tipo,
      titulo,
      descripcion,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      actorUid,
      actorNombre,
      relacionadoUid,
      metadata,
    });
    
    console.log(`[Actividad] Registrado: ${tipo} - ${titulo}`);
  } catch (error) {
    console.error('[Actividad] Error registrando:', error);
  }
}

async function notificarAdminsPublicacionPendiente(pubData, pubId) {
  try {
    const estado = String(pubData?.estado || '').toLowerCase();
    if (estado !== 'pendiente') return;

    const adminsSnap = await admin
      .firestore()
      .collection('usuarios')
      .where('rol', 'in', ['admin', 'administrador', 'administrator'])
      .get();

    const adminIds = adminsSnap.docs
      .filter((d) => {
        const data = d.data() || {};
        const estadoUsuario = String(data.estado || 'activo').toLowerCase();
        return estadoUsuario === 'activo';
      })
      .map((d) => d.id);

    if (adminIds.length === 0) {
      console.log('[AdminNotif] No hay administradores activos para notificar');
      return;
    }

    let materiaNombre = pubData?.materiaNombre || '';
    const materiaId = pubData?.materiaId || pubData?.subjectUid || pubData?.materiaUid || pubData?.subjectId || '';
    if (!materiaNombre && materiaId) {
      const materiaDoc = await admin.firestore().collection('materias').doc(materiaId).get();
      if (materiaDoc.exists) {
        materiaNombre = materiaDoc.data()?.nombre || '';
      }
    }

    const notifRef = await admin.firestore().collection('notificaciones').add({
      titulo: 'Publicación pendiente por revisar',
      descripcion: `${pubData?.autorNombre || 'Un usuario'} envió "${pubData?.titulo || 'Publicación'}" para aprobación`,
      icono: 'newspaper-variant-multiple',
      tipo: 'advertencia',
      creadoEn: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        accion: 'revisar_publicaciones_pendientes',
        tipo: 'admin_review',
        publicacionId: pubId,
        materiaId: materiaId || '',
        materiaNombre: materiaNombre || '',
        publicacionTitulo: pubData?.titulo || '',
        actorUid: pubData?.autorUid || null,
        actorNombre: pubData?.autorNombre || null,
        actorFoto: pubData?.autorFoto || null,
      },
    });

    const batch = admin.firestore().batch();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    adminIds.forEach((adminId) => {
      const refId = `${adminId}_${notifRef.id}`;
      batch.set(admin.firestore().collection('notificacionesUsuario').doc(refId), {
        notificacionId: notifRef.id,
        userId: adminId,
        leida: false,
        creadoEn: timestamp,
      });
    });
    await batch.commit();
    console.log(`[AdminNotif] Notificación pendiente enviada a ${adminIds.length} admin(s)`);
  } catch (error) {
    console.error('[AdminNotif] Error notificando admins por publicación pendiente:', error);
  }
}

exports.registrarUsuarioNuevo = functions.firestore
  .document('usuarios/{userId}')
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    const userId = context.params.userId;
    
    await registrarActividad(
      'usuario_registrado',
      'Nuevo usuario',
      `${userData.nombre || 'Usuario'} se ha registrado en la plataforma`,
      userId,
      userData.nombre,
      userId,
      { email: userData.correo }
    );
    
    return null;
  });

exports.registrarPublicacionNueva = functions.firestore
  .document('publicaciones/{pubId}')
  .onCreate(async (snap, context) => {
    const pubData = snap.data();
    const pubId = context.params.pubId;
    
    let autorNombre = 'Usuario desconocido';
    if (pubData.autorUid) {
      const autorDoc = await admin.firestore().collection('usuarios').doc(pubData.autorUid).get();
      if (autorDoc.exists) {
        autorNombre = autorDoc.data().nombre || 'Usuario desconocido';
      }
    }
    
    let materiaNombre = '';
    const materiaId = pubData.materiaId || pubData.subjectUid || pubData.materiaUid || pubData.subjectId;
    if (materiaId) {
      const materiaDoc = await admin.firestore().collection('materias').doc(materiaId).get();
      if (materiaDoc.exists) {
        materiaNombre = materiaDoc.data().nombre || '';
      }
    }
    
    await registrarActividad(
      'publicacion_creada',
      'Nueva publicación',
      `${autorNombre} publicó "${pubData.titulo || 'Sin título'}"${materiaNombre ? ` en ${materiaNombre}` : ''}`,
      pubData.autorUid,
      autorNombre,
      pubId,
      { materiaId, materiaNombre, titulo: pubData.titulo }
    );

    await notificarAdminsPublicacionPendiente(pubData, pubId);
    
    return null;
  });

exports.registrarMateriaNueva = functions.firestore
  .document('materias/{materiaId}')
  .onCreate(async (snap, context) => {
    const materiaData = snap.data();
    const materiaId = context.params.materiaId;
    
    await registrarActividad(
      'materia_creada',
      'Nueva materia agregada',
      `La materia "${materiaData.nombre || 'Sin nombre'}" ha sido creada`,
      null,
      'Admin System',
      materiaId,
      { nombre: materiaData.nombre, descripcion: materiaData.descripcion }
    );
    
    return null;
  });

exports.registrarReporteNuevo = functions.firestore
  .document('reportes/{reporteId}')
  .onCreate(async (snap, context) => {
    const reporteData = snap.data();
    const reporteId = context.params.reporteId;
    
    let reportanteNombre = 'Usuario desconocido';
    if (reporteData.reportadoPor) {
      const userDoc = await admin.firestore().collection('usuarios').doc(reporteData.reportadoPor).get();
      if (userDoc.exists) {
        reportanteNombre = userDoc.data().nombre || 'Usuario desconocido';
      }
    }
    
    let tituloPublicacion = 'Publicación';
    if (reporteData.publicacionUid) {
      const pubDoc = await admin.firestore().collection('publicaciones').doc(reporteData.publicacionUid).get();
      if (pubDoc.exists) {
        tituloPublicacion = pubDoc.data().titulo || 'Publicación';
      }
    }
    
    await registrarActividad(
      'publicacion_reportada',
      'Nuevo reporte',
      `${reportanteNombre} reportó "${tituloPublicacion}" por ${reporteData.motivo || 'motivo no especificado'}`,
      reporteData.reportadoPor,
      reportanteNombre,
      reporteId,
      { 
        publicacionUid: reporteData.publicacionUid,
        motivo: reporteData.motivo,
        estado: reporteData.estado
      }
    );
    
    return null;
  });

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

    if (!(notifData.metadata?.accion === 'ver_publicacion' || notifData.metadata?.publicacionId)) {
      console.log('ℹ️ [Functions] Notificación no es de tipo publicacion — ignorando en enviarPushNuevaPublicacion');
      return null;
    }

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
      data: {
        materiaId,
        materiaNombre: notifData.metadata?.materiaNombre || '',
        accion: 'ver_publicacion',
        publicacionId,
        deepLink:
          materiaId && publicacionId
            ? `informatica:/materias/${materiaId}/publicaciones/${publicacionId}`
            : '',
      },
      tokens: [tokens[0]],
      android: {
        priority: 'high',
      },
    };

    try {
      console.log(`ℹ️ [Functions] Enviando notificacion publicacion user=${userId} notifUser=${notifUsuarioId} tokens=${tokens.length} target=${tokens[0]}`);
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log('Notificaciones enviadas (publicacion):', response.successCount, 'responses:', response.responses?.length);

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
