import { MEMBERSHIP_TIER } from "../models/Membership.js";

export const MEMBERSHIP_PERMISSIONS = {
  [MEMBERSHIP_TIER.FREE]: [
    "browse:public-content",
    "save:basic-items",
    "view:own-profile",
  ],
  [MEMBERSHIP_TIER.PRO]: [
    "browse:public-content",
    "save:basic-items",
    "view:own-profile",
    "access:pro-tools",
    "create:advanced-collections",
    "export:basic-data",
  ],
  [MEMBERSHIP_TIER.BUSINESS]: [
    "browse:public-content",
    "save:basic-items",
    "view:own-profile",
    "access:pro-tools",
    "create:advanced-collections",
    "export:basic-data",
    "manage:team-members",
    "access:business-tools",
    "shared:workspace",
  ],
};

export const getMembershipPermissions = (tier = MEMBERSHIP_TIER.FREE) =>
  MEMBERSHIP_PERMISSIONS[tier] || MEMBERSHIP_PERMISSIONS[MEMBERSHIP_TIER.FREE];

export const hasMembershipPermission = (tier, permission) =>
  getMembershipPermissions(tier).includes(permission);

export const isPaidMembership = (tier) =>
  [MEMBERSHIP_TIER.PRO, MEMBERSHIP_TIER.BUSINESS].includes(tier);