import { Alert } from 'react-native';
import { supabase } from '../config/supabase';

export class SecurityWAF {
  static async checkTraffic() {
    try {
      // 007 Security Note: Using plaintext HTTP because it's the only free provider of VPN/Proxy intel.
      // In a production enterprise app, this must be swapped to a paid HTTPS Threat Intel API to prevent MITM bypass.
      const response = await fetch('http://ip-api.com/json/?fields=status,message,countryCode,proxy,hosting,query');
      const data = await response.json();
      
      if (data.status !== 'success') return { allowed: true }; // Fail open if API fails to avoid breaking app for real users

      const ip = data.query;
      const country = data.countryCode;
      const isProxy = data.proxy || data.hosting;

      // 1. Check Manual Blacklist first
      const { data: blacklisted } = await supabase
        .from('waf_blacklisted_ips')
        .select('ip_address')
        .eq('ip_address', ip)
        .single();

      if (blacklisted) {
        this.logToSiem(ip, country, isProxy, 'MANUALLY_BANNED');
        return { allowed: false, reason: 'IP is permanently banned' };
      }

      // 2. Log to SIEM 
      this.logToSiem(ip, country, isProxy);

      // 3. Enforce Auto WAF Rules
      if (country !== 'PH') {
        return { allowed: false, reason: 'Out of region (Only PH traffic allowed)' };
      }
      if (isProxy) {
        return { allowed: false, reason: 'VPN, Tor, or Proxy detected' };
      }
      
      return { allowed: true };

    } catch (e) {
      console.warn('WAF Check Failed:', e);
      return { allowed: true }; // Fail open
    }
  }

  static async logToSiem(ip, country, isProxy, forcedStatus = null) {
    try {
      const status = forcedStatus || ((country !== 'PH' || isProxy) ? 'BLOCKED' : 'ALLOWED');
      // Fire and forget
      await supabase.from('siem_traffic_logs').insert([{
        ip_address: ip,
        country: country,
        is_vpn: isProxy,
        status: status
      }]);
    } catch (e) {
      // Ignore if table not created yet
    }
  }
}
