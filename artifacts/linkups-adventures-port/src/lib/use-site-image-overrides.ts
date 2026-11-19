import {
  getGetPublicSiteContentQueryKey,
  useGetPublicSiteContent,
} from '@workspace/api-client-react'
import { resolveSiteImage } from '@/lib/site-image-catalog'

export function useSiteImageOverrides(pageKey: string) {
  const { data } = useGetPublicSiteContent(pageKey, {
    query: {
      queryKey: getGetPublicSiteContentQueryKey(pageKey),
      retry: false,
      staleTime: 60_000,
    },
  })

  return {
    imageOverrides: data?.imageOverrides ?? {},
    getImage: (key: string, fallback: string) =>
      resolveSiteImage(data?.imageOverrides, key, fallback),
  }
}
