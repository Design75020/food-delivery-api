import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

type RequestPart = "body" | "query" | "params";

export function validate(schema: ZodSchema, part: RequestPart = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Express 5: req.query and req.params are getter-only properties.
    // We read the raw value without trying to reassign.
    const rawValue = part === "body" ? req.body : part === "query" ? req.query : req.params;
    const result = schema.safeParse(rawValue);

    if (!result.success) {
      // Zod v4 uses .issues; v3 used .errors — support both
      const rawIssues: unknown[] =
        (result.error as { issues?: unknown[] }).issues ??
        (result.error as { errors?: unknown[] }).errors ??
        [];

      const errors = (
        rawIssues as Array<{ path: (string | number)[]; message: string }>
      ).map((e) => ({ field: e.path.join("."), message: e.message }));

      res.status(422).json({
        success: false,
        message: "Validation failed",
        errors,
      });
      return;
    }

    // Only reassign body (which is writable); for query/params, validated data
    // is attached to req.validatedQuery / req.validatedParams via a custom property.
    if (part === "body") {
      req.body = result.data;
    } else {
      // Attach validated data as a custom property to avoid Express 5 getter restriction
      (req as Request & Record<string, unknown>)[`validated_${part}`] = result.data;
    }

    next();
  };
}
