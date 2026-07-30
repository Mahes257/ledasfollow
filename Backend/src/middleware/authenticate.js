import jwt from "jsonwebtoken";

import AuthRepository from "../modules/auth/repositories/AuthRepository.js";

import ApiError from "../common/errors/ApiError.js";

import env from "../config/env.js";

const authenticate = async (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {

            throw new ApiError(
                401,
                "Access token is required."
            );

        }

        const token =
            authHeader.split(" ")[1];

        const decoded = jwt.verify(

            token,

            env.JWT_SECRET

        );

        const user =
            await AuthRepository.findById(
                decoded.id
            );

        if (!user) {

            throw new ApiError(
                401,
                "Invalid token."
            );

        }

        if (user.status !== "ACTIVE") {

            throw new ApiError(
                403,
                "User account is inactive."
            );

        }

        req.user = {

            id: user.id,

            email: user.email,

            role: user.role

        };

        next();

    } catch (error) {

        next(error);

    }

};

export default authenticate;