import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  getCountFromServer,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  GeneralStats,
  RankingStats,
  UserRanking,
  SubjectRanking,
  PostRanking,
  TimeFilter,
  PeriodComparison,
  ChartDataPoint,
  PostSortType,
} from "@/scripts/types/Statistics.type";

const getTimeRange = (filter: TimeFilter): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);

  switch (filter) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case '7days':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30days':
      startDate.setDate(now.getDate() - 30);
      break;
    case '6months':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case 'all':
      startDate = new Date(2020, 0, 1);
      break;
  }

  return { startDate, endDate };
};

const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  const percentage = ((current - previous) / previous) * 100;
  return Math.round(percentage);
};

export const getTotalUsers = async (): Promise<number> => {
  try {
    const usuariosRef = collection(db, "usuarios");
    const snapshot = await getCountFromServer(usuariosRef);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error obteniendo total de usuarios:", error);
    return 0;
  }
};

export const getTotalUsersWithComparison = async (): Promise<PeriodComparison> => {
  try {
    const now = new Date();
    const startCurrent = new Date(now);
    startCurrent.setDate(now.getDate() - 30);

    const startPrevious = new Date(now);
    startPrevious.setDate(now.getDate() - 60);
    const endPrevious = new Date(now);
    endPrevious.setDate(now.getDate() - 30);

    const usuariosRef = collection(db, "usuarios");
    const snapshotTotal = await getCountFromServer(usuariosRef);
    const total = snapshotTotal.data().count;
    const qCurrent = query(
      usuariosRef,
      where("creadoEn", ">=", Timestamp.fromDate(startCurrent)),
      where("creadoEn", "<=", Timestamp.fromDate(now))
    );
    const snapshotCurrent = await getCountFromServer(qCurrent);
    const current = snapshotCurrent.data().count;
    const qPrevious = query(
      usuariosRef,
      where("creadoEn", ">=", Timestamp.fromDate(startPrevious)),
      where("creadoEn", "<", Timestamp.fromDate(endPrevious))
    );
    const snapshotPrevious = await getCountFromServer(qPrevious);
    const previous = snapshotPrevious.data().count;

    return {
      current,
      previous,
      percentageChange: calculatePercentageChange(current, previous),
      total,
    };
  } catch (error) {
    console.error("Error en getTotalUsersWithComparison:", error);
    return { current: 0, previous: 0, percentageChange: 0, total: 0 };
  }
};

export const getActivePostsWithComparison = async (): Promise<PeriodComparison> => {
  try {
    const now = new Date();
    
    const startCurrent = new Date(now);
    startCurrent.setDate(now.getDate() - 30);
    
    const startPrevious = new Date(now);
    startPrevious.setDate(now.getDate() - 60);
    const endPrevious = new Date(now);
    endPrevious.setDate(now.getDate() - 30);

    const publicacionesRef = collection(db, "publicaciones");
    const qTotal = query(publicacionesRef, where("estado", "==", "activo"));
    const snapshotTotal = await getCountFromServer(qTotal);
    const total = snapshotTotal.data().count;
    
    const qCurrent = query(
      publicacionesRef,
      where("fechaPublicacion", ">=", Timestamp.fromDate(startCurrent)),
      where("fechaPublicacion", "<=", Timestamp.fromDate(now)),
      where("estado", "==", "activo")
    );
    const snapshotCurrent = await getCountFromServer(qCurrent);
    const current = snapshotCurrent.data().count;

    const qPrevious = query(
      publicacionesRef,
      where("fechaPublicacion", ">=", Timestamp.fromDate(startPrevious)),
      where("fechaPublicacion", "<", Timestamp.fromDate(endPrevious)),
      where("estado", "==", "activo")
    );
    const snapshotPrevious = await getCountFromServer(qPrevious);
    const previous = snapshotPrevious.data().count;

    return {
      current,
      previous,
      percentageChange: calculatePercentageChange(current, previous),
      total,
    };
  } catch (error) {
    console.error("Error en getActivePostsWithComparison:", error);
    return { current: 0, previous: 0, percentageChange: 0, total: 0 };
  }
};

