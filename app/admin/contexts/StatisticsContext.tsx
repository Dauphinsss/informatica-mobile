import { GeneralStats, PostSortType, RankingStats, TimeFilter } from '@/scripts/types/Statistics.type';
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface RankingModalState {
  timeFilter: TimeFilter;
  postSortType: PostSortType;
  cache: Map<string, { items: any[], chart: any[] }>;
}

interface StatisticsContextType {
  generalStats: GeneralStats | null;
  setGeneralStats: (stats: GeneralStats | null) => void;
  generalLoading: boolean;
  setGeneralLoading: (loading: boolean) => void;
  
  rankingStats: RankingStats | null;
  setRankingStats: (stats: RankingStats | null) => void;
  rankingLoading: boolean;
  setRankingLoading: (loading: boolean) => void;
  
  rankingModalStates: Record<string, RankingModalState>;
  setRankingModalStates: React.Dispatch<React.SetStateAction<Record<string, RankingModalState>>>;
  
  error: string | null;
  setError: (error: string | null) => void;
}

const StatisticsContext = createContext<StatisticsContextType | undefined>(undefined);

export const StatisticsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null);
  const [generalLoading, setGeneralLoading] = useState(false);
  const [rankingStats, setRankingStats] = useState<RankingStats | null>(null);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rankingModalStates, setRankingModalStates] = useState<Record<string, RankingModalState>>({
    activeUsers: { timeFilter: "30days", postSortType: "views", cache: new Map() },
    popularSubjects: { timeFilter: "30days", postSortType: "views", cache: new Map() },
    reportedUsers: { timeFilter: "30days", postSortType: "views", cache: new Map() },
    popularPosts: { timeFilter: "30days", postSortType: "views", cache: new Map() },
  });

  return (
    <StatisticsContext.Provider
      value={{
        generalStats,
        setGeneralStats,
        generalLoading,
        setGeneralLoading,
        rankingStats,
        setRankingStats,
        rankingLoading,
        setRankingLoading,
        rankingModalStates,
        setRankingModalStates,
        error,
        setError,
      }}
    >
      {children}
    </StatisticsContext.Provider>
  );
};

export const useStatistics = () => {
  const context = useContext(StatisticsContext);
  if (!context) {
    throw new Error('useStatistics must be used within a StatisticsProvider');
  }
  return context;
};