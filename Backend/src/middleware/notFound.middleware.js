import ApiResponse from "../common/responses/ApiResponse.js";

export default function notFound(req, res) {

    return ApiResponse.error(
        res,
        "Route not found.",
        404
    );
}