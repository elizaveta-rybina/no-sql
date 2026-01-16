# Лабораторная 6 — проектирование моделей данных Cassandra для книжного магазина

## Обзор решения

В папке `lab6` реализована полная демонстрация NoSQL-проектирования для системы управления книжным магазином на Apache Cassandra. Все пункты задания (1–6) закрыты артефактами и объяснениями.

**Как использовать:**

1. Запустить `docker-compose up` из папки lab6 — развернётся Cassandra + веб-UI.
2. Открыть `http://localhost:3000` в браузере.
3. Нажать кнопку **«Выполнить tasks.txt»** — создаст keyspace `bookstore` и выполнит все примеры запросов.
4. Нажать кнопФормализация сценариев доступа (query-first design)

**Где реализовано:** [tasks.txt](tasks.txt), строки после `USE bookstore;`, и описания в [report.md](report.md) (этот файл).

**Формализация:** Описаны 8 основных сценариев, каждый с указанием параметров, результата и частоты. Реальная демонстрация доступна в UI: выполните скрипт, и для каждого запроса увидите статус выполнения.

| #   | Описание запроса                                       | Параметры                       | Результат                                                                                    | Частота | Таблица                    |
| --- | ------------------------------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------- | ------- | -------------------------- |
| 1   | Получить все книги автора                              | `author_id`                     | `book_id`, `title`, `publication_year`, `category`                                           | Высокая | `books_by_author`          |
| 2   | Получить книги в категории с сортировкой по рейтингу   | `category_id`                   | `book_id`, `title`, `author_name`, `rating` (DESC)                                           | Высокая | `books_by_category`        |
| 3   | Получить карточку книги                                | `book_id`                       | Поля книги: `title`, `authors`, `category`, `description`, `average_rating`, `ratings_count` | Высокая | `books`                    |
| 4   | Получить отзывы по книге по дате (новые первыми)       | `book_id`, optional `limit`     | `user_id`, `rating`, `text`, `created_at` отсортировано по дате DESC                         | Высокая | `reviews_by_book_date`     |
| 5   | Получить отзывы по книге по рейтингу (высокие первыми) | `book_id`, optional `limit`     | То же, отсортировано по рейтингу DESC, затем по дате                                         | Средняя | `reviews_by_book_rating`   |
| 6   | Получить все отзывы пользователя                       | `user_id`, optional `limit`     | Отзывы пользователя, отсортированные по дате DESC                                            | Средняя | `reviews_by_user`          |
| 7   | Получить топ популярных книг в категории               | `category_id`, optional `limit` | `book_id`, `title`, `rating`, `popularity_score` DESC                                        | Средняя | `top_books_by_category`    |
| 8   | Получить книги автора в выбранной категории            | `author_id`, `category_id`      | `book_id`, `title`                                                                           | Низкая  | `books_by_author_category` |

- [tasks.txt](tasks.txt) — CREATE KEYSPACE + SELECT-запросы по сценариям (задания 1, 4, 5, 6).
- [data.txt](data.txt) — INSERT-команды для заполнения таблиц (задание 3).
- [report.md](report.md) — этот файл, с объяснениями по всем пунктам.

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

**Где реализовано:** [schema.cql](schema.cql) — полное определение всех таблиц с комментариями. Объяснение ключей и обоснование выбора ниже.

**Принципы проектирования:**

- Каждая таблица оптимизирована под один или несколько близких сценариев (query-first).
- PRIMARY KEY (partition + clustering) выбран так, чтобы **избежать ALLOW FILTERING**.
- Допускается и используется денормализация данных между таблицами.

**Таблицы и их структура:**

| Таблица | PRIMARY KEY | Назначение | Обоснование |
| ------- | ----------- | ---------- | ----------- |

