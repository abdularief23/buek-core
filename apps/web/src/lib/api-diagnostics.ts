const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

export interface ApiDiagnostics {
  apiReachable: boolean;
  apiBuild: string | null;
  engineeringAnalysisApi: boolean;
  engineerMetricsApi: boolean;
  error: string | null;
}

export async function checkApiDiagnostics(): Promise<ApiDiagnostics> {
  const result: ApiDiagnostics = {
    apiReachable: false,
    apiBuild: null,
    engineeringAnalysisApi: false,
    engineerMetricsApi: false,
    error: null
  };

  try {
    const healthResponse = await fetch(`${apiUrl}/health`);
    if (!healthResponse.ok) {
      result.error = `Health check failed (${healthResponse.status})`;
      return result;
    }

    const health = (await healthResponse.json()) as {
      status?: string;
      build?: string;
      features?: { engineeringAnalysis?: boolean };
    };

    result.apiReachable = health.status === "ok";
    result.apiBuild = health.build ?? null;
    result.engineeringAnalysisApi = health.features?.engineeringAnalysis === true;

    const metricsResponse = await fetch(`${apiUrl}/api/data/epson-factory/engineer/metrics`);
    result.engineerMetricsApi = metricsResponse.ok;
  } catch (error) {
    result.error = error instanceof Error ? error.message : "API tidak dapat dihubungi";
  }

  return result;
}
