export const usePermissions = (userProfile: any) => {
  const plan = (userProfile?.plan_type || 'FREE').toUpperCase();
  const role = (userProfile?.role || 'user').toLowerCase();

  const isAlpha = plan === 'ALPHA' || plan === 'PRO' || role === 'ultimate';
  const isPro = plan === 'PRO' || role === 'ultimate';
  const isUltimate = role === 'ultimate';

  return { plan, isAlpha, isPro, isUltimate };
};
