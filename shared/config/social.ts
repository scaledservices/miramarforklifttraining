// Official social profiles. Single source of truth for the site footer and
// the Organization / LocalBusiness JSON-LD `sameAs`. Leave a value null until
// the real URL is confirmed: unset links are never rendered or emitted.
export interface SocialLinks {
  instagram: string | null;
  linkedin: string | null;
  facebook: string | null;
}

export const socialLinks: SocialLinks = {
  instagram: "https://www.instagram.com/miramarforklifttraining",
  linkedin: "https://www.linkedin.com/company/miramar-forklift-training",
  facebook: "https://www.facebook.com/1425690627295010",
};

export type SocialNetwork = keyof SocialLinks;

/** Display order: Instagram, LinkedIn, Facebook. Only networks with a URL. */
export function getSocialProfiles(links: SocialLinks = socialLinks): { network: SocialNetwork; url: string }[] {
  const order: SocialNetwork[] = ["instagram", "linkedin", "facebook"];
  return order
    .map((network) => ({ network, url: (links[network] || "").trim() }))
    .filter((p) => p.url.length > 0);
}

/** URLs for schema.org `sameAs`. */
export function getSameAs(links: SocialLinks = socialLinks): string[] {
  return getSocialProfiles(links).map((p) => p.url);
}
