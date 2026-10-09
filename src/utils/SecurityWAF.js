/**
 * ============================================================================
 * MODULE: 007 Hardened Web Application Firewall (WAF) Threat Detection Engine
 * DIRECTORY: src/utils/SecurityWAF.js
 * ROLE/SCOPE: Client-Side Security Perimeter & Threat Intelligence
 * DESCRIPTION:
 *   Perimeter security engine that inspects incoming connection metadata,
 *   verifies IP geolocation against university policy (PH-only production),
 *   checks against active SecOps blacklist entries, and streams event telemetry
 *   to the SIEM traffic log table.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. SECURITY WAF SERVICE CLASS (SecurityWAF)
 *      - checkTraffic(): Validates IP, Geolocation, and Blacklist Status
 *      - logToSiem(): Fire-and-forget SIEM telemetry stream ingestion
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import { supabase } from '../config/supabase';

// Geolocation memory cache to prevent free-tier 1,000 req/day rate-limit exhaustion
let cachedGeo = null;
let lastGeoFetch = 0;
const GEO_CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache

// ============================================================================
// SECTION 2: SECURITY WAF SERVICE CLASS
// ============================================================================
export class SecurityWAF {
  /**
   * Evaluates client connection traffic against perimeter security rules.
   *
   * @returns {Promise<{ allowed: boolean, reason?: string, devMode?: boolean }>}
   */
  static async checkTraffic() {
    try {
      // Rule 0: Always allow local development runtimes and private loopback interfaces
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        return { allowed: true, devMode: true };
      }
      if (typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '::1' ||
        window.location.hostname.endsWith('.local')
      )) {
        return { allowed: true, devMode: true };
      }

      // Rule 1: Geolocation intelligence lookup with memory caching & strict 2500ms timeout
      let data = null;
      if (cachedGeo && (Date.now() - lastGeoFetch < GEO_CACHE_TTL)) {
        data = cachedGeo;
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s maximum timeout
        try {
          const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
          clearTimeout(timeoutId);
          if (response.ok) {
            data = await response.json();
            if (data && !data.error) {
              cachedGeo = data;
              lastGeoFetch = Date.now();
            }
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          // Fail-open strategy: If third-party geo-lookup times out or fails, allow traffic
          return { allowed: true };
        }
      }
      
      // Fail-open strategy: If third-party geo-lookup returns error or missing, do not block legitimate academic traffic
      if (!data || data.error) return { allowed: true };

      const ip = data.ip;
      const country = data.country_code;
      const isProxy = false; // Note: Default free tier does not flag proxy/VPN attributes

      // Rule 2: Cross-reference against manual SecOps permanent blacklist table with deterministic 2000ms timeout
      let blacklisted = null;
      try {
        const blacklistQuery = supabase
          .from('waf_blacklisted_ips')
          .select('ip_address')
          .eq('ip_address', ip)
          .single();

        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ data: null, error: 'TIMEOUT' }), 2000));
        const res = await Promise.race([blacklistQuery, timeoutPromise]);
        if (res && res.data) {
          blacklisted = res.data;
        }
      } catch (dbErr) {
        // Fail-open strategy: If database is unreachable or offline, allow traffic without stall
        console.warn('WAF Blacklist check notice (failing open):', dbErr?.message);
      }

      if (blacklisted) {
        this.logToSiem(ip, country, isProxy, 'MANUALLY_BANNED');
        return { allowed: false, reason: 'IP is permanently banned' };
      }

      // Rule 3: Transmit telemetry event to the SIEM stream
      this.logToSiem(ip, country, isProxy);

      // Rule 4: Geofence Enforcement (University policy restricts out-of-region access in prod)
      if (country !== 'PH') {
        return { allowed: false, reason: 'Out of region (Only PH traffic allowed)' };
      }
      if (isProxy) {
        return { allowed: false, reason: 'VPN, Tor, or Proxy detected' };
      }
      
      return { allowed: true };

    } catch (e) {
      console.warn('WAF Check Failed:', e);
      return { allowed: true }; // Fail-open on exception
    }
  }

  /**
   * Transmits connection telemetry logs to the SecOps SIEM database.
   *
   * @param {string} ip - Remote client IP address.
   * @param {string} country - ISO country code.
   * @param {boolean} isProxy - VPN or proxy detection flag.
   * @param {string|null} forcedStatus - Optional override status ('BLOCKED', 'ALLOWED', 'MANUALLY_BANNED').
   * @returns {Promise<void>}
   */
  static async logToSiem(ip, country, isProxy, forcedStatus = null) {
    try {
      const status = forcedStatus || ((country !== 'PH' || isProxy) ? 'BLOCKED' : 'ALLOWED');
      // Fire-and-forget asynchronous insertion
      await supabase.from('siem_traffic_logs').insert([{
        ip_address: ip,
        country: country,
        is_vpn: isProxy,
        status: status
      }]);
    } catch (e) {
      // Suppress network log errors to prevent UI interruptions
    }
  }
}
