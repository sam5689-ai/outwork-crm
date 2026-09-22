import { prisma } from "@/lib/prisma";

export type GoogleFeatures = {
  emailSync: boolean;
  autoLogEmailActivity: boolean;
  importCalendarMeetings: boolean;
  todaysMeetingsWidget: boolean;
  followUpReminders: boolean;
};

export const DEFAULT_GOOGLE_FEATURES: GoogleFeatures = {
  emailSync: false,
  autoLogEmailActivity: false,
  importCalendarMeetings: false,
  todaysMeetingsWidget: false,
  followUpReminders: false,
};

const SETTING_KEY = "googleFeatures";

export async function getGoogleFeatures(): Promise<GoogleFeatures> {
  const setting = await prisma.setting.findUnique({
    where: { key: SETTING_KEY },
  });
  if (!setting) return DEFAULT_GOOGLE_FEATURES;

  const value = setting.value as Partial<GoogleFeatures>;
  return {
    emailSync: value.emailSync ?? DEFAULT_GOOGLE_FEATURES.emailSync,
    autoLogEmailActivity:
      value.autoLogEmailActivity ?? DEFAULT_GOOGLE_FEATURES.autoLogEmailActivity,
    importCalendarMeetings:
      value.importCalendarMeetings ??
      DEFAULT_GOOGLE_FEATURES.importCalendarMeetings,
    todaysMeetingsWidget:
      value.todaysMeetingsWidget ?? DEFAULT_GOOGLE_FEATURES.todaysMeetingsWidget,
    followUpReminders:
      value.followUpReminders ?? DEFAULT_GOOGLE_FEATURES.followUpReminders,
  };
}

export { SETTING_KEY as GOOGLE_FEATURES_SETTING_KEY };
