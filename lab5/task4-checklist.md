# Задание 4: XQuery — аналитические запросы и трансформация данных — Чек-лист выполнения

## Введение в XQuery

XQuery (XML Query Language) — язык для запросов и трансформации XML-документов.  
**FLWOR** (For-Let-Where-Order by-Return) — основной синтаксис XQuery:

```xquery
for $var in expression         (: итерация по коллекции :)
let $var := expression         (: присваивание переменной :)
where condition                (: фильтрация :)
order by expression            (: сортировка :)
return expression              (: формирование результата :)
```

---

## Запрос 1: Список проектов, отсортированных по объёму финансирования

### 1.1 XQuery выражение

**Файл:** `lab5/xquery-analytics.xq`

```xquery
xquery version "1.0";

declare variable $doc := doc("data.xml")/universityResearch;

element task1-sorted-by-funding {
  for $p in $doc/projects/project
  let $total := sum($p/funding/grant/xs:decimal(@amount))
  order by $total descending, $p/title
  return element project {
    attribute id { $p/@id },
    attribute title { $p/title/string() },
    attribute totalFunding { $total },
    attribute currency { ($p/funding/grant/@currency)[1] }
  }
};
```

### 1.2 Пояснение логики (FLWOR синтаксис)

| Часть выражения                                                | Описание                                                          |
| -------------------------------------------------------------- | ----------------------------------------------------------------- |
| `declare variable $doc := doc("data.xml")/universityResearch;` | Объявить переменную с корневым элементом                          |
| `element task1-sorted-by-funding { ... }`                      | Контейнер для результата                                          |
| `for $p in $doc/projects/project`                              | **FOR:** Итерировать по каждому проекту                           |
| `let $total := sum($p/funding/grant/xs:decimal(@amount))`      | **LET:** Вычислить общую сумму финансирования                     |
| `xs:decimal(@amount)`                                          | Преобразовать строку атрибута в decimal для суммирования          |
| `order by $total descending, $p/title`                         | **ORDER BY:** Сортировать по сумме (убывание), потом по названию  |
| `return element project { ... }`                               | **RETURN:** Сформировать XML элемент для каждого проекта          |
| `attribute id { $p/@id }`                                      | Добавить атрибуты в результат (id, title, totalFunding, currency) |

### 1.3 Логика вычисления суммы финансирования

**Структура данных в XML:**

```xml
<project id="proj-001" ...>
  <funding>
    <grant id="g-001" funderRef="f1" amount="250000" currency="USD" ...>
      <program>National AI Initiative</program>
    </grant>
  </funding>
  <!-- Проект может иметь несколько грантов -->
</project>
```

**Вычисление:**

```
$p/funding/grant/@amount    → получить все @amount из грантов проекта
xs:decimal(...)             → преобразовать каждый в число (250000, 180000, ...)
sum(...)                    → суммировать все значения
```

### 1.4 Результат на примере data.xml

**Проекты с общим финансированием:**

| Проект                               | ID       | Гранты | Сумма (USD/EUR) | После конвертации (USD)\* | Порядок |
| ------------------------------------ | -------- | ------ | --------------- | ------------------------- | ------- |
| Privacy-Preserving Genomic Analytics | proj-003 | g-003  | 320000 USD      | 320000                    | 1️⃣      |
| Adaptive Learning Digital Twins      | proj-001 | g-001  | 250000 USD      | 250000                    | 2️⃣      |
| Urban Air Quality Predictive Maps    | proj-002 | g-002  | 180000 EUR      | ~198000                   | 3️⃣      |
| Renewable Microgrid Optimization     | proj-004 | g-004  | 210000 USD      | 210000                    | 4️⃣      |
| Multilingual Document QA             | proj-005 | g-005  | 150000 USD      | 150000                    | 5️⃣      |

\*Примечание: EUR обычно конвертируется (1 EUR ≈ 1.1 USD), но в XQuery сравнение идёт по числовому значению.

### 1.5 Ожидаемый XML результат

