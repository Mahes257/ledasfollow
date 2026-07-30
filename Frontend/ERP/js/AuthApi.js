class AuthApi {

    static async login(email, password) {

        const response = await ApiService.post("/auth/login", {
            email,
            password
        });

        if (response.success && response.data) {

            localStorage.setItem(
                "token",
                response.data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(response.data.user)
            );

        }

        return response;

    }

    static async profile() {

        return await ApiService.get(
            "/auth/profile"
        );

    }

    static async register(data) {

        return await ApiService.post(
            "/auth/register",
            data
        );

    }

    static async updateProfile(data) {

        return await ApiService.put(
            "/auth/profile",
            data
        );

    }

    static async changePassword(data) {

        return await ApiService.put(
            "/auth/change-password",
            data
        );

    }

    static async logout() {

        try {

            await ApiService.post("/auth/logout");

        } catch (error) {

            console.warn(error);

        }

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("vt_user");

    }

    static getToken() {

        return localStorage.getItem("token");

    }

    static getUser() {

        try {

            return JSON.parse(
                localStorage.getItem("user")
            );

        } catch {

            return null;

        }

    }

    static isLoggedIn() {

        return !!this.getToken();

    }

}

window.AuthApi = AuthApi;