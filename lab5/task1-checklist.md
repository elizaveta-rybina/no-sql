# Задание 1: Проектирование XML-модели данных — Чек-лист выполнения

## 1. XML-документ для проектов университета ✓

**Файл:** `lab5/data.xml`  
**Описание:** Корневой элемент `<universityResearch>` содержит полную экосистему проектов с связанными справочниками.

---

## 2. Содержимое каждого проекта

### 2.1 Уникальный идентификатор ✓

```xml
<project id="proj-001" ... >
```

- Каждый проект имеет атрибут `@id` (строка вида `proj-XXX`)
- Валидируется XSD типом `xs:ID` с уникальностью через `xs:key`

### 2.2 Название и аннотация ✓

```xml
<project ...>
  <title>Adaptive Learning Digital Twins</title>
  <abstract>Digital twins for personalized learning...</abstract>
  ...
</project>
```

- `<title>` — название проекта
- `<abstract>` — полная аннотация
- Оба оставлены элементами (строки без ограничений по длине)

### 2.3 Список участников (ФИО, роль, аффилиация) ✓

```xml
<participants>
  <participant researcherRef="r1" role="principal-investigator" commitment="0.6"/>
  <participant researcherRef="r8" role="data-engineer" commitment="0.5"/>
  ...
</participants>
```

В справочнике `<researchers>`:

```xml
<researcher id="r1">
  <name>Dr. Anna Petrova</name>
  <affiliation>AI Systems Lab</affiliation>
  <email>anna.petrova@uni.example</email>
  <orcid>0000-0001-2345-6789</orcid>
</researcher>
```

- **ФИО** — элемент `<name>` в справочнике
- **Роль** — атрибут `@role` (перечисление: principal-investigator, data-engineer, advisor, analyst, student, co-investigator)
- **Аффилиация** — элемент `<affiliation>` в справочнике
- **Commitment** — атрибут `@commitment` (процент участия от 0 до 1)
- Связь через `@researcherRef` (xs:IDREF) убирает дублирование

### 2.4 Перечень публикаций ✓

```xml
<publications>
  <publication id="pub-001" year="2024" type="journal" doi="10.1234/twins.2024.001">
    <title>Behavior-Aware Digital Twins for Adaptive Learning</title>
    <authors>
      <author researcherRef="r1"/>
      <author researcherRef="r8"/>
    </authors>
  </publication>
  ...
</publications>
```

- Каждая публикация имеет:
  - `@id` — уникальный ID (xs:ID)
  - `@year` — год выпуска (xs:gYear)
  - `@type` — перечисление (journal, conference, dataset-paper, preprint)
  - `@doi` — идентификатор (валидируется паттерном `10.[0-9]{4,9}/.+`)
  - `<title>` — название
  - `<authors>` — вложенный список с ссылками на исследователей через `@researcherRef` (xs:IDREF)

### 2.5 Информация о финансировании ✓

```xml
<funding>
  <grant id="g-001" funderRef="f1" amount="250000" currency="USD" start="2024-01-01" end="2025-12-31">
    <program>National AI Initiative</program>
    <allocation>
      <workPackage name="Data Collection" percentage="35"/>
      <workPackage name="Modeling" percentage="45"/>
      <workPackage name="Dissemination" percentage="20"/>
    </allocation>
  </grant>
</funding>
```

В справочнике `<funders>`:

```xml
<funder id="f1">
  <name>National Science Foundation</name>
  <program>National AI Initiative</program>
</funder>
```

- **Грант** имеет `@id`, `@funderRef` (ссылка на фондера через xs:IDREF)
- **Финансовые данные** как атрибуты: `@amount` (xs:decimal), `@currency` (USD/EUR), `@start` и `@end` (xs:date)
- **Программа финансирования** — элемент `<program>`
- **Разбивка бюджета** — вложенная структура `<allocation/workPackage>` с `@name` и `@percentage`
- **Фондер** из справочника `<funders>` (не дублируется в проекте)

### 2.6 Связанные датасеты (название, формат, объём, ссылка) ✓

```xml
<datasets>
  <datasetRef ref="ds-001" usage="training"/>
  <datasetRef ref="ds-002" usage="validation"/>
</datasets>
```