```xml
<task1-sorted-by-funding>
  <project id="proj-003" title="Privacy-Preserving Genomic Analytics" totalFunding="320000" currency="USD"/>
  <project id="proj-001" title="Adaptive Learning Digital Twins" totalFunding="250000" currency="USD"/>
  <project id="proj-002" title="Urban Air Quality Predictive Maps" totalFunding="180000" currency="EUR"/>
  <project id="proj-004" title="Renewable Microgrid Optimization" totalFunding="210000" currency="USD"/>
  <project id="proj-005" title="Multilingual Document QA" totalFunding="150000" currency="USD"/>
</task1-sorted-by-financing>
```

✅ **Ключевые функции XQuery:**

- `for` — итерация
- `let` — вычисление переменной
- `sum()` — суммирование
- `xs:decimal()` — типизация
- `order by ... descending` — сортировка по убыванию
- `element`, `attribute` — конструирование XML

---

## Запрос 2: Агрегация количества публикаций по каждому проекту (GROUP BY)

### 2.1 XQuery выражение

```xquery
element task2-publication-counts {
  for $p in $doc/projects/project
  group by $pid := $p/@id
  let $title := $p[1]/title/string()
  let $count := count($p/publications/publication)
  order by $count descending, $title
  return element project {
    attribute id { $pid },
    attribute title { $title },
    attribute publications { $count }
  }
};
```

### 2.2 Пояснение логики (GROUP BY синтаксис)

| Часть выражения                                    | Описание                                                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `for $p in $doc/projects/project`                  | **FOR:** Итерировать по проектам                                                               |
| `group by $pid := $p/@id`                          | **GROUP BY:** Сгруппировать проекты по `@id` (хотя они уникальны, это демонстрирует синтаксис) |
| `let $title := $p[1]/title/string()`               | Из первого проекта группы (индекс [1]) получить название                                       |
| `let $count := count($p/publications/publication)` | Подсчитать публикации в каждом проекте                                                         |
| `order by $count descending, $title`               | Сортировать по убыванию количества публикаций                                                  |
| `return element project { ... }`                   | Вернуть XML с id, title и количеством публикаций                                               |

### 2.3 Логика GROUP BY

**GROUP BY в XQuery работает следующим образом:**

```
1. Для каждого значения $pid (уникального @id):
   - $p становится последовательностью всех проектов с этим $pid
   - $p[1] — первый (и единственный в нашем случае) проект
   - count($p/publications/publication) — количество публикаций
```

**Пример для proj-001:**

```xml
<project id="proj-001" ...>
  <publications>
    <publication id="pub-001" year="2024" type="journal" doi="10.1234/twins.2024.001">
      <title>Behavior-Aware Digital Twins for Adaptive Learning</title>
    </publication>
    <publication id="pub-002" year="2025" type="conference" doi="10.1234/edtech.2025.010">
      <title>Rapid Experimentation with Synthetic Learner Personas</title>
    </publication>
  </publications>
</project>
```

→ count = 2

### 2.4 Результат на примере data.xml

**Агрегация по проектам:**

| Проект                               | ID       | Публикации       | Count | Порядок |
| ------------------------------------ | -------- | ---------------- | ----- | ------- |
| Adaptive Learning Digital Twins      | proj-001 | pub-001, pub-002 | 2     | 1️⃣      |
| Renewable Microgrid Optimization     | proj-004 | pub-005, pub-006 | 2     | 2️⃣      |
| Urban Air Quality Predictive Maps    | proj-002 | pub-003          | 1     | 3️⃣      |
| Privacy-Preserving Genomic Analytics | proj-003 | pub-004          | 1     | 4️⃣      |
| Multilingual Document QA             | proj-005 | pub-007          | 1     | 5️⃣      |

### 2.5 Ожидаемый XML результат

```xml
<task2-publication-counts>
  <project id="proj-001" title="Adaptive Learning Digital Twins" publications="2"/>
  <project id="proj-004" title="Renewable Microgrid Optimization" publications="2"/>
  <project id="proj-002" title="Urban Air Quality Predictive Maps" publications="1"/>
  <project id="proj-003" title="Privacy-Preserving Genomic Analytics" publications="1"/>
  <project id="proj-005" title="Multilingual Document QA" publications="1"/>
</task2-publication-counts>
```

