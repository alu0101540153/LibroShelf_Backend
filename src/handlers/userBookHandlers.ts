// src/handlers/userBookHandlers.ts
import { Request, Response } from "express";
import axios from "axios";
import UserBook from "../models/UserBook";

// Add a book to user's collection
export const addUserBook = async (req: Request, res: Response) => {
    try {
        const { bookId } = req.body;

        // Optional: Check if the book exists in Google Books API
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
        const { id } = req.params; // id is googleBookId
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
        const { id } = req.params;

        const userBook = await UserBook.findOneAndDelete({ _id: id, userId: req.user._id });
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
    const { title } = req.query;
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