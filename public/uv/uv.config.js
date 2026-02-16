const k = new TextEncoder().encode(btoa(new Date().toISOString().slice(0, 10) + location.host).split('').reverse().join('').slice(6.7));

// Derive the `/uv/` directory from the config script URL so this works under a base path (GitHub Pages).
const scriptUrl = (() => {
    try {
        if (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) {
            return document.currentScript.src;
        }
    } catch { }
    try {
        // In SW/worker contexts, `document` doesn't exist, but `self.location` does.
        if (typeof self !== 'undefined' && self.location && self.location.href) return self.location.href;
    } catch { }
    return location.href;
})();
const uvDir = new URL('.', scriptUrl).pathname;

self.__uv$config = {
    prefix: uvDir + "service/",
    encodeUrl: s => {
        if (!s) return s;
        try {
            const d = new TextEncoder().encode(s), o = new Uint8Array(d.length);
            for (let i = 0; i < d.length; i++) o[i] = d[i] ^ k[i % 8];
            return Array.from(o, b => b.toString(16).padStart(2, "0")).join("");
        } catch { return s; }
    },
    decodeUrl: s => {
        if (!s) return s;
        try {
            const n = Math.min(s.indexOf('?') + 1 || s.length + 1, s.indexOf('#') + 1 || s.length + 1, s.indexOf('&') + 1 || s.length + 1) - 1;
            let h = 0;
            for (let i = 0; i < n && i < s.length; i++) {
                const c = s.charCodeAt(i);
                if (!((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102))) break;
                h = i + 1;
            }
            if (h < 2 || h % 2) return decodeURIComponent(s);
            const l = h >> 1, o = new Uint8Array(l);
            for (let i = 0; i < l; i++) {
                const x = i << 1;
                o[i] = parseInt(s[x] + s[x + 1], 16) ^ k[i % 8];
            }
            return new TextDecoder().decode(o) + s.slice(h);
        } catch { return decodeURIComponent(s); }
    },
    handler: uvDir + "uv.handler.js",
    client: uvDir + "uv.client.js",
    bundle: uvDir + "uv.bundle.js",
    config: uvDir + "uv.config.js",
    sw: uvDir + "uv.sw.js"
};
