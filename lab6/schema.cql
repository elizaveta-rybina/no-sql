--Получение всех книг конкретного автора
--Таблица
CREATE TABLE books_by_author (
                                 author_id UUID,
                                 book_id UUID,
                                 title TEXT,
                                 publication_year INT,
                                 category UUID,
                                 PRIMARY KEY (author_id, book_id)
);

--Получение книг в заданной категории
--Таблица
CREATE TABLE books_by_category (
                                   category_id UUID,
                                   rating DOUBLE,
                                   book_id UUID,
                                   title TEXT,
                                   author_name TEXT,
                                   PRIMARY KEY (category_id, rating, book_id)
) WITH CLUSTERING ORDER BY (rating DESC);

--Получение карточки книги
--Таблица
CREATE TABLE books (
                       book_id UUID PRIMARY KEY,
                       title TEXT,
                       authors LIST<TEXT>,
                       category UUID,
                       description TEXT,
                       average_rating DOUBLE,
                       ratings_count INT
);

--Отзывы по книге
CREATE TABLE reviews_by_book_date (
                                      book_id UUID,
                                      created_at TIMESTAMP,
                                      user_id UUID,
                                      rating INT,
                                      text TEXT,
                                      PRIMARY KEY (book_id, created_at)
) WITH CLUSTERING ORDER BY (created_at DESC);

--Самые популярные книги в категории
--Таблица
CREATE TABLE top_books_by_category (
                                       category_id UUID,
                                       popularity_score DOUBLE,
                                       book_id UUID,
                                       title TEXT,
                                       rating DOUBLE,
                                       PRIMARY KEY (category_id, popularity_score, book_id)
) WITH CLUSTERING ORDER BY (popularity_score DESC);


--
CREATE TABLE reviews_by_book_rating (
    book_id UUID,
    rating INT,
    created_at TIMESTAMP,
    user_id UUID,
    text TEXT,
    PRIMARY KEY (book_id, rating, created_at)
) WITH CLUSTERING ORDER BY (rating DESC, created_at DESC);

--Все отзывы пользователя
--Таблица
CREATE TABLE reviews_by_user (
                                 user_id UUID,
                                 created_at TIMESTAMP,
                                 book_id UUID,
                                 rating INT,
                                 text TEXT,
                                 PRIMARY KEY (user_id, created_at)
) WITH CLUSTERING ORDER BY (created_at DESC);

--Книги автора в категории
--Таблица
CREATE TABLE books_by_author_category (
                                          author_id UUID,
                                          category_id UUID,
                                          book_id UUID,
                                          title TEXT,
                                          PRIMARY KEY ((author_id, category_id), book_id)
);
