export interface DeployedProject {
    id: string;
    project: string;
    fabric?: string;
    releaseVersion: string;
    published: string;
    lastRun: string;
    lastRunStatus: 'success' | 'failed' | 'running' | 'pending';
  }
  
  export interface ScheduledPipeline {
    id: string;
    pipeline: string;
    fabric?: string;
    project: string;
    triggers: string[];
    last5Runs: RunStatus[];
  }
  
  export interface RunHistoryItem {
    id: string;
    fabric?: string;
    pipeline: string;
    project: string;
    runType: 'Scheduled' | 'Pipeline Run' | 'App Run' | 'Scheduled App Run' | 'API Pipeline Run';
    startTime: string;
    endTime: string;
    duration: string;
    result: 'success' | 'failed' | 'running';
  }
  
  export interface RunStatus {
    status: 'success' | 'failed' | 'running';
    timestamp: string;
  }
  
  export interface FilterOptions {
    dateRange?: {
      start: string;
      end: string;
    };
    fabric?: string;
    project?: string;
    runTypes?: string[];
  }
  
  // API Functions - to be implemented
  export async function getDeployedProjects(fabric?: string): Promise<DeployedProject[]> {
    // TODO: Implement API call
    return [];
  }
  
  export async function getScheduledPipelines(fabric?: string, project?: string): Promise<ScheduledPipeline[]> {
    // TODO: Implement API call
    return [];
  }
  
  export async function getRunHistory(filters?: FilterOptions): Promise<RunHistoryItem[]> {
    // TODO: Implement API call
    return [];
  }
  
  export async function getFabrics(): Promise<string[]> {
    // TODO: Implement API call
    return [];
  }
  
  export async function getProjects(fabric?: string): Promise<string[]> {
    // TODO: Implement API call
    return [];
  }
  
  export async function getPipelines(fabric?: string, project?: string): Promise<string[]> {
    // TODO: Implement API call
    return [];
  }