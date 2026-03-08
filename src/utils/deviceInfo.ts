export const getDeviceInfo = async () => {
  // 1. Persistent Device ID
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('device_id', deviceId);
  }

  const ua = navigator.userAgent;
  
  const getDeviceName = () => {
    if (/android/i.test(ua)) return "Android Device";
    if (/iPad|iPhone|iPod/.test(ua)) return "iOS Device";
    if (/Windows/i.test(ua)) return "Windows PC";
    if (/Mac/i.test(ua)) return "MacBook";
    return "Web Browser";
  };

  let ip = "Unknown IP";
  try {
    // Adding a timeout to the fetch so it doesn't hang the login
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 sec timeout

    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const data = await res.json();
      ip = data.ip;
    }
  } catch (e) {
    console.warn("IP Fetch failed, continuing with 'Unknown IP'", e);
  }

  // ALWAYS return this object even if IP fetch fails
  return {
    deviceId,
    deviceName: getDeviceName(),
    browser: ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : "Safari",
    ip,
    lastLogin: new Date().toISOString()
  };
};
