// src/handlers/userBookHandlers.ts
import { Request, Response } from "express";
import axios from "axios";
import UserBook from "../models/UserBook";

// Add a book to user's collection
export const addUserBook = async (req: Request, res: Response) => {
    try {
        const { bookId } = req.body;

        // check if there are a user, with the same id, and the same book
        const existingUserBook = await UserBook.findOne({ userId: req.user._id, bookId });
        if (existingUserBook) {
            return res.status(400).json({ error: "Book already exists in your collection" });
        }

        // Check if the book exists in Google Books API
        const googleRes = await axios.get(`https://www.googleapis.com/books/v1/volumes/${bookId}`);
        if (!googleRes.data) {
            return res.status(404).json({ error: "Book not found in Google Books API" });
        }

        const userBook = new UserBook({
            userId: req.user._id,
            bookId
        });

        await userBook.save();
        res.status(201).json(userBook);
    } catch (e: any) {
        res.status(500).json({ error: e.message || "Error adding book" });
    }
};

// Get all books of authenticated user
export const getUserBooks = async (req: Request, res: Response) => {
    try {
        const books = await UserBook.find({ userId: req.user._id });
        res.json(books);
    } catch (e: any) {
        res.status(500).json({ error: e.message || "Error fetching user's books" });
    }
};

// Update a user's book
export const updateUserBook = async (req: Request, res: Response) => {
    try {
        const { id } = req.body; // id is googleBookId
        const { rating, description } = req.body;

        const userBook = await UserBook.findOne({ bookId: id, userId: req.user._id });
        if (!userBook) {
            return res.status(404).json({ error: "Book not found in your collection" });
        }

        if (rating !== undefined) userBook.rating = rating;
        if (description !== undefined) userBook.personalDescription = description;

        await userBook.save();
        res.json(userBook);
    } catch (e: any) {
        res.status(500).json({ error: e.message || "Error updating book" });
    }
};

// Delete a user's book
export const deleteUserBook = async (req: Request, res: Response) => {
    try {
        const { bookId } = req.body;
        console.log("Deleting book with ID:", bookId);
        // Use bookId instead of _id for lookup
        const userBook = await UserBook.findOneAndDelete({ bookId: bookId, userId: req.user._id });
        if (!userBook) {
            return res.status(404).json({ error: "Book not found in your collection" });
        }

        res.json({ message: "Book removed from your collection" });
    } catch (e: any) {
        res.status(500).json({ error: e.message || "Error deleting book" });
    }
};

// New handler for searching books in Google Books
export const searchBooks = async (req: Request, res: Response) => {
    const { title } = req.body;
    if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'The title is required as a query parameter' });
    }
    try {
        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}`);
        const books = (response.data.items || []).map((item: any) => ({
            id: item.id,
            volumeInfo: {
                title: item.volumeInfo?.title,
                authors: item.volumeInfo?.authors,
                imageLinks: {
                    smallThumbnail: item.volumeInfo?.imageLinks?.smallThumbnail,
                    small: item.volumeInfo?.imageLinks?.thumbnail
                }
            }
        }));
        return res.json(books);
    } catch (error: any) {
        return res.status(500).json({ error: 'Error searching Google Books', details: error.message });
    }
};

// list all the books from a user, and sort it by the mode specified
export const getUserBooksList = async (req: Request, res: Response) => {
    const { id, sortType } = req.body;

    try {
        const userBooks = await UserBook.find({ userId: id });
        if (sortType === 'rate') {
            userBooks.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        // only keep the book IDs, the rate and the personal description
        const bookDetails = userBooks.map(book => ({
            idbook: book.bookId,
            rating: book.rating,
            personalDescription: book.personalDescription
        }));

        console.log("Book details:", bookDetails);

        // for each book, fetch its details from Google Books API
        const books = await Promise.all(bookDetails.map(async (book) => {
            const response = await axios.get(`https://www.googleapis.com/books/v1/volumes/${book.idbook}`);
            const volumeInfo = response.data.volumeInfo;
            return {
                idbook: book.idbook,
                rating: book.rating,
                personalDescription: book.personalDescription,
                volumeInfo: {
                    title: volumeInfo?.title,
                    authors: volumeInfo?.authors,
                    imageLinks: {
                        smallThumbnail: volumeInfo?.imageLinks?.smallThumbnail,
                        small: volumeInfo?.imageLinks?.thumbnail
                    }
                }
            };
        }));

        res.json(books);
    } catch (e: any) {
        res.status(500).json({ error: e.message || "Error fetching user's books" });
    }
};
