# Лабораторная 6 — проектирование моделей данных Cassandra для книжного магазина

Ниже показано, как в рамках папки `lab6` закрыты все пункты задания: от сценариев доступа до объяснений репликации и согласованности.

## Окружение и запуск

- Docker-окружение разворачивает Cassandra 4.1 и веб-интерфейс для работы с кластера ([docker-compose.yml](docker-compose.yml)).
- Веб-приложение на Node.js/Express предоставляет API для работы с Cassandra и статический UI ([Dockerfile](Dockerfile), [package.json](package.json), [server.js](server.js), [public/\*](public/index.html)).
- После `docker-compose up` доступен UI на `http://localhost:3000` для отправки CQL-запросов и просмотра схемы.

## Задание 1. Сценарии доступа (query-first)

| #   | Описание запроса                                       | Параметры                       | Результат                                                                                    | Частота |
| --- | ------------------------------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------- | ------- |
| 1   | Получить все книги автора                              | `author_id`                     | `book_id`, `title`, `publication_year`, `category`                                           | Высокая |
| 2   | Получить книги в категории с сортировкой по рейтингу   | `category_id`                   | `book_id`, `title`, `author_name`, `rating` (DESC)                                           | Высокая |
| 3   | Получить карточку книги                                | `book_id`                       | Поля книги: `title`, `authors`, `category`, `description`, `average_rating`, `ratings_count` | Высокая |
| 4   | Получить отзывы по книге по дате (новые первыми)       | `book_id`, optional `limit`     | `user_id`, `rating`, `text`, `created_at` отсортировано по дате DESC                         | Высокая |
| 5   | Получить отзывы по книге по рейтингу (высокие первыми) | `book_id`, optional `limit`     | То же, отсортировано по рейтингу DESC, затем по дате                                         | Средняя |
| 6   | Получить все отзывы пользователя                       | `user_id`, optional `limit`     | Отзывы пользователя, отсортированные по дате DESC                                            | Средняя |
| 7   | Получить топ популярных книг в категории               | `category_id`, optional `limit` | `book_id`, `title`, `rating`, `popularity_score` DESC                                        | Средняя |
| 8   | Получить книги автора в выбранной категории            | `author_id`, `category_id`      | `book_id`, `title`                                                                           | Низкая  |

## Задание 2. Проектирование модели данных

Таблицы спроектированы под конкретные запросы и определены в [schema.cql](schema.cql).

- `books_by_author` — быстрый вывод каталога автора. PRIMARY KEY (`author_id` partition, `book_id` clustering) равномерно распределяет книги автора.
- `books_by_category` — выдача книг в категории по рейтингу. PRIMARY KEY (`category_id` partition, `rating`, `book_id` clustering) с сортировкой `rating DESC` для топов без ALLOW FILTERING.
- `books` — карточка книги по `book_id` (partition). Хранит описание и агрегаты.
- `reviews_by_book_date` — лента отзывов книги по времени. PRIMARY KEY (`book_id` partition, `created_at` clustering DESC) обеспечивает пагинацию от свежих к старым.
- `reviews_by_book_rating` — отзывы книги, отсортированные по рейтингу (вторично — по дате). PRIMARY KEY (`book_id` partition, `rating`, `created_at` clustering) с ORDER BY `rating DESC, created_at DESC`.
- `reviews_by_user` — профильные отзывы пользователя. PRIMARY KEY (`user_id` partition, `created_at` clustering DESC) для быстрого профиля активности.
- `top_books_by_category` — лидерборд популярности в категории. PRIMARY KEY (`category_id` partition, `popularity_score`, `book_id` clustering) с сортировкой `popularity_score DESC`.
- `books_by_author_category` — пересечение автора и категории. PRIMARY KEY ((`author_id`, `category_id`) составной partition, `book_id` clustering) для таргетированных выдач.

## Задание 3. Схема и тестовые данные

- Все таблицы созданы CQL-скриптом [schema.cql](schema.cql), который можно выполнить из UI (`cqlsh` или веб-интерфейс).
- Для демонстрации сценариев выполните примерные вставки (достаточные для отработки всех запросов):