В справочнике `<datasetsCatalog>`:

```xml
<dataset id="ds-001">
  <title>Adaptive Learning Interaction Logs</title>
  <format>json</format>
  <sizeGB>12.5</sizeGB>
  <access>
    <url>https://data.example.org/datasets/learning-logs</url>
    <license>CC-BY-4.0</license>
  </access>
</dataset>
```

- **Название** — элемент `<title>`
- **Формат** — элемент `<format>` (перечисление: csv, json, parquet, hdf5, geojson)
- **Объём** — элемент `<sizeGB>` (xs:decimal)
- **Ссылка** — элемент `<url>` (xs:anyURI) с `<license>`
- **Использование в проекте** — атрибут `@usage` (training, validation, evaluation, benchmark)
- Связь через `@ref` на `@id` датасета (xs:IDREF) убирает дублирование

---

## 3. Атрибуты vs Элементы — обоснованное разделение

| Данные                                          | Выбор   | Обоснование                                                                                        |
| ----------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `@id`, `@ref`                                   | Атрибут | Идентификаторы и ссылки — компактно, быстро парсится, валидируется xs:ID/IDREF                     |
| `@role`, `@type`, `@format`                     | Атрибут | Перечисления — фиксированный набор значений, эффективнее хранить как атрибут                       |
| `@year`, `@doi`, `@amount`, `@currency`         | Атрибут | Метаданные точка-в-точку без вложимой структуры; дата/число удобнее валидировать                   |
| `<name>`, `<title>`, `<abstract>`               | Элемент | Текст переменной длины без ограничений; элемент лучше поддерживает escaping и смешанное содержимое |
| `<participants>`, `<publications>`, `<funding>` | Элемент | Коллекции — хотя бы один элемент, заложено в структуру (minOccurs ≥ 1)                             |
| `<allocation/workPackage>`                      | Элемент | Иерархия в иерархии — вложенная детализация, требует структурного представления                    |

---

## 4. Архитектурные решения

### 4.1 Справочники вынесены отдельно

```xml
<universityResearch>
  <researchers>...</researchers>
  <funders>...</funders>
  <datasetsCatalog>...</datasetsCatalog>
  <projects>...</projects>
</universityResearch>
```

**Почему:**

- **Избежать дублирования:** один исследователь участвует в нескольких проектах, но описан один раз в справочнике.
- **Нормализация:** фондеры и датасеты тоже переиспользуются, справочник обеспечивает single source of truth.
- **Ссылочная целостность:** xs:ID/xs:IDREF автоматически валидирует все ссылки на этапе парсинга.

### 4.2 Ссылки через ID/IDREF вместо вложения

**Пример:** вместо вложения полного профиля исследователя в каждый проект:

```xml
<!-- Неправильно (дублирование): -->
<project>
  <participants>
    <participant>
      <researcher>
        <name>Dr. Anna Petrova</name>
        <affiliation>AI Systems Lab</affiliation>
        ...
      </researcher>
    </participant>
  </participants>
</project>
```

**Правильно (через xs:IDREF):**

```xml
<participant researcherRef="r1" role="principal-investigator"/>
```

### 4.3 Различная глубина вложенности

- **Уровень 1:** `universityResearch` → корень
- **Уровень 2:** `researchers`, `projects`, `funders`, `datasetsCatalog` → разделы
- **Уровень 3:** `project` → отдельный проект; `researcher` → отдельный исследователь
- **Уровень 4:** `participants`, `publications`, `funding`, `datasets` → коллекции внутри проекта
- **Уровень 5:** `participant`, `publication`, `grant` → элементы коллекций
- **Уровень 6:** `authors`, `allocation` → вложенные структуры публикаций и грантов
- **Уровень 7:** `author`, `workPackage` → элементы вложенных структур

**Глубина достигается комбинацией элементов (`publications` → `publication` → `authors` → `author`) и вложенной детализации бюджета (`funding` → `grant` → `allocation` → `workPackage`).**

---

## 5. Количество проектов и данные

**5 проектов (требование: не менее 5) ✓**

