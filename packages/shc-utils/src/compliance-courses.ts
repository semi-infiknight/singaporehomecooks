/**
 * Official / government-backed links for cook compliance onboarding.
 * Shown in cook app + web when SFA/WSQ docs are missing so cooks can
 * complete courses then upload certificates in-app.
 *
 * Prefer .gov.sg destinations; training providers may change — SFA page
 * is the source of truth for the Food Safety Course Level 1 requirement.
 */

export type ComplianceCourseLink = {
  id: string;
  title: string;
  description: string;
  url: string;
  /** sfa | wsq | both */
  for: 'sfa' | 'wsq' | 'both';
};

/** Canonical course + registration links for Singapore home cooks */
export const COMPLIANCE_COURSE_LINKS: ComplianceCourseLink[] = [
  {
    id: 'sfa-food-handlers',
    title: 'SFA food handler requirements',
    description: 'Official rules: Food Safety Course (FSC) Level 1 and how to register handlers',
    url: 'https://www.sfa.gov.sg/food-handler-hygiene-officer/requirements-for-food-handler-hygiene-officer/requirements-for-food-handlers',
    for: 'both',
  },
  {
    id: 'gobusiness-licences',
    title: 'GoBusiness licensing portal',
    description: 'Apply for food licences / home-based food activities with Singpass',
    url: 'https://www.gobusiness.gov.sg/licences/',
    for: 'sfa',
  },
  {
    id: 'home-based-business',
    title: 'Home-based business scheme',
    description: 'HDB home kitchen criteria and what licences you may need',
    url: 'https://licensing.gobusiness.gov.sg/e-adviser/home-based-business/home-based-business-scheme',
    for: 'sfa',
  },
  {
    id: 'food-shop-licence',
    title: 'SFA Food Shop Licence (GoBusiness)',
    description: 'Licence directory entry if you operate a retail-style kitchen',
    url: 'https://licensing.gobusiness.gov.sg/licence-directory/sfa/food-shop-licence',
    for: 'sfa',
  },
  {
    id: 'myskillsfuture-fsc',
    title: 'Find WSQ Food Safety Course Level 1',
    description: 'Search MySkillsFuture for FSC Level 1 — SkillsFuture credits often apply',
    url: 'https://www.myskillsfuture.gov.sg/content/portal/en/index.html',
    for: 'wsq',
  },
  {
    id: 'skillsfuture-home',
    title: 'SkillsFuture Singapore',
    description: 'Course funding and provider directory for food hygiene training',
    url: 'https://www.skillsfuture.gov.sg/',
    for: 'wsq',
  },
];

export function complianceLinksForType(type: 'sfa' | 'wsq'): ComplianceCourseLink[] {
  return COMPLIANCE_COURSE_LINKS.filter((l) => l.for === type || l.for === 'both');
}

/** True if cook has submitted (or verified) a doc of this type */
export function hasComplianceDocOfType(
  docs: Array<{ type?: string; status?: string; verified_at?: string | null }>,
  type: 'sfa' | 'wsq'
): boolean {
  return docs.some((d) => String(d.type || '').toLowerCase() === type);
}

export function missingComplianceTypes(
  docs: Array<{ type?: string }>
): Array<'sfa' | 'wsq'> {
  const missing: Array<'sfa' | 'wsq'> = [];
  if (!hasComplianceDocOfType(docs, 'sfa')) missing.push('sfa');
  if (!hasComplianceDocOfType(docs, 'wsq')) missing.push('wsq');
  return missing;
}

/** Both SFA and WSQ docs approved (or verified_at set) — safe to show “verified” badge */
export function isCookComplianceVerified(
  docs: Array<{ type?: string; status?: string; verified_at?: string | null }>
): boolean {
  const approved = (type: 'sfa' | 'wsq') =>
    docs.some(
      (d) =>
        String(d.type || '').toLowerCase() === type &&
        (d.status === 'approved' || Boolean(d.verified_at))
    );
  return approved('sfa') && approved('wsq');
}