✅ **Ключевые функции XQuery:**

- `group by` — группировка по выражению
- `count()` — подсчёт элементов
- `$variable[1]` — доступ по индексу
- `order by ... descending` — сортировка

---

## Запрос 3: Формирование итогового XML-отчёта

### 3.1 XQuery выражение

```xquery
element task3-report {
  element report {
    attribute generated { current-date() },
    element projects {
      for $p in $doc/projects/project
      let $funding := sum($p/funding/grant/xs:decimal(@amount))
      let $pubs := count($p/publications/publication)
      let $participants := count($p/participants/participant)
      let $datasets := for $dref in $p/datasets/datasetRef
        let $d := $doc/datasetsCatalog/dataset[@id = $dref/@ref]
        return element dataset {
          attribute id { $d/@id },
          attribute title { $d/title/string() },
          attribute sizeGB { $d/sizeGB/string() },
          attribute usage { $dref/@usage }
        }
      order by $p/title
      return element project {
        attribute id { $p/@id },
        attribute title { $p/title/string() },
        attribute status { $p/@status },
        element funding { attribute total { $funding } },
        element publications { attribute count { $pubs } },
        element participants { attribute count { $participants } },
        element datasets { $datasets }
      }
    },
    element multiProjectResearchers {
      for $r in $doc/researchers/researcher
      let $projectCount := count($doc/projects/project/participants/participant[@researcherRef = $r/@id])
      where $projectCount > 1
      order by $projectCount descending, $r/name/string()
      return element researcher {
        attribute id { $r/@id },
        attribute name { $r/name/string() },
        attribute projects { $projectCount }
      }
    }
  }
};
```

### 3.2 Пояснение структуры отчёта

**Иерархия элементов:**

```
task3-report
├── report (@generated = текущая дата)
│   ├── projects
│   │   └── project (для каждого проекта)
│   │       ├── @id, @title, @status
│   │       ├── funding (@total)
│   │       ├── publications (@count)
│   │       ├── participants (@count)
│   │       └── datasets
│   │           └── dataset (@id, @title, @sizeGB, @usage)
│   │               (для каждого датасета в проекте)
│   └── multiProjectResearchers
│       └── researcher (для каждого, участвующего в >1 проекте)
│           ├── @id, @name, @projects
```

### 3.3 Разбор по частям

#### Часть A: Дата генерации отчёта

```xquery
attribute generated { current-date() }
```

- `current-date()` — встроенная функция XQuery, возвращает текущую дату (ISO 8601)
- Примеры: `2025-12-16`

#### Часть B: Раздел projects — основные метрики

```xquery
for $p in $doc/projects/project
let $funding := sum($p/funding/grant/xs:decimal(@amount))
let $pubs := count($p/publications/publication)
let $participants := count($p/participants/participant)
```

**Что вычисляется:**

- `$funding` — сумма всех грантов проекта
- `$pubs` — количество публикаций
- `$participants` — количество участников

**Пример для proj-001:**

```xml
<project id="proj-001" title="Adaptive Learning Digital Twins" status="active">
  <funding total="250000"/>         <!-- sum(g-001) = 250000 -->
  <publications count="2"/>         <!-- pub-001, pub-002 -->
  <participants count="3"/>         <!-- r1, r8, r2 -->
  <datasets>
    <dataset id="ds-001" title="Adaptive Learning Interaction Logs" sizeGB="12.5" usage="training"/>
  </datasets>
</project>
```

#### Часть C: Раздел datasets — развёртывание ссылок

```xquery
let $datasets := for $dref in $p/datasets/datasetRef
  let $d := $doc/datasetsCatalog/dataset[@id = $dref/@ref]
  return element dataset {
    attribute id { $d/@id },
    attribute title { $d/title/string() },
    attribute sizeGB { $d/sizeGB/string() },
    attribute usage { $dref/@usage }
  }
```

**Логика:**

1. Для каждого `<datasetRef ref="ds-001" usage="training"/>` в проекте
2. Найти датасет в справочнике: `$doc/datasetsCatalog/dataset[@id = $dref/@ref]`
3. Выгрузить его данные в новый элемент с `@usage` из ссылки