export const getPendingReportsWithComparison = async (): Promise<PeriodComparison> => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const reportesRef = collection(db, "reportes");
    const qCurrent = query(reportesRef, where("estado", "==", "pendiente"));
    const snapshotCurrent = await getCountFromServer(qCurrent);
    const current = snapshotCurrent.data().count;
    const total = current;

    const qPrevious = query(
      reportesRef,
      where("estado", "==", "pendiente"),
      where("fechaCreacion", "<=", Timestamp.fromDate(thirtyDaysAgo))
    );
    const snapshotPrevious = await getCountFromServer(qPrevious);
    const previous = snapshotPrevious.data().count;

    return {
      current,
      previous,
      percentageChange: calculatePercentageChange(current, previous),
      total,
    };
  } catch (error) {
    console.error("Error en getPendingReportsWithComparison:", error);
    return { current: 0, previous: 0, percentageChange: 0, total: 0 };
  }
};

export const getTotalReportsWithComparison = async (): Promise<PeriodComparison> => {
  try {
    const now = new Date();
    
    const startCurrent = new Date(now);
    startCurrent.setDate(now.getDate() - 30);
    
    const startPrevious = new Date(now);
    startPrevious.setDate(now.getDate() - 60);
    const endPrevious = new Date(now);
    endPrevious.setDate(now.getDate() - 30);

    const reportesRef = collection(db, "reportes");
    
    const snapshotTotal = await getCountFromServer(reportesRef);
    const total = snapshotTotal.data().count;

    const qCurrent = query(
      reportesRef,
      where("fechaCreacion", ">=", Timestamp.fromDate(startCurrent)),
      where("fechaCreacion", "<=", Timestamp.fromDate(now))
    );
    const snapshotCurrent = await getCountFromServer(qCurrent);
    const current = snapshotCurrent.data().count;

    const qPrevious = query(
      reportesRef,
      where("fechaCreacion", ">=", Timestamp.fromDate(startPrevious)),
      where("fechaCreacion", "<", Timestamp.fromDate(endPrevious))
    );
    const snapshotPrevious = await getCountFromServer(qPrevious);
    const previous = snapshotPrevious.data().count;

    return {
      current,
      previous,
      percentageChange: calculatePercentageChange(current, previous),
      total,
    };
  } catch (error) {
    console.error("Error en getTotalReportsWithComparison:", error);
    return { current: 0, previous: 0, percentageChange: 0, total: 0 };
  }
};

