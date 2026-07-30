import ApiError from "../common/errors/ApiError.js";

const authorize = (...roles) => {

    return (req, res, next) => {

        if (!req.user) {

            return next(

                new ApiError(
                    401,
                    "Unauthorized."
                )

            );

        }

        if (!roles.includes(req.user.role)) {

            return next(

                new ApiError(
                    403,
                    "Forbidden."
                )

            );

        }

        next();

    };

};

export default authorize;