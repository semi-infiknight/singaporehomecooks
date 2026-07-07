import { t, type MessageKey, type ShcLocale } from './messages';
import { getLocalizedOccasions } from './promo-occasion';

export type RequestDishCopy = {
  stepOf: string;
  title: string;
  heroSteps: [string, string, string, string];
  steps: Array<{ id: string; label: string }>;
  occasionTitle: string;
  describeLabel: string;
  describePlaceholder: string;
  storyHint: string;
  interpretationTitle: string;
  interpretationBody: string;
  youtubeLabel: string;
  youtubePlaceholder: string;
  skipVideo: string;
  partySize: string;
  budget: string;
  collectionDate: string;
  datePlaceholder: string;
  collectionHint: string;
  yourRequest: string;
  guests: string;
  reviewBoardBody: string;
  posting: string;
  postBtn: string;
  continue: string;
  back: string;
  occasionValues: string[];
  occasionLabels: Record<string, string>;
  successTitle: string;
  successWithId: string;
  successBody: string;
  successBrowseWait: string;
  backProfile: string;
  homeCtaTitle: string;
  homeCtaSubtitle: string;
};

const OCCASION_VALUES = ['Hari Raya', 'Deepavali', 'Chinese New Year', 'Birthday', 'Family Gathering', 'Wedding'];

export function getRequestDishCopy(locale: ShcLocale): RequestDishCopy {
  const occasions = getLocalizedOccasions(locale);
  const occasionLabels = Object.fromEntries(
    OCCASION_VALUES.map((id) => [id, occasions.find((o) => o.id === id)?.chipLabel || id])
  );

  return {
    stepOf: t(locale, 'request.step_of'),
    title: t(locale, 'request.title'),
    heroSteps: [
      t(locale, 'request.hero.step1'),
      t(locale, 'request.hero.step2'),
      t(locale, 'request.hero.step3'),
      t(locale, 'request.hero.step4'),
    ],
    steps: [
      { id: 'occasion', label: t(locale, 'request.step.story') },
      { id: 'inspiration', label: t(locale, 'request.step.inspiration') },
      { id: 'gathering', label: t(locale, 'request.step.gathering') },
      { id: 'review', label: t(locale, 'request.step.review') },
    ],
    occasionTitle: t(locale, 'request.occasion_title'),
    describeLabel: t(locale, 'request.describe_label'),
    describePlaceholder: t(locale, 'request.describe_placeholder'),
    storyHint: t(locale, 'request.story_hint'),
    interpretationTitle: t(locale, 'request.interpretation_title'),
    interpretationBody: t(locale, 'request.interpretation_body_long'),
    youtubeLabel: t(locale, 'request.youtube_label'),
    youtubePlaceholder: t(locale, 'request.youtube_placeholder'),
    skipVideo: t(locale, 'request.skip_video'),
    partySize: t(locale, 'request.party_size'),
    budget: t(locale, 'request.budget'),
    collectionDate: t(locale, 'request.collection_date'),
    datePlaceholder: t(locale, 'request.date_placeholder'),
    collectionHint: t(locale, 'request.collection_hint'),
    yourRequest: t(locale, 'request.your_request'),
    guests: t(locale, 'request.guests'),
    reviewBoardBody: t(locale, 'request.review_board_body'),
    posting: t(locale, 'request.posting'),
    postBtn: t(locale, 'request.post_btn'),
    continue: t(locale, 'request.continue'),
    back: t(locale, 'search.back'),
    occasionValues: OCCASION_VALUES,
    occasionLabels,
    successTitle: t(locale, 'request.success_title'),
    successWithId: t(locale, 'request.success_with_id_mobile'),
    successBody: t(locale, 'request.success_body'),
    successBrowseWait: t(locale, 'request.success_browse_wait'),
    backProfile: t(locale, 'request.back_profile'),
    homeCtaTitle: t(locale, 'request.title'),
    homeCtaSubtitle: t(locale, 'request.home_cta_subtitle'),
  };
}