| `books_by_autоздание схемы и заполнение данными

**Где реализовано:**

- **Схема**: [schema.cql](schema.cql) — CREATE KEYSPACE + CREATE TABLE для всех 8 таблиц.
- **Тестовые данные**: [data.txt](data.txt) — 70+ INSERT-команд для заполнения таблиц.

-- Пример вставки в books
INSERT INTO books (book_id, title, authors, category, description, average_rating, ratings_count)
VALUES (aaaaaaaa-0001-0000-0000-aaaaaaaa0001, '1984', ['George Orwell'], dddddddd-dddd-dddd-dddd-dddddddddddd,
'Novel about a totalitarian future.', 4.9, 1200);

-- Пример вставки в books_by_author
INSERT INTO books_by_author (author_id, book_id, title, publication_year, category)
VALUES (11111111-1111-1111-1111-111111111111, aaaaaaaa-0001-0000-0000-aaaaaaaa0001, '1984', 1949,
dddddddd-dddd-dddd-dddd-dddddddddddd);

-- Пример вставки в reviews_by_book_date
INSERT INTO reviews_by_book_date (book_id, created_at, user_id, rating, text)
VALUES (aaaaaaaa-0001-0000-0000-aaaaaaaa0001, '2024-01-01 10:00:00', 90000000-0000-0000-0000-000000000001,
5, 'Outstanding book.');

-- Все остальные вставки выполняются из [data.txt](data.txt) одной кнопкой.

- Агрегированные данные в `top_books_by_category`
- Кросс-записи в `books_by_author_category`

**Примеры вставок (фрагменты из [data.txt](data.txt)):**— partition, `created_at` DESC — clustering для обратной хронологии. Пагинация по свежим отзывам. |
| `reviews_by_book_rating` | `(book_id, rating, created_at)` | Отзывы книги по рейтингу (сценарий 5) | `book_id` — partition, `rating` DESC, `created_at` DESC — двухуровневая сортировка встроена в хранилище. |
| `reviews_by_user` | `(user_id, created_at)` | Все отзывы пользователя (сценарий 6) | `user_id` — partition, `created_at` DESC — хронологическая лента активности юзера. |
| `top_books_by_category` | `(category_id, popularity_score, book_id)` | Топ книг в категории (сценарий 7) | `category_id` — partition, `popularity_score` DESC — clustering, гарантирует отсортированный порядок. Данные агрегируются при вставке. |
| `books_by_author_category` | `((author_id, category_id), book_id)` | Книги автора в категории (сценарий 8) | Составной partition из `(author_id, category_id)` для точного попадания без фильтрации. `book_id` — clustering. |

**Ключевые решения:**

- **Денормализация**: информация о книге, авторе и категории дублируется в разные таблицы (например, `book_id` в `books` и `books_by_author`). Это позволяет читать данные за один запрос без JOIN.
- **Составные partition-ключи**: в `books_by_author_category` используется `(author_id, category_id)` для эффективного фильтра по двум параметрам.
- **Clustering order**: везде используется `WITH CLUSTERING ORDER BY` для гарантированной сортировки на диске (DESC для рейтингов и дат)
  **Где реализовано:** [tasks.txt](tasks.txt) содержит все 13 SELECT-запросов (8 основных + 2 антипаттерна + 3 пояснения). Выполняются нажатием кнопки **«Выполнить tasks.txt»** в UI.

**Все запросы реализованы без ALLOW FILTERING.** Ниже таблица с объяснением эффективности:

| #   | Запрос                                                                                                                                                              | Таблица                    | Почему эффективен                                                                                              | Используемые свойства Cassandra                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | `SELECT book_id, title, publication_year, category FROM books_by_author WHERE author_id = 11111111-1111-1111-1111-111111111111`                                     | `books_by_author`          | `author_id` — partition key, читается ровно одна партиция, все книги автора локальны.                          | Партиционирование по `author_id`, clustering по `book_id` для уникальности. |
| 2   | `SELECT book_id, title, author_name, rating FROM books_by_category WHERE category_id = ffffffff-ffff-ffff-ffff-ffffffffffff`                                        | `books_by_category`        | `category_id` — partition key, `rating DESC` — clustering key гарантирует отсортированный порядок на диске.    | Упорядоченное хранение по clustering key (DESC).                            |
| 3   | `SELECT title, authors, category, description, average_rating, ratings_count FROM books WHERE book_id = aaaaaaaa-0001-0000-0000-aaaaaaaa0001`                       | `books`                    | `book_id` — partition key, точный поиск O(1). Все данные в одной строке.                                       | Прямой доступ по partition key.                                             |
| 4   | `SELECT user_id, rating, text, created_at FROM reviews_by_book_date WHERE book_id = aaaaaaaa-0001-0000-0000-aaaaaaaa0001 LIMIT 10`                                  | `reviews_by_book_date`     | `book_id` — partition, `created_at DESC` — clustering обеспечивает пагинацию от свежих отзывов.                | Range query по clustering key с сортировкой на уровне хранилища.            |
| 5   | `SELECT user_id, rating, text FROM reviews_by_book_rating WHERE book_id = aaaaaaaa-0001-0000-0000-aaaaaaaa0001 LIMIT 10`                                            | `reviews_by_book_rating`   | `book_id` — partition, двухуровневая сортировка (`rating DESC, created_at DESC`) встроена в PRIMARY KEY.       | Составной clustering key с явным ORDER BY DESC.                             |
| 6   | `SELECT book_id, rating, text, created_at FROM reviews_by_user WHERE user_id = 90000000-0000-0000-0000-000000000001`                                                | `reviews_by_user`          | `user_id` — partition, `created_at DESC` — clustering для хронологической ленты.                               | Лентовое читалище по partition с сортировкой.                               |
| 7   | `SELECT book_id, title, rating, popularity_score FROM top_books_by_category WHERE category_id = ffffffff-ffff-ffff-ffff-ffffffffffff LIMIT 20`                      | `top_books_by_category`    | `category_id` — partition, `popularity_score DESC` — clustering. Топ вычисляется при вставке (денормализация). | Pre-aggregated data + clustering order.                                     |
| 8   | `SELECT book_id, title FROM books_by_author_category WHERE author_id = 11111111-1111-1111-1111-111111111111 AND category_id = dddddddd-dddd-dddd-dddd-dddddddddddd` | `books_by_author_category` | Составной partition `(author_id, category_id)` даёт точное попадание без фильтрации.                           | Составной partition key (tuple-partition).                                  |

**Запросы выполняются с конкретными UUID** (из [data.txt](data.txt)), например:

- `author_id = 11111111-1111-1111-1111-111111111111` (George Orwell)
- `book_id = aaaaaaaa-0001-0000-0000-aaaaaaaa0001` (1984)
- `category_id = ffffffff-ffff-ffff-ffff-ffffffffffff` (Fantasy)
- `user_id = 90000000-0000-0000-0000-000000000001` (первый тестовый юзер)

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
  - При RF=1 (Анализ ограничений и антипаттернов

**Где реализовано:** [tasks.txt](tasks.txt), строки 130–175. Два примера неэффективных запросов демонстрируют ограничения Cassandra.

**Антипаттерн 1: Полнотекстовый поиск по названию (без индекса)**

````sql
**Где реализовано:** [tasks.txt](tasks.txt), строки 174–190. [docker-compose.yml](docker-compose.yml) использует `SimpleStrategy` с RF=1. Рекомендации и обоснование ниже.

### 6.1 Влияние фактора репликации (RF) на архитектуру

| Аспект | RF = 1 | RF = 2 | RF = 3 (рекомендуется production) |
|--------|--------|--------|----------------------------------|
| **Доступность** | Минимальная (отказ = потеря данных) | Средняя (1 отказ терпим) | Высокая (2 отказа терпимы) |
| **Отказоустойчивость** | Нет (одна копия) | Слабая | Полная (кворум) |
| **Скорость записи** | Быстро (1 узел) | Средне (2 узла, fan-out) | Медленнее (3 узла) |
| **Скорость чтения (CL=ONE)** | 1 узел | 1 узел | 1 узел (быстро) |
| **Скорость чтения (CL=QUORUM)** | 1 узел (RF=1, QUORUM=1) | 2 узла | 2 узла (большинство) |
| **Требуемые узлы кластера** | 1+ | 2+ | 3+ |

**Для локальной разработки** (как в `lab6`): RF=1 достаточна, минимум overhead.
**Для production**: RF=3 на 3+ узлах обеспечивает отказоустойчивость и надежность.

### 6.2 Выбор Consistency Level (CL) для конкретных сценариев

#### Сценарий A: Просмотр каталога книг (сценарии 1, 2, 7, 8)

**Запрос:**
```sql
SELECT * FROM books_by_category WHERE category_id = ?;
SELECT * FROM top_books_by_category WHERE category_id = ?;
````

