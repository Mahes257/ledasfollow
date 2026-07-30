import ApiResponse from "../common/responses/ApiResponse.js";

export default function errorMiddleware(err, req, res, next) {

    console.error(err);

    return ApiResponse.error(
        res,
        err.message || "Internal Server Error",
        err.statusCode || 500
    );
}