// 1. The gender distribution (m = male, f = female)
export interface GenderStats {
  m: number;
  f: number;
}

// 2. The specific age groups defined in your data
export interface AgeGroupStats {
  "0_14": GenderStats;
  "15_24": GenderStats;
  "25_46": GenderStats;
  "47_plus": GenderStats;
}

// 3. The main object for a single disease entry
export interface DiseaseReportItem {
  disease: string;
  suspected_cases: AgeGroupStats;
  deaths: AgeGroupStats;
  sample_cases: number;
  confirmed_cases: number;
}

// 4. The final response type (an array of the items)
export type DiseaseReportResponse = DiseaseReportItem[];