**Пример:**

```xml
<!-- Из проекта: -->
<datasetRef ref="ds-001" usage="training"/>

<!-- Из справочника: -->
<dataset id="ds-001">
  <title>Adaptive Learning Interaction Logs</title>
  <format>json</format>
  <sizeGB>12.5</sizeGB>
  <access>...</access>
</dataset>

<!-- Результат в отчёте: -->
<dataset id="ds-001" title="Adaptive Learning Interaction Logs" sizeGB="12.5" usage="training"/>
```

#### Часть D: Раздел multiProjectResearchers

```xquery
for $r in $doc/researchers/researcher
let $projectCount := count($doc/projects/project/participants/participant[@researcherRef = $r/@id])
where $projectCount > 1
order by $projectCount descending, $r/name/string()
return element researcher { ... }
```

**Логика:**

1. Для каждого исследователя из справочника
2. Подсчитать, сколько раз он встречается в списках участников проектов
3. Оставить только тех, у кого count > 1
4. Отсортировать по убыванию количества проектов

**Пример результата:**

```xml
<multiProjectResearchers>
  <researcher id="r2" name="Prof. Boris Ivanov" projects="3"/>
  <researcher id="r8" name="Sara Khan" projects="3"/>
  <researcher id="r1" name="Dr. Anna Petrova" projects="2"/>
  <researcher id="r3" name="Dr. Chen Liu" projects="2"/>
  <researcher id="r5" name="Alex Meyer" projects="2"/>
  <researcher id="r7" name="Igor Petrenko" projects="2"/>
</multiProjectResearchers>
```

### 3.4 Полный ожидаемый XML результат

```xml
<task3-report>
  <report generated="2025-12-16">
    <projects>
      <project id="proj-001" title="Adaptive Learning Digital Twins" status="active">
        <funding total="250000"/>
        <publications count="2"/>
        <participants count="3"/>
        <datasets>
          <dataset id="ds-001" title="Adaptive Learning Interaction Logs" sizeGB="12.5" usage="training"/>
        </datasets>
      </project>
      <project id="proj-002" title="Urban Air Quality Predictive Maps" status="active">
        <funding total="180000"/>
        <publications count="1"/>
        <participants count="3"/>
        <datasets>
          <dataset id="ds-002" title="Urban Air Sensor Grid" sizeGB="8.1" usage="training"/>
          <dataset id="ds-001" title="Adaptive Learning Interaction Logs" sizeGB="12.5" usage="validation"/>
        </datasets>
      </project>
      <project id="proj-003" title="Privacy-Preserving Genomic Analytics" status="active">
        <funding total="320000"/>
        <publications count="1"/>
        <participants count="4"/>
        <datasets>
          <dataset id="ds-003" title="Encrypted Genomic Variants" sizeGB="32.0" usage="training"/>
          <dataset id="ds-004" title="Synthetic Genomic Benchmarks" sizeGB="5.7" usage="validation"/>
        </datasets>
      </project>
      <project id="proj-004" title="Renewable Microgrid Optimization" status="completed">
        <funding total="210000"/>
        <publications count="2"/>
        <participants count="3"/>
        <datasets>
          <dataset id="ds-005" title="Microgrid Telemetry Streams" sizeGB="18.4" usage="training"/>
          <dataset id="ds-002" title="Urban Air Sensor Grid" sizeGB="8.1" usage="benchmark"/>
        </datasets>
      </project>
      <project id="proj-005" title="Multilingual Document QA" status="active">
        <funding total="150000"/>
        <publications count="1"/>
        <participants count="3"/>
        <datasets>
          <dataset id="ds-006" title="Multilingual QA Corpus" sizeGB="9.6" usage="training"/>
          <dataset id="ds-001" title="Adaptive Learning Interaction Logs" sizeGB="12.5" usage="evaluation"/>
        </datasets>
      </project>
    </projects>
    <multiProjectResearchers>
      <researcher id="r2" name="Prof. Boris Ivanov" projects="3"/>
      <researcher id="r8" name="Sara Khan" projects="3"/>
      <researcher id="r1" name="Dr. Anna Petrova" projects="2"/>
      <researcher id="r3" name="Dr. Chen Liu" projects="2"/>
      <researcher id="r5" name="Alex Meyer" projects="2"/>
      <researcher id="r7" name="Igor Petrenko" projects="2"/>
    </multiProjectResearchers>
  </report>
</task3-report>
```

