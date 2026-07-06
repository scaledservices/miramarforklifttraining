import { useQuery } from "@tanstack/react-query";

export interface RegionInfo {
  state: string;
  isServiceArea: boolean;
}

const DEFAULT_REGION: RegionInfo = { state: "", isServiceArea: true };

/**
 * Fetches the visitor's region from /api/geo/region and caches the result.
 *
 * Defaults to the full (service-area) experience while loading or on error
 * so out-of-region visitors never get a degraded page due to a failed API
 * call — they simply see the normal hero until the lookup resolves.
 */
export function useRegion() {
  const { data, isLoading, error } = useQuery<RegionInfo>({
    queryKey: ["/api/geo/region"],
    staleTime: Infinity, // region doesn't change within a session
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading || error || !data) {
    return { region: DEFAULT_REGION, isLoading };
  }

  return { region: data, isLoading };
}
