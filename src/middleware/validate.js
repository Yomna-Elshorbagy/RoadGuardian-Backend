import { ZodError } from "zod";

/**
 * Higher-order middleware function to validate request data against a Zod schema.
 * @param {import("zod").AnyZodObject} schema - Zod schema (can have body, query, and params schemas)
 */
export const validate = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: "Validation failed",
                details: error.issues.map((e) => ({
                    path: e.path.join("."),
                    message: e.message,
                })),
            });
        }
        next(error);
    }
};