export const getGeneralStats = async (): Promise<GeneralStats> => {
  try {
    const [users, posts, pendingReports, totalReports] = await Promise.all([
      getTotalUsersWithComparison(),
      getActivePostsWithComparison(),
      getPendingReportsWithComparison(),
      getTotalReportsWithComparison(),
    ]);

    return {
      totalUsers: users.current,
      totalUsersChange: users.percentageChange,
      totalUsersInSystem: users.total || 0,
      totalUsersPrevious: users.previous,
      
      activePosts: posts.current,
      activePostsChange: posts.percentageChange,
      activePostsInSystem: posts.total || 0,
      activePostsPrevious: posts.previous,
      
      pendingReports: pendingReports.current,
      pendingReportsChange: pendingReports.percentageChange,
      pendingReportsInSystem: pendingReports.total || 0,
      pendingReportsPrevious: pendingReports.previous,
      
      totalReports: totalReports.current,
      totalReportsChange: totalReports.percentageChange,
      totalReportsInSystem: totalReports.total || 0,
      totalReportsPrevious: totalReports.previous,
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas generales:", error);
    return {
      totalUsers: 0,
      totalUsersChange: 0,
      totalUsersInSystem: 0,
      totalUsersPrevious: 0,
      
      activePosts: 0,
      activePostsChange: 0,
      activePostsInSystem: 0,
      activePostsPrevious: 0,
      
      pendingReports: 0,
      pendingReportsChange: 0,
      pendingReportsInSystem: 0,
      pendingReportsPrevious: 0,
      
      totalReports: 0,
      totalReportsChange: 0,
      totalReportsInSystem: 0,
      totalReportsPrevious: 0,
    };
  }
};

export const getMostActiveUser = async (): Promise<UserRanking | null> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const publicacionesRef = collection(db, "publicaciones");
    const q = query(
      publicacionesRef,
      where("fechaPublicacion", ">=", Timestamp.fromDate(thirtyDaysAgo)),
      where("estado", "==", "activo")
    );
    
    const snapshot = await getDocs(q);
    const userPublicationCount = new Map<string, number>();
    snapshot.docs.forEach(doc => {
      const autorUid = doc.data().autorUid;
      userPublicationCount.set(autorUid, (userPublicationCount.get(autorUid) || 0) + 1);
    });

    let maxCount = 0;
    let topUserUid = "";
    
    userPublicationCount.forEach((count, uid) => {
      if (count > maxCount) {
        maxCount = count;
        topUserUid = uid;
      }
    });

    if (!topUserUid) return null;

    const userDoc = await getDoc(doc(db, "usuarios", topUserUid));
    if (!userDoc.exists()) return null;

    const userData = userDoc.data();
    return {
      uid: topUserUid,
      nombre: userData.nombre || "Usuario desconocido",
      foto: userData.foto,
      email: userData.correo,
      value: maxCount,
    };
  } catch (error) {
    console.error("Error obteniendo usuario más activo:", error);
    return null;
  }
};

export const getHottestSubject = async (): Promise<SubjectRanking | null> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const publicacionesRef = collection(db, "publicaciones");
    const q = query(
      publicacionesRef,
      where("fechaPublicacion", ">=", Timestamp.fromDate(thirtyDaysAgo)),
      where("estado", "==", "activo")
    );
    
    const snapshot = await getDocs(q);
    const subjectPublicationCount = new Map<string, number>();
    snapshot.docs.forEach(doc => {
      const data = doc.data() as any;
      const subjectUid = data.materiaId || data.subjectUid || data.materiaUid || data.subjectId;
      if (subjectUid) {
        subjectPublicationCount.set(subjectUid, (subjectPublicationCount.get(subjectUid) || 0) + 1);
      }
    });

    let maxCount = 0;
    let topSubjectUid = "";
    
    subjectPublicationCount.forEach((count, uid) => {
      if (count > maxCount) {
        maxCount = count;
        topSubjectUid = uid;
      }
    });

    if (!topSubjectUid) return null;

    const subjectDoc = await getDoc(doc(db, "materias", topSubjectUid));
    if (!subjectDoc.exists()) return null;

    const subjectData = subjectDoc.data();
    return {
      uid: topSubjectUid,
      nombre: subjectData.nombre || "Materia desconocida",
      descripcion: subjectData.descripcion,
      value: maxCount,
    };
  } catch (error) {
    console.error("Error obteniendo materia más popular:", error);
    return null;
  }
};

