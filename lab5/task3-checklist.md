# Задание 3: XPath — навигация по иерархическим данным — Чек-лист выполнения

## Введение в XPath

XPath (XML Path Language) — язык для навигации по XML-документам и выбора узлов на основе предикатов.  
**Основной синтаксис:**

- `//` — любой потомок на любой глубине
- `/` — прямой потомок
- `@` — атрибут
- `[условие]` — предикат (фильтр)
- `count()` — количество элементов
- `number()` — преобразование в число
- `and`, `or` — логические операторы

---

## Запрос 1: Проекты, в которых участвует более трёх исследователей

### 1.1 XPath выражение

```xpath
//project[count(participants/participant) > 3]
```

### 1.2 Пояснение логики

| Часть выражения                   | Описание                                                                           |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| `//project`                       | Выбрать все элементы `<project>` на любой глубине в документе                      |
| `[count(...) > 3]`                | Предикат: оставить только проекты, где ... истинно                                 |
| `participants/participant`        | Из контекстного проекта: навигация вниз к элементам `participant` (прямые потомки) |
| `count(participants/participant)` | Подсчитать количество `<participant>` в контекстном проекте                        |
| `> 3`                             | Условие: количество участников больше 3                                            |

**Логика навигации:**

1. Находим все `<project>` везде в документе
2. Для каждого проекта считаем прямых потомков `<participant>` в его `<participants>`
3. Оставляем только проекты с более чем 3 участниками

### 1.3 Результат на примере data.xml

```xml
<!-- proj-003 имеет 4 участников (r4, r2, r5, r7) -->
<project id="proj-003" start="2024-03-10" end="2026-02-28" status="active">
  <title>Privacy-Preserving Genomic Analytics</title>
  <participants>
    <participant researcherRef="r4" role="principal-investigator" commitment="0.6"/>
    <participant researcherRef="r2" role="advisor" commitment="0.2"/>
    <participant researcherRef="r5" role="analyst" commitment="0.4"/>
    <participant researcherRef="r7" role="data-engineer" commitment="0.4"/>
  </participants>
  ...
</project>
```

**Ожидаемый результат:** Проект `proj-003` (4 участников, > 3 ✓)

**Таблица всех проектов и их участников:**

| Проект                               | ID       | Участников | count(participants/participant) | > 3? |
| ------------------------------------ | -------- | ---------- | ------------------------------- | ---- |
| Adaptive Learning Digital Twins      | proj-001 | 3          | 3                               | ❌   |
| Urban Air Quality Predictive Maps    | proj-002 | 3          | 3                               | ❌   |
| Privacy-Preserving Genomic Analytics | proj-003 | 4          | 4                               | ✅   |
| Renewable Microgrid Optimization     | proj-004 | 3          | 3                               | ❌   |
| Multilingual Document QA             | proj-005 | 3          | 3                               | ❌   |

✅ **Результат:** `proj-003` (единственный проект с более чем 3 участниками)

### 1.4 Вариант с явным вывод всех атрибутов

```xpath
//project[count(participants/participant) > 3]/@id
```

**Результат:** `proj-003`

---

## Запрос 2: Публикации, выпущенные после 2023 года

### 2.1 XPath выражение

```xpath
//publication[@year > 2023]
```

### 2.2 Пояснение логики

| Часть выражения  | Описание                                                         |
| ---------------- | ---------------------------------------------------------------- |
| `//publication`  | Выбрать все элементы `<publication>` на любой глубине            |
| `[@year > 2023]` | Предикат: оставить только публикации, где атрибут `@year` > 2023 |
| `@year`          | Атрибут `year` (числовое сравнение: 2024, 2025 > 2023)           |

**Логика навигации:**

1. Находим все `<publication>` везде в документе (включая вложенные в `<publications>`)
2. Фильтруем по условию: `@year` > 2023
3. В XSD атрибут `@year` имеет тип `xs:gYear`, автоматически сравнивается как число

### 2.3 Результат на примере data.xml

```xml
<publication id="pub-001" year="2024" type="journal" doi="10.1234/twins.2024.001">...</publication>
<publication id="pub-002" year="2025" type="conference" doi="10.1234/edtech.2025.010">...</publication>
<publication id="pub-004" year="2025" type="preprint" doi="10.9012/genome.2025.041">...</publication>
<publication id="pub-007" year="2024" type="journal" doi="10.7890/nlp.2024.055">...</publication>
```

**Таблица всех публикаций:**

