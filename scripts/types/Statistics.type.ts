export type TimeFilter = 'today' | '7days' | '30days' | '6months' | 'all';

export type PostSortType = 'views' | 'likes';

export interface GeneralStats {
  totalUsers: number;
  totalUsersChange: number;
  totalUsersInSystem: number;
  totalUsersPrevious: number;
  
  activePosts: number;
  activePostsChange: number;
  activePostsInSystem: number;
  activePostsPrevious: number;
  
  pendingReports: number;
  pendingReportsChange: number;
  pendingReportsInSystem: number;
  pendingReportsPrevious: number;
  
  totalReports: number;
  totalReportsChange: number;
  totalReportsInSystem: number;
  totalReportsPrevious: number;
}

export interface UserRanking {
  uid: string;
  nombre: string;
  foto?: string;
  value: number;
  email?: string;
}

export interface SubjectRanking {
  uid: string;
  nombre: string;
  descripcion?: string;
  value: number;
}

export interface PostRanking {
  uid: string;
  titulo: string;
  autorNombre: string;
  autorUid: string;
  materiaNombre?: string;
  views: number;
  likes: number;
  fechaCreacion: Date;
  descripcion?: string;
}

export interface RankingStats {
  mostActiveUser: UserRanking | null;
  hottestSubject: SubjectRanking | null;
  mostReportedUser: UserRanking | null;
  mostPopularPost: PostRanking | null;
}

export interface ChartDataPoint {
  value: number;
  label?: string;
  date?: Date;
  labelComponent?: () => any;
}

export interface RankingDetailData {
  topItems: (UserRanking | SubjectRanking | PostRanking)[];
  chartData: ChartDataPoint[];
  timeFilter: TimeFilter;
  totalCount: number;
}

export type RankingType = 'activeUsers' | 'popularSubjects' | 'reportedUsers' | 'popularPosts';

export type GeneralStatType = "users" | "posts" | "pendingReports" | "totalReports" | null;

export interface PeriodComparison {
  current: number;
  previous: number;
  percentageChange: number;
  total?: number;
}
export interface GeneralStatDetail {
  label: string;
  current: number;
  previous: number;
  total: number;
  percentageChange: number;
}