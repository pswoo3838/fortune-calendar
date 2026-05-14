import { useState, useCallback, useEffect } from "react";
import type { UserProfile, Gender, Zodiac, BirthTimeSlot } from "../types/fortune";
import { saveProfile, loadProfile, clearProfile } from "../lib/storage";
import { getZodiacFromBirthDate } from "../lib/zodiac";

interface UseUserProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  register: (name: string, birthDate: string, birthTime: BirthTimeSlot, gender: Gender) => void;
  reset: () => void;
}

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const stored = await loadProfile();
      if (!cancelled) {
        setProfile(stored);
        setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback((name: string, birthDate: string, birthTime: BirthTimeSlot, gender: Gender) => {
    const zodiac: Zodiac = getZodiacFromBirthDate(birthDate);
    const newProfile: UserProfile = {
      name,
      birthDate,
      birthTime,
      gender,
      zodiac,
      consentedAt: new Date().toISOString(),
    };
    void saveProfile(newProfile);
    setProfile(newProfile);
  }, []);

  const reset = useCallback(() => {
    void clearProfile();
    setProfile(null);
  }, []);

  return { profile, isLoading, register, reset };
}
