import { useCallback, useEffect, useRef, useState } from 'react';
import { apiErrorMessage } from '../../../services/api/client';
import {
  ADDRESS_MAX,
  FULL_NAME_MAX,
  PHONE_PATTERN,
  buyerApi,
  type ProfileGender,
  type UpdateProfileInput,
  type UserProfileResponse,
} from '../../../services/api/buyer';
import { sellerApi } from '../../../services/api/seller';
import { getSession } from '../../../services/api/auth';

export type AccountRole = 'BUYER' | 'SELLER';

/** Editable profile state. Mirrors what UpdateProfileRequest actually accepts. */
export interface ProfileDraft {
  fullName: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: '' | ProfileGender;
}

export function draftFromProfile(profile: UserProfileResponse): ProfileDraft {
  return {
    fullName: profile.fullName ?? '',
    phone: profile.phone ?? '',
    address: profile.address ?? '',
    dateOfBirth: profile.dateOfBirth ?? '',
    gender: profile.gender ?? '',
  };
}

/**
 * Builds the PUT body from the difference between the current draft and the loaded profile.
 *
 * Backend semantics (UserServiceImpl.updateProfile): null keeps the stored value, "" clears it.
 * Only string columns can be cleared — dateOfBirth is a LocalDate and gender an enum, so an
 * empty value there is not a valid request and is simply left untouched.
 */
export function buildProfileUpdate(original: ProfileDraft, draft: ProfileDraft): UpdateProfileInput {
  const body: UpdateProfileInput = {};
  const fullName = draft.fullName.trim();
  if (fullName !== original.fullName.trim()) body.fullName = fullName;
  const phone = draft.phone.trim();
  if (phone !== original.phone.trim()) body.phone = phone;
  const address = draft.address.trim();
  if (address !== original.address.trim()) body.address = address;
  if (draft.dateOfBirth && draft.dateOfBirth !== original.dateOfBirth) body.dateOfBirth = draft.dateOfBirth;
  if (draft.gender && draft.gender !== original.gender) body.gender = draft.gender;
  return body;
}

export function validateProfileDraft(draft: ProfileDraft): string[] {
  const errors: string[] = [];
  const fullName = draft.fullName.trim();
  if (!fullName) errors.push('Họ tên không được để trống.');
  else if (fullName.length > FULL_NAME_MAX) errors.push(`Họ tên tối đa ${FULL_NAME_MAX} ký tự.`);
  if (draft.phone.trim() && !PHONE_PATTERN.test(draft.phone.trim())) errors.push('Số điện thoại không hợp lệ.');
  if (draft.address.trim().length > ADDRESS_MAX) errors.push(`Địa chỉ tối đa ${ADDRESS_MAX} ký tự.`);
  if (draft.dateOfBirth) {
    const value = Date.parse(`${draft.dateOfBirth}T00:00:00`);
    if (!Number.isFinite(value)) errors.push('Ngày sinh không hợp lệ.');
    else if (value >= Date.now()) errors.push('Ngày sinh phải là một ngày trong quá khứ.');
  }
  return errors;
}

interface AccountApi {
  profile: (signal?: AbortSignal) => Promise<UserProfileResponse>;
  updateProfile: (input: UpdateProfileInput) => Promise<UserProfileResponse>;
}

const roleApi: Record<AccountRole, AccountApi> = { BUYER: buyerApi, SELLER: sellerApi };

/**
 * Loads and saves the signed-in user's profile for the given role.
 *
 * The draft is kept separate from the loaded profile so a failed save never loses what the
 * user typed, and so "unchanged" fields can be omitted from the PUT body.
 */
export function useAccountProfile(role: AccountRole) {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>({ fullName: '', phone: '', address: '', dateOfBirth: '', gender: '' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const api = roleApi[role];
  const mounted = useRef(true);
  const savingLock = useRef(false);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  useEffect(() => {
    const controller = new AbortController();
    const token = getSession()?.accessToken ?? null;
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setLoadError('');
    api.profile(controller.signal)
      .then(next => {
        if (controller.signal.aborted) return;
        // A late response from a previous session must not repaint the form.
        if ((getSession()?.accessToken ?? null) !== token) return;
        setProfile(next);
        setDraft(draftFromProfile(next));
        setSaved(false);
      })
      .catch(error => { if (!controller.signal.aborted) setLoadError(apiErrorMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [api, reloadKey]);

  const update = useCallback(<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setDraft(previous => ({ ...previous, [key]: value }));
    setSaved(false);
    setSaveError('');
  }, []);

  const save = useCallback(async () => {
    if (savingLock.current || !profile) return false;
    const errors = validateProfileDraft(draft);
    if (errors.length) { setSaveError(errors[0]); return false; }
    const body = buildProfileUpdate(draftFromProfile(profile), draft);
    if (Object.keys(body).length === 0) { setSaved(true); return true; }
    savingLock.current = true;
    setSaving(true);
    setSaveError('');
    try {
      const next = await api.updateProfile(body);
      if (!mounted.current) return true;
      setProfile(next);
      setDraft(draftFromProfile(next));
      setSaved(true);
      return true;
    } catch (error) {
      // Keep the draft intact so nothing typed is lost.
      if (mounted.current) setSaveError(apiErrorMessage(error));
      return false;
    } finally {
      savingLock.current = false;
      if (mounted.current) setSaving(false);
    }
  }, [api, draft, profile]);

  const retry = useCallback(() => setReloadKey(key => key + 1), []);

  return { profile, draft, update, loading, loadError, retry, saving, saveError, saved, save };
}