export const getMostReportedUser = async (): Promise<UserRanking | null> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const reportesRef = collection(db, "reportes");
    const q = query(
      reportesRef,
      where("fechaCreacion", ">=", Timestamp.fromDate(thirtyDaysAgo))
    );
    
    const snapshot = await getDocs(q);
    const reportCountByPub = new Map<string, number>();
    snapshot.docs.forEach(doc => {
      const publicacionUid = doc.data().publicacionUid;
      if (publicacionUid) {
        reportCountByPub.set(publicacionUid, (reportCountByPub.get(publicacionUid) || 0) + 1);
      }
    });

    const publicacionUids = Array.from(reportCountByPub.keys());
    if (publicacionUids.length === 0) return null;
    const autorReportCount = new Map<string, number>();
    const batchSize = 10;
    
    for (let i = 0; i < publicacionUids.length; i += batchSize) {
      const batch = publicacionUids.slice(i, i + batchSize);
      const publicacionesRef = collection(db, "publicaciones");
      const qPubs = query(publicacionesRef, where('__name__', 'in', batch));
      const pubsSnapshot = await getDocs(qPubs);
      
      pubsSnapshot.docs.forEach(pubDoc => {
        const autorUid = pubDoc.data().autorUid;
        if (autorUid) {
          const reportCount = reportCountByPub.get(pubDoc.id) || 0;
          autorReportCount.set(
            autorUid,
            (autorReportCount.get(autorUid) || 0) + reportCount
          );
        }
      });
    }

    let maxCount = 0;
    let topUserUid = "";
    
    autorReportCount.forEach((count, uid) => {
      if (count > maxCount) {
        maxCount = count;
        topUserUid = uid;
      }
    });

    if (!topUserUid) return null;

    const userDoc = await getDoc(doc(db, "usuarios", topUserUid));
    if (!userDoc.exists()) return null;

    const userData = userDoc.data();
    return {
      uid: topUserUid,
      nombre: userData.nombre || "Usuario desconocido",
      foto: userData.foto,
      email: userData.correo,
      value: maxCount,
    };
  } catch (error) {
    console.error("Error obteniendo usuario más reportado:", error);
    return null;
  }
};

export const getMostPopularPost = async (sortBy: PostSortType = 'views'): Promise<PostRanking | null> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const publicacionesRef = collection(db, "publicaciones");
    const q = query(
      publicacionesRef,
      where("fechaPublicacion", ">=", Timestamp.fromDate(thirtyDaysAgo)),
      where("estado", "==", "activo")
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;

    let topPost: any = null;
    let maxValue = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const value = sortBy === 'views' ? (data.vistas || 0) : (data.totalValoraciones || 0);
      
      if (value > maxValue) {
        maxValue = value;
        topPost = { uid: docSnap.id, ...data };
      }
    }

    if (!topPost) return null;

    const materiaId = topPost.materiaId || topPost.subjectUid || topPost.materiaUid || topPost.subjectId;
    
    const [autorDoc, materiaDoc] = await Promise.all([
      topPost.autorUid ? getDoc(doc(db, "usuarios", topPost.autorUid)) : Promise.resolve(null),
      materiaId ? getDoc(doc(db, "materias", materiaId)) : Promise.resolve(null)
    ]);

    const autorNombre = autorDoc?.exists() ? (autorDoc.data().nombre || "Usuario desconocido") : "Usuario desconocido";
    const materiaNombre = materiaDoc?.exists() ? materiaDoc.data().nombre : undefined;

    return {
      uid: topPost.uid,
      titulo: topPost.titulo || "Sin título",
      autorNombre,
      autorUid: topPost.autorUid,
      materiaNombre,
      views: topPost.vistas || 0,
      likes: topPost.totalValoraciones || 0,
      fechaCreacion: topPost.fechaPublicacion?.toDate() || new Date(),
      descripcion: topPost.descripcion,
    };
  } catch (error) {
    console.error("Error obteniendo publicación más popular:", error);
    return null;
  }
};

