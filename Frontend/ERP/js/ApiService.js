class ApiService {

    /*
     * BASE_URL resolution order:
     * 1. Window global: window.__API_BASE_URL__ (set via <script> tag before ApiService.js)
     * 2. Local storage: localStorage.getItem('api_base_url')
     * 3. Hardcoded default (fallback)
     *
     * To change at deployment: <script>window.__API_BASE_URL__="https://your-backend-tunnel.trycloudflare.com/api";</script>
     */
    static get BASE_URL() {
        if (typeof window !== 'undefined' && window.__API_BASE_URL__) {
            return window.__API_BASE_URL__;
        }
        try {
            var stored = localStorage.getItem('api_base_url');
            if (stored) return stored;
        } catch (e) {}
        return "http://localhost:5100/api";
    }

    static setBaseUrl(url) {
        try {
            localStorage.setItem('api_base_url', url);
        } catch (e) {}
    }
    static getToken() {
        return localStorage.getItem("token");
    }

    static getHeaders(isJson = true) {

        const headers = {};

        if (isJson) {
            headers["Content-Type"] = "application/json";
        }

        const token = this.getToken();

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        return headers;

    }

    static async request(url, options = {}) {

        try {

            const response = await fetch(
                `${this.BASE_URL}${url}`,
                {
                    ...options,
                    headers: {
                        ...this.getHeaders(
                            options.body instanceof FormData ? false : true
                        ),
                        ...(options.headers || {})
                    }
                }
            );

            let data = null;

            const contentType = response.headers.get("content-type");

            if (
                contentType &&
                contentType.includes("application/json")
            ) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {

                if (response.status === 401) {

                    // Clear ALL auth keys to break the redirect loop
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    localStorage.removeItem("vt_user");
                    localStorage.removeItem("currentUser");
                    localStorage.removeItem("isLoggedIn");
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("userSession");
                    localStorage.removeItem("vt_session_user");

                    var currentPath = window.location.pathname;
                    var currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1);
                    // Only redirect to login if NOT already on the login page
                    if (
                        currentFile !== 'index.html' &&
                        currentFile !== '' &&
                        currentFile !== '/' &&
                        currentPath !== '/'
                    ) {
                        window.location.href = "index.html";
                    }

                }

                throw data;

            }

            return data;

        } catch (error) {

            console.error("API Error:", error);

            throw error;

        }

    }

    static get(url) {

        return this.request(url, {
            method: "GET"
        });

    }

    static post(url, body) {

        return this.request(url, {

            method: "POST",

            body: JSON.stringify(body)

        });

    }

    static put(url, body) {

        return this.request(url, {

            method: "PUT",

            body: JSON.stringify(body)

        });

    }

    static patch(url, body) {

        return this.request(url, {

            method: "PATCH",

            body: JSON.stringify(body)

        });

    }

    static delete(url) {

        return this.request(url, {

            method: "DELETE"

        });

    }

    static upload(url, formData) {

        return this.request(url, {

            method: "POST",

            body: formData,

            headers: {}

        });

    }

    static download(url) {

        const token = this.getToken();

        window.open(
            `${this.BASE_URL}${url}?token=${token}`,
            "_blank"
        );

    }

}

window.ApiService = ApiService;