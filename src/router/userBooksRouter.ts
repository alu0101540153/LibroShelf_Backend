// src/router/userBookRouter.ts
import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate } from "../middleware/auth";
import { handleImputErrors } from "../middleware/validation";
import { addUserBook, getUserBooks, updateUserBook, deleteUserBook, searchBooks } from "../handlers/userBookHandlers";

const userBookRouter = Router();

// Add a book to the user's collection
userBookRouter.post(
    '/userBooks',
    authenticate,
    body('bookId')
        .notEmpty()
        .withMessage('Book ID is required'),
    handleImputErrors,
    addUserBook
);

// Get all books of the authenticated user
userBookRouter.get(
    '/userBooks',
    authenticate,
    getUserBooks
);


// Update a user's book (rating or description)
userBookRouter.put(
    '/userBooks/:id',
    authenticate,
    param('id')
        .notEmpty()
        .withMessage('UserBook ID is required'),
    body('rating')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Rating must be between 1 and 10'),
    body('description')
        .optional()
        .isString(),
    handleImputErrors,
    updateUserBook
);

// Delete a book from the user's collection
userBookRouter.delete(
    '/userBooks/:id',
    authenticate,
    param('id')
        .notEmpty()
        .withMessage('UserBook ID is required'),
    handleImputErrors,
    deleteUserBook
);


// Search books in Google Books by title (GET, query param)
userBookRouter.get(
    '/search',
    searchBooks
);

export default userBookRouter;