export const getRankingStats = async (): Promise<RankingStats> => {
  try {
    const [mostActiveUser, hottestSubject, mostReportedUser, mostPopularPost] = await Promise.all([
      getMostActiveUser(),
      getHottestSubject(),
      getMostReportedUser(),
      getMostPopularPost('views'),
    ]);

    return {
      mostActiveUser,
      hottestSubject,
      mostReportedUser,
      mostPopularPost,
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas de rankings:", error);
    return {
      mostActiveUser: null,
      hottestSubject: null,
      mostReportedUser: null,
      mostPopularPost: null,
    };
  }
};

export const getTopActiveUsers = async (timeFilter: TimeFilter): Promise<UserRanking[]> => {
  try {
    const { startDate } = getTimeRange(timeFilter);
    const publicacionesRef = collection(db, "publicaciones");
    const q = query(
      publicacionesRef,
      where("fechaPublicacion", ">=", Timestamp.fromDate(startDate)),
      where("estado", "==", "activo")
    );
    
    const snapshot = await getDocs(q);
    const userPublicationCount = new Map<string, number>();
    snapshot.docs.forEach(doc => {
      const autorUid = doc.data().autorUid;
      userPublicationCount.set(autorUid, (userPublicationCount.get(autorUid) || 0) + 1);
    });

    const userIds = Array.from(userPublicationCount.keys());
    if (userIds.length === 0) return [];

    const userDataMap = new Map<string, any>();
    const batchSize = 10;
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const usuariosRef = collection(db, "usuarios");
      const qUsers = query(usuariosRef, where('__name__', 'in', batch));
      const usersSnapshot = await getDocs(qUsers);
      
      usersSnapshot.docs.forEach(userDoc => {
        userDataMap.set(userDoc.id, userDoc.data());
      });
    }

    const rankings: UserRanking[] = [];
    
    userPublicationCount.forEach((count, uid) => {
      const userData = userDataMap.get(uid);
      if (userData) {
        rankings.push({
          uid,
          nombre: userData.nombre || "Usuario desconocido",
          foto: userData.foto,
          email: userData.correo,
          value: count,
        });
      }
    });

    return rankings.sort((a, b) => b.value - a.value).slice(0, 10);
  } catch (error) {
    console.error("Error obteniendo top usuarios activos:", error);
    return [];
  }
};

export const getTopPopularSubjects = async (timeFilter: TimeFilter): Promise<SubjectRanking[]> => {
  try {
    const { startDate } = getTimeRange(timeFilter);

    const publicacionesRef = collection(db, "publicaciones");
    const q = query(
      publicacionesRef,
      where("fechaPublicacion", ">=", Timestamp.fromDate(startDate)),
      where("estado", "==", "activo")
    );
    
    const snapshot = await getDocs(q);
    const subjectPublicationCount = new Map<string, number>();
    snapshot.docs.forEach(doc => {
      const data = doc.data() as any;
      const subjectUid = data.materiaId || data.subjectUid || data.materiaUid || data.subjectId;
      if (subjectUid) {
        subjectPublicationCount.set(subjectUid, (subjectPublicationCount.get(subjectUid) || 0) + 1);
      }
    });

    const subjectIds = Array.from(subjectPublicationCount.keys());
    if (subjectIds.length === 0) return [];

    const subjectDataMap = new Map<string, any>();
    const batchSize = 10;
    
    for (let i = 0; i < subjectIds.length; i += batchSize) {
      const batch = subjectIds.slice(i, i + batchSize);
      const materiasRef = collection(db, "materias");
      const qSubjects = query(materiasRef, where('__name__', 'in', batch));
      const subjectsSnapshot = await getDocs(qSubjects);
      
      subjectsSnapshot.docs.forEach(subjectDoc => {
        subjectDataMap.set(subjectDoc.id, subjectDoc.data());
      });
    }

    const rankings: SubjectRanking[] = [];
    
    subjectPublicationCount.forEach((count, uid) => {
      const subjectData = subjectDataMap.get(uid);
      if (subjectData) {
        rankings.push({
          uid,
          nombre: subjectData.nombre || "Materia desconocida",
          descripcion: subjectData.descripcion,
          value: count,
        });
      }
    });

    return rankings.sort((a, b) => b.value - a.value).slice(0, 10);
  } catch (error) {
    console.error("Error obteniendo top materias populares:", error);
    return [];
  }
};