**Рекомендуемый CL: `ONE` или `LOCAL_ONE`**

**Обоснование:**

- Это **читать-интенсивные** витрины; свежесть данных менее критична.
- Eventual consistency приемлема: несекундная задержка обновления рейтинга не сломает UX.
- `LOCAL_ONE` = чтение только с локального датацентра, минимальная латентность (<10ms).
- При RF≥2 повышает пропускную способность (не ждём удалённых узлов).

**Пример:**

```java
// Pseudo-code для драйвера Cassandra
session.execute(query, ConsistencyLevel.LOCAL_ONE);
```

#### Сценарий B: Запись отзыва пользователя (сценарии 4–6)

**Запрос:**

```sql
INSERT INTO reviews_by_book_date (...) VALUES (...);
INSERT INTO reviews_by_book_rating (...) VALUES (...);
```

**Рекомендуемый CL для записи: `QUORUM`**  
**Рекомендуемый CL для чтения отзывов: `LOCAL_QUORUM`**

**Обоснование:**

- **Запись на QUORUM**: требует ответов от большинства узлов (при RF=3: 2 узла). Гарантирует, что даже при отказе одного узла данные не теряются.
- **Чтение на LOCAL_QUORUM**: балансирует между целостностью (видим большинство реплик) и задержкой (не ждём удалённых).
- Критичность: отзывы — важные пользовательские данные; потеря недопустима.