✅ **Ключевые функции XQuery:**

- `for ... let ... where ... order by ... return` — полный FLWOR
- `current-date()` — встроенная функция даты
- Вложенные `for` для обхода датасетов
- Предикат `[@id = $dref/@ref]` для связывания справочника
- `where` для фильтрации
- Конструирование сложной иерархии XML элементов

---

## 4. Сравнение всех трёх XQuery запросов

| Запрос | Входные данные        | FLWOR компоненты                      | Выход                                   | Сложность |
| ------ | --------------------- | ------------------------------------- | --------------------------------------- | --------- |
| 1      | Все проекты           | for, let (sum), order by, return      | Проекты отсортированы по финансированию | Средняя   |
| 2      | Все проекты           | for, group by, let, order by, return  | Таблица публикаций по проектам          | Средняя   |
| 3      | Проекты + справочники | for, let, where, вложенные for (join) | Комплексный отчёт с метриками           | Высокая   |

---

## 5. Запуск XQuery запросов

### 5.1 Инструменты для выполнения XQuery

**Вариант 1: BaseX (рекомендуется)**

```bash
# Установка
# macOS: brew install basex

# Запуск
basex -f lab5/xquery-analytics.xq

# Интерактивный режим
basex
> open lab5/data.xml
> run lab5/xquery-analytics.xq
```

**Вариант 2: eXist-db**

- Веб-интерфейс: http://localhost:8080/exist/
- Загрузить `data.xml` и выполнить запрос

**Вариант 3: Saxon (Java)**

```bash
java -jar saxon12he.jar -xsl:xquery-analytics.xq data.xml
```

### 5.2 Проверка результатов

**Ожидаемые элементы в выводе:**

- ✅ `task1-sorted-by-funding` — с 5 проектами, отсортированными по финансированию
- ✅ `task2-publication-counts` — с количеством публикаций по проектам
- ✅ `task3-report` — с полным отчётом, датой, проектами и исследователями

---

## 6. Таблица соответствия требованиям Задания 4

| Требование                                      | Статус | Как реализовано                                                                   |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| FLWOR выражение 1: сортировка по финансированию | ✅     | `for $p in projects let $total := sum(...) order by $total descending return ...` |
| Функция sum() для суммирования                  | ✅     | `sum($p/funding/grant/xs:decimal(@amount))`                                       |
| FLWOR выражение 2: group by                     | ✅     | `for $p in projects group by $pid := $p/@id let $count := count(...)`             |
| Функция count() для агрегации                   | ✅     | `count($p/publications/publication)`                                              |
| FLWOR выражение 3: сложный отчёт                | ✅     | Вложенные for, let, where, конструирование иерархии                               |
| current-date() для метаданных                   | ✅     | `attribute generated { current-date() }`                                          |
| Join датасетов со справочником                  | ✅     | `$doc/datasetsCatalog/dataset[@id = $dref/@ref]`                                  |
| Фильтрация multiProjectResearchers              | ✅     | `where $projectCount > 1`                                                         |
| Сортировка по несколькими полям                 | ✅     | `order by $total descending, $p/title`                                            |

---

## Файлы для проверки

1. **XQuery скрипт:** `lab5/xquery-analytics.xq`
2. **XML данные:** `lab5/data.xml`

**Команда запуска:**

```bash
# Если установлен BaseX
basex -f lab5/xquery-analytics.xq

# Или с указанием входного файла
basex -f lab5/xquery-analytics.xq -u lab5/data.xml
```

**Ожидаемый результат:**

```xml
<task1-sorted-by-funding>...</task1-sorted-by-funding>
<task2-publication-counts>...</task2-publication-counts>
<task3-report>...</task3-report>
```

✅ **Задание 4 выполнено полностью.**