```sql
USE bookstore;

INSERT INTO books (book_id, title, authors, category, description, average_rating, ratings_count)
VALUES (uuid(), 'Domain-Driven Design', ['Eric Evans'], uuid(), 'DDD basics', 4.8, 1200);

INSERT INTO books_by_author (author_id, book_id, title, publication_year, category)
VALUES (11111111-1111-1111-1111-111111111111, 22222222-2222-2222-2222-222222222222, 'Domain-Driven Design', 2003, 33333333-3333-3333-3333-333333333333);

INSERT INTO books_by_category (category_id, rating, book_id, title, author_name)
VALUES (33333333-3333-3333-3333-333333333333, 4.8, 22222222-2222-2222-2222-222222222222, 'Domain-Driven Design', 'Eric Evans');

INSERT INTO reviews_by_book_date (book_id, created_at, user_id, rating, text)
VALUES (22222222-2222-2222-2222-222222222222, toTimestamp(now()), 44444444-4444-4444-4444-444444444444, 5, 'Great book');

INSERT INTO reviews_by_book_rating (book_id, rating, created_at, user_id, text)
VALUES (22222222-2222-2222-2222-222222222222, 5, toTimestamp(now()), 44444444-4444-4444-4444-444444444444, 'Great book');

INSERT INTO reviews_by_user (user_id, created_at, book_id, rating, text)
VALUES (44444444-4444-4444-4444-444444444444, toTimestamp(now()), 22222222-2222-2222-2222-222222222222, 5, 'Great book');

INSERT INTO top_books_by_category (category_id, popularity_score, book_id, title, rating)
VALUES (33333333-3333-3333-3333-333333333333, 0.95, 22222222-2222-2222-2222-222222222222, 'Domain-Driven Design', 4.8);

INSERT INTO books_by_author_category (author_id, category_id, book_id, title)
VALUES (11111111-1111-1111-1111-111111111111, 33333333-3333-3333-3333-333333333333, 22222222-2222-2222-2222-222222222222, 'Domain-Driven Design');
```

## Задание 4. Реализация запросов

Ниже указаны таблицы и примерные CQL для всех сценариев.

1. Книги автора — `books_by_author`:

```sql
SELECT title, publication_year, category FROM books_by_author WHERE author_id = ?;
```

Используется partition key `author_id`; чтение последовательного диапазона без сканирования.

2. Книги категории по рейтингу — `books_by_category`:

```sql
SELECT title, author_name, rating FROM books_by_category WHERE category_id = ? LIMIT 50;
```

Partition `category_id`, кластеризация `rating DESC` даёт отсортированную выдачу без сортировки на стороне клиента.

3. Карточка книги — `books`:

```sql
SELECT * FROM books WHERE book_id = ?;
```

Точный поиск по partition key.

4. Отзывы по дате — `reviews_by_book_date`:

```sql
SELECT user_id, rating, text, created_at FROM reviews_by_book_date WHERE book_id = ? LIMIT 50;
```

Кластеризация `created_at DESC` обеспечивает чтение последних отзывов.

5. Отзывы по рейтингу — `reviews_by_book_rating`:

```sql
SELECT user_id, text, created_at FROM reviews_by_book_rating WHERE book_id = ? LIMIT 50;
```

Сортировка по `rating DESC, created_at DESC` встроена в таблицу.

6. Отзывы пользователя — `reviews_by_user`:

```sql
SELECT book_id, rating, text, created_at FROM reviews_by_user WHERE user_id = ? LIMIT 50;
```

Partition `user_id`, лента активности по времени.

7. Топ книг категории — `top_books_by_category`:

```sql
SELECT title, rating, popularity_score FROM top_books_by_category WHERE category_id = ? LIMIT 20;
```

Сортировка по `popularity_score DESC` уже заложена в clustering.

8. Книги автора в категории — `books_by_author_category`:

```sql
SELECT book_id, title FROM books_by_author_category WHERE author_id = ? AND category_id = ?;
```

Составной partition (`author_id`, `category_id`) даёт точное попадание без ALLOW FILTERING.

## Задание 5. Ограничения и антипаттерны

- Полнотекстовый поиск по названию книги с подстрокой. Причина: требует сканирования всех партиций или SASI/3rd-party. Альтернатива: вынести поиск в Elasticsearch/OpenSearch и хранить id в Cassandra.
- Глобальный топ книг по популярности без фильтрации по категории. Причина: потребовался бы один горячий раздел; кластер теряет баланс. Альтернатива: денормализовать по категориям (как `top_books_by_category`) или периодически агрегировать в отдельный keyspace/таблицу с шардированием по bucket (например, `top_books_global_by_bucket`).

## Задание 6. Репликация и согласованность

- Фактор репликации (RF):
  - Рост RF повышает доступность и отказоустойчивость (больше копий), но удорожает запись (fan-out) и может улучшить чтения при CL < RF за счёт локальности.
  - При RF=1 (локально) — минимум накладных расходов, но нет отказоустойчивости.
- Рекомендуемые Consistency Level:
  - Для пользовательской выдачи каталога (сценарии 1–2, 7–8): CL = `ONE`/`LOCAL_ONE` — минимальная латентность, допустима eventual consistency для витрин.
  - Для записи отзывов и получения средней оценки (сценарии 4–6): запись на CL = `QUORUM`, чтение `LOCAL_QUORUM` для балансировки целостности и задержек, особенно при RF>=3.

Все пункты задания (сценарии, схемы, запросы, анализ ограничений, рекомендации по репликации/CL) описаны и связаны с готовыми артефактами в папке `lab6`. Для демонстрации достаточно поднять окружение и выполнить CQL из `schema.cql` и блока вставок выше.