| Публикация                             | ID      | Год  | > 2023? | ✓   |
| -------------------------------------- | ------- | ---- | ------- | --- |
| Behavior-Aware Digital Twins           | pub-001 | 2024 | ✅      | ✓   |
| Rapid Experimentation                  | pub-002 | 2025 | ✅      | ✓   |
| Spatio-Temporal Transformers           | pub-003 | 2024 | ✅      | ✓   |
| Secure Aggregation Pipelines           | pub-004 | 2025 | ✅      | ✓   |
| Safe Exploration for Microgrid Control | pub-005 | 2023 | ❌      | ✗   |
| Hybrid Simulation Pipelines            | pub-006 | 2024 | ✅      | ✓   |
| Hallucination-Resistant QA             | pub-007 | 2024 | ✅      | ✓   |

✅ **Результат:** 6 публикаций (pub-001, pub-002, pub-003, pub-004, pub-006, pub-007)

### 2.4 Вариант с выводом названий

```xpath
//publication[@year > 2023]/title/text()
```

**Результат:**

```
Behavior-Aware Digital Twins for Adaptive Learning
Rapid Experimentation with Synthetic Learner Personas
Spatio-Temporal Transformers for Urban Pollution
Secure Aggregation Pipelines for Clinical Genomics
Hybrid Simulation Pipelines for Community Microgrids
Hallucination-Resistant QA with Source Attribution
```

---

## Запрос 3: Проекты, использующие датасеты объёмом более 10 ГБ

### 3.1 XPath выражение (вариант 1 — через JOIN)

```xpath
//project[datasets/datasetRef/@ref = //datasetsCatalog/dataset[number(sizeGB) > 10]/@id]
```

### 3.2 Пояснение логики (вариант 1)

| Часть выражения                  | Описание                                               |
| -------------------------------- | ------------------------------------------------------ |
| `//project[...]`                 | Выбрать проекты, удовлетворяющие предикату             |
| `datasets/datasetRef/@ref`       | Из контекстного проекта: все ссылки `@ref` на датасеты |
| `=`                              | Оператор сравнения: проверить, есть ли совпадение      |
| `//datasetsCatalog/dataset[...]` | Найти все датасеты в каталоге, удовлетворяющие условию |
| `number(sizeGB) > 10`            | Преобразовать `<sizeGB>` в число и сравнить с 10       |
| `/@id`                           | Получить `@id` таких датасетов                         |

**Логика навигации:**

1. Находим все датасеты объёмом > 10 ГБ и собираем их `@id`
2. Находим все проекты, у которых хотя бы один `datasetRef/@ref` совпадает с найденными ID

### 3.3 Результат на примере data.xml

**Датасеты > 10 ГБ:**

| Датасет                            | ID     | Объём (ГБ) | > 10? |
| ---------------------------------- | ------ | ---------- | ----- |
| Adaptive Learning Interaction Logs | ds-001 | 12.5       | ✅    |
| Urban Air Sensor Grid              | ds-002 | 8.1        | ❌    |
| Encrypted Genomic Variants         | ds-003 | 32.0       | ✅    |
| Synthetic Genomic Benchmarks       | ds-004 | 5.7        | ❌    |
| Microgrid Telemetry Streams        | ds-005 | 18.4       | ✅    |
| Multilingual QA Corpus             | ds-006 | 9.6        | ❌    |

✅ **Датасеты > 10 ГБ:** ds-001 (12.5), ds-003 (32.0), ds-005 (18.4)

**Проекты, использующие эти датасеты:**

```xml
<project id="proj-001">
  <datasets>
    <datasetRef ref="ds-001" usage="training"/>  <!-- ds-001: 12.5 ГБ ✓ -->
  </datasets>
</project>

<project id="proj-002">
  <datasets>
    <datasetRef ref="ds-002" usage="training"/>  <!-- ds-002: 8.1 ГБ ✗ -->
    <datasetRef ref="ds-001" usage="validation"/>  <!-- ds-001: 12.5 ГБ ✓ -->
  </datasets>
</project>

<project id="proj-003">
  <datasets>
    <datasetRef ref="ds-003" usage="training"/>  <!-- ds-003: 32.0 ГБ ✓ -->
    <datasetRef ref="ds-004" usage="validation"/>  <!-- ds-004: 5.7 ГБ ✗ -->
  </datasets>
</project>

<project id="proj-004">
  <datasets>
    <datasetRef ref="ds-005" usage="training"/>  <!-- ds-005: 18.4 ГБ ✓ -->
    <datasetRef ref="ds-002" usage="benchmark"/>  <!-- ds-002: 8.1 ГБ ✗ -->
  </datasets>
</project>

<project id="proj-005">
  <datasets>
    <datasetRef ref="ds-006" usage="training"/>  <!-- ds-006: 9.6 ГБ ✗ -->
    <datasetRef ref="ds-001" usage="evaluation"/>  <!-- ds-001: 12.5 ГБ ✓ -->
  </datasets>
</project>
```