**Пример:**

```java
// Запись
session.execute(insertQuery, ConsistencyLevel.QUORUM);

// Чтение
session.execute(selectQuery, ConsistencyLevel.LOCAL_QUORUM);
```

#### Сценарий C: Обновление среднего рейтинга книги (сценарий 3)

**Запрос:**

```sql
-- Периодически обновляется (batch job)
UPDATE books SET average_rating = ?, ratings_count = ? WHERE book_id = ?;
```

**Рекомендуемый CL: `QUORUM`**

**Обоснование:**

- Агрегированные данные требуют надежности (расчёт прерывается, нужна консистентность).
- QUORUM гарантирует, что при следующем batch-обновлении видим последний расчёт.
- Не критично для каждого отзыва, но для итогового значения.

---

### 6.3 Правила thumb для выбора CL

| Тип операции                   | Требуемая консистентность   | Рекомендуемый CL | Частота использования        |
| ------------------------------ | --------------------------- | ---------------- | ---------------------------- |
| Читать витрины, каталог        | Eventual (несекунды)        | `LOCAL_ONE`      | Очень частая (>95% запросов) |
| Писать пользовательские данные | Strong (данные не теряются) | `QUORUM`         | Частая (~3% запросов)        |
| Читать критичные данные        | Strong (видим последнее)    | `LOCAL_QUORUM`   | Средняя (~2% запросов)       |
| Писать non-critical events     | Eventual                    | `ONE`            | Редко (логирование)          |

**Для lab6 (RF=1):**

- Все CL работают одинаково (только 1 реплика).
- При добавлении RF≥2 применяйте таблицу выше.

