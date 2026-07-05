export type ProfileCard = {
  title: string;
  items: string[];
};

export type ProfileDimension = {
  label: string;
  value: string;
  tone: 'success' | 'warning' | 'primary' | 'danger';
};

export type ProfileAnalysis = {
  profileCards: ProfileCard[];
  dimensions: ProfileDimension[];
  externalData: Array<{ label: string; status: string }>;
  stats: {
    caseType: string;
    riskLevel: string;
    entityCheck: string;
    recommendedPath: string;
  };
};

export type ProfileAnalysisApiResponse = {
  code: number;
  message?: string;
  data?: ProfileAnalysis;
};