| ID       | Название                             | Участники | Публикации | Гранты | Датасеты | Статус    |
| -------- | ------------------------------------ | --------- | ---------- | ------ | -------- | --------- |
| proj-001 | Adaptive Learning Digital Twins      | 3         | 2          | 1      | 1        | active    |
| proj-002 | Urban Air Quality Predictive Maps    | 3         | 1          | 1      | 2        | active    |
| proj-003 | Privacy-Preserving Genomic Analytics | 4         | 1          | 1      | 2        | active    |
| proj-004 | Renewable Microgrid Optimization     | 3         | 2          | 1      | 2        | completed |
| proj-005 | Multilingual Document QA             | 3         | 1          | 1      | 2        | active    |

**Особенности:**

- Разное количество участников (3-4)
- Разное количество публикаций (1-2)
- Все имеют по одному гранту
- Разное использование датасетов (training, validation, benchmark, evaluation)
- Разные статусы (active, completed)

---

## 6. Проверка отсутствия дублирования

### ✓ Исследователи

- Определены один раз в `<researchers>`
- 8 уникальных исследователей (r1-r8)
- Участвуют в проектах через `@researcherRef` (xs:IDREF)
- Пример: Dr. Anna Petrova (r1) участвует в proj-001, proj-005 — без дублирования данных

### ✓ Фондеры

- 4 уникальных фондера (f1-f4) в `<funders>`
- Проекты ссылаются через `@funderRef` (xs:IDREF)
- Пример: NSF финансирует proj-001 и proj-005

### ✓ Датасеты

- 6 уникальных датасетов (ds-001 до ds-006) в `<datasetsCatalog>`
- Проекты ссылаются через `<datasetRef @ref>` (xs:IDREF)
- Пример: ds-001 используется в proj-001, proj-002, proj-005 (training/validation/evaluation)

### ✓ Публикации

- Каждая публикация уникальна (pub-001, pub-002, ..., pub-007)
- Авторы ссылаются на исследователей через `@researcherRef` (xs:IDREF), не дублируют их данные

---

## Итоговая таблица соответствия требованиям

| Требование                                           | Статус | Как реализовано                                                                             |
| ---------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| XML-документ исследовательских проектов              | ✅     | `lab5/data.xml`, корень `<universityResearch>`                                              |
| Уникальный идентификатор проекта                     | ✅     | Атрибут `@id` типа xs:ID в `<project>`                                                      |
| Название и аннотация                                 | ✅     | Элементы `<title>` и `<abstract>`                                                           |
| Список участников (ФИО, роль, аффилиация)            | ✅     | `<participants>` → ссылки на справочник `<researchers>` через xs:IDREF + роль в `@role`     |
| Перечень публикаций                                  | ✅     | `<publications>` → `<publication>` с авторами через xs:IDREF                                |
| Информация о финансировании                          | ✅     | `<funding>` → `<grant>` со ссылкой на `<funders>` + `<allocation/workPackage>` для разбивки |
| Связанные датасеты (название, формат, объём, ссылка) | ✅     | `<datasets>` → ссылки на `<datasetsCatalog>` через xs:IDREF с атрибутом `@usage`            |
| Определение атрибутов vs элементов                   | ✅     | Метаданные/ID/роли → атрибуты; текст/коллекции/иерархия → элементы (см. таблица выше)       |
| Архитектурное пояснение                              | ✅     | `lab5/report.md` — обоснование справочников, ссылок, отсутствия дублирования                |
| Не менее 5 проектов                                  | ✅     | 5 проектов: proj-001, proj-002, proj-003, proj-004, proj-005                                |
| Различная глубина вложенности                        | ✅     | От 2-х уровней (фондеры) до 7-ми (публикации с авторами, гранты с work packages)            |
| Отсутствие дублирования                              | ✅     | Справочники + xs:IDREF ссылки вместо вложения; одна запись — одно место определения         |

---

## Файлы для проверки

1. **XML данные:** `lab5/data.xml`
2. **XSD схема с валидацией:** `lab5/schema.xsd`
3. **Архитектурное обоснование:** `lab5/report.md`

**Команда проверки:** `xmllint --noout --schema lab5/schema.xsd lab5/data.xml`  
(Если нет ошибок — всё требование выполнено ✓)