---

## Итоговая чек-лист

- ✅ **Задание 1**: 8 сценариев доступа с параметрами, результатами, частотой → [tasks.txt](tasks.txt), таблица выше.
- ✅ **Задание 2**: 8 таблиц с PRIMARY KEY, partition/clustering, обоснование → [schema.cql](schema.cql) + описания выше.
- ✅ **Задание 3**: CREATE KEYSPACE, CREATE TABLE, INSERT тестовые данные → [tasks.txt](tasks.txt), [schema.cql](schema.cql), [data.txt](data.txt).
- ✅ **Задание 4**: CQL-запросы для каждого сценария без ALLOW FILTERING → [tasks.txt](tasks.txt), таблица в разделе 4.
- ✅ **Задание 5**: 2 антипаттерна + обоснование почему + альтернативы → раздел 5 выше.
- ✅ **Задание 6**: Влияние RF, выбор CL для 2+ сценариев с обоснованием → раздел 6.

**Как использовать полученное решение:**

1. `docker-compose up` в папке `lab6` → Cassandra + веб-UI.
2. Нажмите **"Выполнить tasks.txt"** → создание keyspace и примеры запросов.
3. Нажмите **"Выполнить data.txt"** → заполнение данных.
4. Скопируйте содержимое [schema.cql](schema.cql) → создание таблиц (в UI или cqlsh).
5. Результаты запросов видны в UI с объяснением эффективности
   **Архитектурные альтернативы:**
6. **Отдельная таблица**: `books_by_title` с PRIMARY KEY `(title, book_id)` и денормализованными авторами.
7. **Search-движок**: Elasticsearch/OpenSearch с реплицированием из Cassandra (асинхронным через Kafka/Logstash).
8. **SASI индекс**: Cassandra Storage-Attached Secondary Index (экспериментальный, требует осторожности).

---

**Антипаттерн 2: Глобальный топ книг без категории**

```sql
SELECT * FROM books WHERE average_rating > 4.5;
```

**Почему неэффективен:**

- `average_rating` — обычная колонка, не часть PRIMARY KEY.
- Требует полное сканирование всей таблицы `books` (все партиции).
- Если попытаться использовать диапазон (`> 4.5`), нужно `ALLOW FILTERING` — работает медленно.
- Единственный горячий раздел: при рассчитке глобального топа без категории все вычисления упадут в одну partition, что нарушит балансировку кластера.

**Архитектурные альтернативы:**

1. **Денормализация по категориям**: Уже реализовано как `top_books_by_category` (сценарий 7). Пользователю рекомендуется просматривать топ внутри категории.
2. **Шардирование**: Таблица `top_books_global_by_bucket` с partition `bucket_id` (0–9) для распределения нагрузки:
   ```sql
   CREATE TABLE top_books_global_by_bucket (
       bucket_id INT,
       popularity_score DOUBLE,
       book_id UUID,
       title TEXT,
       rating DOUBLE,
       PRIMARY KEY (bucket_id, popularity_score, book_id)
   ) WITH CLUSTERING ORDER BY (popularity_score DESC);
   ```
   Вычисляется фоновой job; клиент читает все buckets и мерджит результаты.
3. **Аналитическая СУБД**: ClickHouse, Presto или Spark для OLAP запросов; Cassandra остаётся для OLTP.
4. **Кеш**: Redis/Memcached для предвычисленного топа (обновляется каждый час/день).

---

**Выводы:**

- Cassandra оптимальна для **known query patterns** (заранее определённые запросы).
- Для **ad-hoc аналитики** и поиска требуются дополнительные системы.
- Денормализация — мощный инструмент, но требует careful планирования и документации

Все пункты задания (сценарии, схемы, запросы, анализ ограничений, рекомендации по репликации/CL) описаны и связаны с готовыми артефактами в папке `lab6`. Для демонстрации достаточно поднять окружение и выполнить CQL из `schema.cql` и блока вставок выше.