export const getTopReportedUsers = async (timeFilter: TimeFilter): Promise<UserRanking[]> => {
  try {
    const { startDate } = getTimeRange(timeFilter);
    const reportesRef = collection(db, "reportes");
    const q = query(
      reportesRef,
      where("fechaCreacion", ">=", Timestamp.fromDate(startDate))
    );
    
    const snapshot = await getDocs(q);
    
    const reportCountByPub = new Map<string, number>();
    snapshot.docs.forEach(doc => {
      const publicacionUid = doc.data().publicacionUid;
      if (publicacionUid) {
        reportCountByPub.set(publicacionUid, (reportCountByPub.get(publicacionUid) || 0) + 1);
      }
    });

    const publicacionUids = Array.from(reportCountByPub.keys());
    if (publicacionUids.length === 0) return [];

    const autorReportCount = new Map<string, number>();
    const batchSize = 10;
    
    for (let i = 0; i < publicacionUids.length; i += batchSize) {
      const batch = publicacionUids.slice(i, i + batchSize);
      const publicacionesRef = collection(db, "publicaciones");
      const qPubs = query(publicacionesRef, where('__name__', 'in', batch));
      const pubsSnapshot = await getDocs(qPubs);
      
      pubsSnapshot.docs.forEach(pubDoc => {
        const autorUid = pubDoc.data().autorUid;
        if (autorUid) {
          const reportCount = reportCountByPub.get(pubDoc.id) || 0;
          autorReportCount.set(
            autorUid,
            (autorReportCount.get(autorUid) || 0) + reportCount
          );
        }
      });
    }

    const autorIds = Array.from(autorReportCount.keys());
    if (autorIds.length === 0) return [];

    const userDataMap = new Map<string, any>();
    
    for (let i = 0; i < autorIds.length; i += batchSize) {
      const batch = autorIds.slice(i, i + batchSize);
      const usuariosRef = collection(db, "usuarios");
      const qUsers = query(usuariosRef, where('__name__', 'in', batch));
      const usersSnapshot = await getDocs(qUsers);
      
      usersSnapshot.docs.forEach(userDoc => {
        userDataMap.set(userDoc.id, userDoc.data());
      });
    }

    const rankings: UserRanking[] = [];
    
    autorReportCount.forEach((count, uid) => {
      const userData = userDataMap.get(uid);
      if (userData) {
        rankings.push({
          uid,
          nombre: userData.nombre || "Usuario desconocido",
          foto: userData.foto,
          email: userData.correo,
          value: count,
        });
      }
    });

    return rankings.sort((a, b) => b.value - a.value).slice(0, 10);
  } catch (error) {
    console.error("Error obteniendo top usuarios reportados:", error);
    return [];
  }
};

export const getTopPopularPosts = async (
  timeFilter: TimeFilter,
  sortBy: PostSortType = 'views'
): Promise<PostRanking[]> => {
  try {
    const { startDate } = getTimeRange(timeFilter);
    const publicacionesRef = collection(db, "publicaciones");
    const q = query(
      publicacionesRef,
      where("fechaPublicacion", ">=", Timestamp.fromDate(startDate)),
      where("estado", "==", "activo")
    );
    
    const snapshot = await getDocs(q);
    
    const autorIds = new Set<string>();
    const materiaIds = new Set<string>();
    const postsData: any[] = [];
    
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      postsData.push({ uid: docSnap.id, ...data });
      
      if (data.autorUid) autorIds.add(data.autorUid);
      
      const materiaId = data.materiaId || data.subjectUid || data.materiaUid || data.subjectId;
      if (materiaId) materiaIds.add(materiaId);
    });

    const [autorDataMap, materiaDataMap] = await Promise.all([
      fetchDataInBatches(Array.from(autorIds), "usuarios"),
      fetchDataInBatches(Array.from(materiaIds), "materias")
    ]);

    const rankings: PostRanking[] = postsData.map(data => {
      const autorData = data.autorUid ? autorDataMap.get(data.autorUid) : null;
      const materiaId = data.materiaId || data.subjectUid || data.materiaUid || data.subjectId;
      const materiaData = materiaId ? materiaDataMap.get(materiaId) : null;
      
      return {
        uid: data.uid,
        titulo: data.titulo || "Sin título",
        autorNombre: autorData?.nombre || "Usuario desconocido",
        autorUid: data.autorUid,
        materiaNombre: materiaData?.nombre,
        views: data.vistas || 0,
        likes: data.totalValoraciones || data.totalCalificaciones || 0,
        fechaCreacion: data.fechaPublicacion?.toDate() || new Date(),
        descripcion: data.descripcion,
      };
    });

    const sorted = rankings.sort((a, b) => {
      if (sortBy === 'views') {
        return b.views - a.views;
      } else {
        return b.likes - a.likes;
      }
    });

    return sorted.slice(0, 10);
  } catch (error) {
    console.error("Error obteniendo top publicaciones populares:", error);
    return [];
  }
};