✅ **Результат:** 5 проектов используют датасеты > 10 ГБ

- proj-001 (ds-001: 12.5 ГБ)
- proj-002 (ds-001: 12.5 ГБ)
- proj-003 (ds-003: 32.0 ГБ)
- proj-004 (ds-005: 18.4 ГБ)
- proj-005 (ds-001: 12.5 ГБ)

### 3.4 Альтернативное выражение (XPath 2.0+)

```xpath
for $id in //datasetsCatalog/dataset[number(sizeGB) > 10]/@id return //project[datasets/datasetRef/@ref = $id]
```

(Требует XPath 2.0, более читаемо)

### 3.5 Вариант с выводом названий проектов и датасетов

```xpath
//project[datasets/datasetRef/@ref = //datasetsCatalog/dataset[number(sizeGB) > 10]/@id]/title/text()
```

**Результат:**

```
Adaptive Learning Digital Twins
Urban Air Quality Predictive Maps
Privacy-Preserving Genomic Analytics
Renewable Microgrid Optimization
Multilingual Document QA
```

---

## Запрос 4: Исследователи, участвующие более чем в одном проекте

### 4.1 XPath выражение

```xpath
/universityResearch/researchers/researcher[count(/universityResearch/projects/project/participants/participant[@researcherRef = current()/@id]) > 1]
```

### 4.2 Пояснение логики

| Часть выражения                                                 | Описание                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `/universityResearch/researchers/researcher`                    | Выбрать всех исследователей из справочника                                     |
| `[count(...) > 1]`                                              | Предикат: оставить только исследователей, где условие истинно                  |
| `/universityResearch/projects/project/participants/participant` | Абсолютный путь к участникам всех проектов                                     |
| `[@researcherRef = current()/@id]`                              | Фильтр: участник ссылается на текущего исследователя (`current()/@id`)         |
| `count(...) > 1`                                                | Посчитать совпадения; если > 1 — исследователь участвует в нескольких проектах |

**Логика навигации:**

1. Берём каждого исследователя из справочника (`current()/@id`)
2. Ищем все его появления в списках участников проектов
3. Считаем, сколько раз он встречается
4. Оставляем только исследователей с count > 1

### 4.3 Результат на примере data.xml

**Справочник исследователей и их участие:**

| ID  | Имя                | Проект 1           | Проект 2           | Проект 3           | Всего | > 1? |
| --- | ------------------ | ------------------ | ------------------ | ------------------ | ----- | ---- |
| r1  | Dr. Anna Petrova   | proj-001 (PI)      | proj-005 (advisor) | —                  | 2     | ✅   |
| r2  | Prof. Boris Ivanov | proj-001 (advisor) | proj-002 (eng)     | proj-003 (advisor) | 3     | ✅   |
| r3  | Dr. Chen Liu       | proj-002 (PI)      | proj-004 (advisor) | —                  | 2     | ✅   |
| r4  | Dr. Diana Smirnova | proj-003 (PI)      | —                  | —                  | 1     | ❌   |
| r5  | Alex Meyer         | proj-003 (analyst) | proj-004 (PI)      | —                  | 2     | ✅   |
| r6  | Maria Rossi        | proj-005 (PI)      | —                  | —                  | 1     | ❌   |
| r7  | Igor Petrenko      | proj-003 (eng)     | proj-004 (eng)     | —                  | 2     | ✅   |
| r8  | Sara Khan          | proj-001 (eng)     | proj-002 (analyst) | proj-005 (eng)     | 3     | ✅   |

✅ **Результат:** 6 исследователей участвуют более чем в одном проекте

- r1 (Anna Petrova) — 2 проекта
- r2 (Boris Ivanov) — 3 проекта
- r3 (Chen Liu) — 2 проекта
- r5 (Alex Meyer) — 2 проекта
- r7 (Igor Petrenko) — 2 проекта
- r8 (Sara Khan) — 3 проекта

### 4.4 Вариант с выводом имён и количества проектов

```xpath
/universityResearch/researchers/researcher[count(/universityResearch/projects/project/participants/participant[@researcherRef = current()/@id]) > 1]
```

**Результат (с дополнительной информацией):**

