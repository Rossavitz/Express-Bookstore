process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let book_isbn;

beforeEach(async () => {
  let results = await db.query(`
        INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES('12345','http://a.co/eobPtX2', 'Matthew Lane', 'english', 264, 'Princeton University Press', 'Power-Up: Unlocked the Hidden Mathematics in Video Games', 2017)
        RETURNING isbn`);

  book_isbn = results.rows[0].isbn;
});

describe("GET /books", function () {
  test("Gets a list of book/s", async function () {
    const response = await request(app).get(`/books`);
    const books = response.body.books;
    expect(books).toHaveLength(1);
    expect(books[0]).toHaveProperty("isbn");
  });
});

describe("GET /books/:isbn", function () {
  test("Gets a book", async function () {
    const response = await request(app).get(`/books/${book_isbn}`);
    expect(response.body.book).toHaveProperty("isbn");
  });
});

describe("POST /books", function () {
  test("Create a book", async function () {
    const response = await request(app).post(`/books`).send({
      isbn: "67889",
      amazon_url: "https://test.com",
      author: "Test Author",
      language: "Test Language",
      pages: 100,
      publisher: "Test Publisher",
      title: "Test Title",
      year: 2024,
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
  });

  test("Prevent create book without all requirements", async function () {
    const response = await request(app).post(`/books`).send({
      isbn: "67889",
      amazon_url: "https://test.com",
      author: "Test Author",
      language: "Test Language",
      year: 2024,
    });
    expect(response.statusCode).toBe(400);
  });
});

describe("DELETE /book/:isbn", function () {
  test("Delete a book", async function () {
    const response = await request(app).delete(`/books/${book_isbn}`);
    expect(response.body).toEqual({ message: "Book deleted" });
  });
});

describe("PUT /books/:isbn", function () {
  test("Update a book", async function () {
    const response = await request(app).put(`/books/${book_isbn}`).send({
      isbn: book_isbn,
      amazon_url: "https://Update.com",
      author: "Update Author",
      language: "Update Language",
      pages: 200,
      publisher: "Update Publisher",
      title: "Update Title",
      year: 2023,
    });
    expect(response.body.book.year).toBe(2023);
    expect(response.body.book.language).toBe("Update Language");
  });

  test("prevent update on book without requirements", async function () {
    const response = await request(app).put(`/books/${book_isbn}`).send({
      isbn: book_isbn,
      publisher: "Fail Update Publisher",
      title: "Fail Update Title",
      year: 2023,
    });
    expect(response.statusCode).toBe(400);
  });
});

afterEach(async function () {
  await db.query("DELETE FROM books");
});

afterAll(async function () {
  await db.end();
});