async function fetchDataInBatches(ids: string[], collectionName: string): Promise<Map<string, any>> {
  const dataMap = new Map<string, any>();
  if (ids.length === 0) return dataMap;
  
  const batchSize = 10;
  
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, where('__name__', 'in', batch));
    const batchSnapshot = await getDocs(q);
    
    batchSnapshot.docs.forEach(doc => {
      dataMap.set(doc.id, doc.data());
    });
  }
  
  return dataMap;
}

export const generateChartData = async (
  rankingType: 'activeUsers' | 'popularSubjects' | 'reportedUsers' | 'popularPosts',
  timeFilter: TimeFilter,
  sortBy?: PostSortType
): Promise<ChartDataPoint[]> => {
  try {
    const { startDate, endDate } = getTimeRange(timeFilter);
    
    let intervalDays = 1;
    if (timeFilter === '30days') intervalDays = 3;
    if (timeFilter === '6months') intervalDays = 15;
    if (timeFilter === 'all') intervalDays = 30;

    const chartData: ChartDataPoint[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + intervalDays);

      let value = 0;

      if (rankingType === 'activeUsers' || rankingType === 'popularSubjects') {
        const publicacionesRef = collection(db, "publicaciones");
        const q = query(
          publicacionesRef,
          where("fechaPublicacion", ">=", Timestamp.fromDate(currentDate)),
          where("fechaPublicacion", "<", Timestamp.fromDate(nextDate)),
          where("estado", "==", "activo")
        );
        const snapshot = await getDocs(q);
        value = snapshot.size;
      } else if (rankingType === 'reportedUsers') {
        const reportesRef = collection(db, "reportes");
        const q = query(
          reportesRef,
          where("fechaCreacion", ">=", Timestamp.fromDate(currentDate)),
          where("fechaCreacion", "<", Timestamp.fromDate(nextDate))
        );
        const snapshot = await getDocs(q);
        value = snapshot.size;
      } else if (rankingType === 'popularPosts') {
        const publicacionesRef = collection(db, "publicaciones");
        const q = query(
          publicacionesRef,
          where("fechaPublicacion", ">=", Timestamp.fromDate(currentDate)),
          where("fechaPublicacion", "<", Timestamp.fromDate(nextDate)),
          where("estado", "==", "activo")
        );
        const snapshot = await getDocs(q);
        
        if (sortBy === 'likes') {
          value = snapshot.docs.reduce((sum, doc) => sum + (doc.data().totalValoraciones || 0), 0);
        } else {
          value = snapshot.docs.reduce((sum, doc) => sum + (doc.data().vistas || 0), 0);
        }
      }

      chartData.push({
        value,
        label: currentDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        date: new Date(currentDate),
      });

      currentDate.setDate(currentDate.getDate() + intervalDays);
    }

    return chartData;
  } catch (error) {
    console.error("Error generando datos de gráfico:", error);
    return [];
  }
};