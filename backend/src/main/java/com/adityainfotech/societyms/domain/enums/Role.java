package com.adityainfotech.societyms.domain.enums;

/**
 * System roles ordered from highest to lowest privilege.
 * Used in JWT claims, security expressions, and sidebar rendering.
 */
public enum Role {

    ADMIN,        // Full access: all modules + user management + settings
    MANAGER,      // Operational access: all modules except users/settings/payment approval
    ACCOUNTANT,   // Financial access: dashboard + maintenance + accounts + reports
    SECURITY,     // Entry access: dashboard + visitors + complaints
    MEMBER        // Self-service: own bills + own complaints + notices (vote only)

}
