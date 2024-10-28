function getCookie(name) {
    console.log("getCookie called: ")
    const nameEQ = name + "=";
    console.log("getCookie: ", document.cookie)
    const cookies = document.cookie.split(';');
    console.log("cookies:", cookies);
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookie.substring(nameEQ.length));
        }
    }
    return null;
}

// Helper function to set a cookie with options
function setCookie(name, value, options = {}) {
    try {
        // Default options
        const defaultOptions = {
            path: '/',           // Cookie path
            expires: undefined,  // Expiration date
            maxAge: undefined,   // Max age in seconds
            domain: undefined,   // Cookie domain
            secure: true,        // Only transmit over HTTPS
            sameSite: 'Strict'  // CSRF protection
        };

        // Merge default options with provided options
        options = { ...defaultOptions, ...options };

        // Start building cookie string
        let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

        // Add expiration date if provided
        if (options.expires) {
            if (options.expires instanceof Date) {
                cookieString += `; expires=${options.expires.toUTCString()}`;
            } else {
                throw new Error('expires option must be a Date object');
            }
        }

        // Add max-age if provided
        if (options.maxAge) {
            cookieString += `; max-age=${options.maxAge}`;
        }

        // Add domain if provided
        if (options.domain) {
            cookieString += `; domain=${options.domain}`;
        }

        // Add path
        cookieString += `; path=${options.path}`;

        // Add secure flag
        if (options.secure) {
            cookieString += '; secure';
        }

        // Add SameSite
        cookieString += `; samesite=${options.sameSite}`;

        // Set the cookie
        document.cookie = cookieString;

        // Verify cookie was set
        if (!document.cookie.includes(encodeURIComponent(name))) {
            throw new Error('Cookie could not be set. Verification failed.');
        }

        return true;
    } catch (error) {
        console.error('Error setting cookie:', error);
        return false;
    }
}
