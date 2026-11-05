import { DOCTOR, FEATURES } from '../config.js';

/**
 * Copy that states a fact the config does not yet record is shown only when
 * its flag in shared/practice.config.js is on. One place, so About, the home
 * page and Services cannot drift apart.
 */

/** The doctor's background paragraphs, with the hospital-experience opening only if confirmed. */
export function doctorBio(t, tList) {
  const bio = tList('doctor.longBio');
  return DOCTOR.hospitalExperience ? [t('doctor.longBioHospitalOpening'), ...bio.slice(1)] : bio;
}

/** Credentials, without the ones marked `hospital: true` until that is confirmed. */
export function doctorCredentials(tList) {
  return tList('doctor.credentials').filter((c) => !c.hospital || DOCTOR.hospitalExperience);
}

/** What a consultation includes, plus the free follow-up message only if it is offered. */
export function serviceIncludes(id, t, tList) {
  const lines = tList(`services.items.${id}.includes`);
  return id === 'general' && FEATURES.freeFollowUpMessage ? [...lines, t('services.items.general.freeFollowUp')] : lines;
}