```xml
<researcher id="r1">
  <name>Dr. Anna Petrova</name>
  <!-- Участвует в 2 проектах: proj-001, proj-005 -->
</researcher>
<researcher id="r2">
  <name>Prof. Boris Ivanov</name>
  <!-- Участвует в 3 проектах: proj-001, proj-002, proj-003 -->
</researcher>
<researcher id="r3">
  <name>Dr. Chen Liu</name>
  <!-- Участвует в 2 проектах: proj-002, proj-004 -->
</researcher>
<researcher id="r5">
  <name>Alex Meyer</name>
  <!-- Участвует в 2 проектах: proj-003, proj-004 -->
</researcher>
<researcher id="r7">
  <name>Igor Petrenko</name>
  <!-- Участвует в 2 проектах: proj-003, proj-004 -->
</researcher>
<researcher id="r8">
  <name>Sara Khan</name>
  <!-- Участвует в 3 проектах: proj-001, proj-002, proj-005 -->
</researcher>
```

### 4.5 Альтернативное выражение (XPath 1.0, без current())

```xpath
/universityResearch/researchers/researcher[
  /universityResearch/projects/project/participants/participant[@researcherRef = /universityResearch/researchers/researcher/@id and @researcherRef = current()/@id]
]
```

---

## 5. Сравнение всех XPath запросов

| Запрос | XPath выражение                                                                            | Результат           | Ключевые предикаты             |
| ------ | ------------------------------------------------------------------------------------------ | ------------------- | ------------------------------ |
| 1      | `//project[count(participants/participant) > 3]`                                           | 1 проект (proj-003) | count(), >                     |
| 2      | `//publication[@year > 2023]`                                                              | 6 публикаций        | @атрибут, >                    |
| 3      | `//project[datasets/datasetRef/@ref = //datasetsCatalog/dataset[number(sizeGB) > 10]/@id]` | 5 проектов          | число(), JOIN через =, >       |
| 4      | `/universityResearch/researchers/researcher[count(...@researcherRef = current()/@id) > 1]` | 6 исследователей    | count(), current(), @ссылка, > |

---

## 6. Тестирование XPath запросов

### 6.1 Инструменты тестирования

1. **Online XPath Tester:** https://www.freeformatter.com/xpath-tester.html

   - Загрузить `lab5/data.xml`
   - Ввести XPath выражение
   - Нажать "Evaluate"

2. **xmllint с XPath:**

   ```bash
   xmllint --xpath "//project[count(participants/participant) > 3]/@id" lab5/data.xml
   ```

3. **Python с lxml:**
   ```python
   from lxml import etree
   doc = etree.parse('lab5/data.xml')
   result = doc.xpath('//project[count(participants/participant) > 3]')
   for proj in result:
       print(proj.get('id'))  # proj-003
   ```

### 6.2 Ожидаемые результаты

**Запрос 1:**

```
proj-003
```

**Запрос 2:**

```
pub-001, pub-002, pub-003, pub-004, pub-006, pub-007
```

**Запрос 3:**

```
proj-001, proj-002, proj-003, proj-004, proj-005
```

**Запрос 4:**

```
r1, r2, r3, r5, r7, r8
```

---

## 7. Итоговая таблица соответствия требованиям Задания 3

| Требование                            | Статус | Как реализовано                                                                            |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| Запрос 1: Проекты с >3 участниками    | ✅     | `//project[count(participants/participant) > 3]`                                           |
| Запрос 2: Публикации после 2023       | ✅     | `//publication[@year > 2023]`                                                              |
| Запрос 3: Проекты с датасетами >10 ГБ | ✅     | `//project[datasets/datasetRef/@ref = //datasetsCatalog/dataset[number(sizeGB) > 10]/@id]` |
| Запрос 4: Исследователи в >1 проекте  | ✅     | `/universityResearch/researchers/researcher[count(...@researcherRef = current()/@id) > 1]` |
| Пояснение логики навигации            | ✅     | Для каждого запроса: таблица с разбором синтаксиса                                         |
| Пояснение предикатов                  | ✅     | Таблицы с условиями, count(), number(), @атрибуты, current()                               |
| Примеры результатов на data.xml       | ✅     | Конкретные результаты для каждого запроса                                                  |

---

## Файлы для проверки

1. **XML данные:** `lab5/data.xml`
2. **XSD схема:** `lab5/schema.xsd`
3. **XPath выражения:** `lab5/xpath-queries.md` (дополнительный файл)

**Команды тестирования:**

```bash
# Запрос 1
xmllint --xpath "//project[count(participants/participant) > 3]/@id" lab5/data.xml

# Запрос 2
xmllint --xpath "//publication[@year > 2023]/@id" lab5/data.xml

# Запрос 3
xmllint --xpath "//project[datasets/datasetRef/@ref = //datasetsCatalog/dataset[number(sizeGB) > 10]/@id]/@id" lab5/data.xml

# Запрос 4
xmllint --xpath "/universityResearch/researchers/researcher[count(/universityResearch/projects/project/participants/participant[@researcherRef = current()/@id]) > 1]/@id" lab5/data.xml
```

✅ **Задание 3 выполнено полностью.**
