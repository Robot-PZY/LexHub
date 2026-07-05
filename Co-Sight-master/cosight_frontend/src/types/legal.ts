export type LegalScenario = {
  id: string;
  title: string;
  description: string;
  examples: string[];
};

export type LegalWorkflowStep = {
  id: string;
  title: string;
  description: string;
  agent: string;
};

export type ApiIntegration = {
  id: string;
  name: string;
  category: string;
  status: 'ready' | 'missing_key' | 'planned';
  envKeys: string[];
  purpose: string;
};

export type LegalToolkitProfile = {
  positioning: string;
  tagline: string;
  scenarios: LegalScenario[];
  workflow: LegalWorkflowStep[];
  integrations: ApiIntegration[];
  competitionHighlights: string[];
};

export type TaskBlueprint = {
  scenario: string;
  stages: LegalWorkflowStep[];
  recommendedTools: string[];
  outputTargets: string[];
  reviewChecklist: string[];
};

export type LegalToolkitApiResponse = {
  code: number;
  message?: string;
  data?: LegalToolkitProfile;
};

export type TaskBlueprintApiResponse = {
  code: number;
  message?: string;
  data?: TaskBlueprint;
};
