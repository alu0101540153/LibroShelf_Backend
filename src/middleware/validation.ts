import type { Request, Response , NextFunction} from "express"
import { validationResult } from "express-validator"

export const handleImputErrors = (req: Request, res: Response , next: NextFunction ) => {
    // manejar error
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()})
    }

    next()

}