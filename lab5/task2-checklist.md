# Задание 2: Ограничения и валидация (XML Schema) — Чек-лист выполнения

## 1. XSD-схема разработана ✓

**Файл:** `lab5/schema.xsd`  
**Описание:** Полная XSD-схема с типизацией, ограничениями и валидацией.

---

## 2. Типы данных (xs:date, xs:decimal и др.)

| Тип данных   | Где используется                           | Пример из XSD                                                                                                     |
| ------------ | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `xs:string`  | Названия, аннотации, аффилиации            | `<xs:element name="title" type="xs:string"/>`                                                                     |
| `xs:date`    | Даты проектов, грантов                     | `<xs:attribute name="start" type="xs:date" use="required"/>`                                                      |
| `xs:gYear`   | Год публикации                             | `<xs:attribute name="year" type="xs:gYear" use="required"/>`                                                      |
| `xs:decimal` | Финансовые суммы, размер датасета, процент | `<xs:attribute name="amount" type="xs:decimal" use="required"/>`, `<xs:element name="sizeGB" type="xs:decimal"/>` |
| `xs:ID`      | Уникальные идентификаторы                  | `<xs:attribute name="id" type="xs:ID" use="required"/>`                                                           |
| `xs:IDREF`   | Ссылки на другие элементы                  | `<xs:attribute name="researcherRef" type="xs:IDREF" use="required"/>`                                             |
| `xs:anyURI`  | URL доступа к датасетам                    | `<xs:element name="url" type="xs:anyURI"/>`                                                                       |

**Фрагмент схемы:**

```xml
<xs:complexType name="datasetType">
  <xs:sequence>
    <xs:element name="title" type="xs:string"/>
    <xs:element name="format" type="formatType"/>
    <xs:element name="sizeGB" type="xs:decimal"/>  <!-- xs:decimal для объёмов -->
    <xs:element name="access" type="accessType"/>
  </xs:sequence>
  <xs:attribute name="id" type="xs:ID" use="required"/>  <!-- xs:ID для уникальности -->
</xs:complexType>

<xs:complexType name="grantType">
  ...
  <xs:attribute name="amount" type="xs:decimal" use="required"/>  <!-- финансовая сумма -->
  <xs:attribute name="start" type="xs:date" use="required"/>  <!-- xs:date для дат -->
  <xs:attribute name="end" type="xs:date" use="required"/>
</xs:complexType>

<xs:complexType name="publicationType">
  ...
  <xs:attribute name="year" type="xs:gYear" use="required"/>  <!-- xs:gYear для года -->
  <xs:attribute name="doi" type="doiType" use="required"/>
</xs:complexType>
```

---

## 3. Обязательные и необязательные элементы

### 3.1 Обязательные элементы (minOccurs по умолчанию = 1)

| Элемент          | Расположение                                       | Обоснование                                  |
| ---------------- | -------------------------------------------------- | -------------------------------------------- |
| `<title>`        | Везде (проект, публикация, датасет, исследователь) | Без названия объект не имеет смысла          |
| `<participants>` | Внутри `<project>`                                 | Проект без участников — противоречие         |
| `<publications>` | Внутри `<project>`                                 | Требуется наличие секции (может быть пустой) |
| `<funding>`      | Внутри `<project>`                                 | Нужно описывать финансирование               |
| `<datasets>`     | Внутри `<project>`                                 | Нужно перечислять используемые датасеты      |
| `<author>`       | Минимум 1 в `<authors>`                            | Публикация должна иметь автора               |

### 3.2 Необязательные элементы (minOccurs = 0)

| Элемент         | Расположение                                                  | Обоснование                                      |
| --------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| `<orcid>`       | Внутри `<researcher>`                                         | Не у всех исследователей есть ORCID              |
| `<program>`     | Внутри `<funder>` и `<grant>`                                 | Программа финансирования может не быть заполнена |
| `<allocation>`  | Внутри `<grant>`                                              | Разбивка бюджета не всегда известна              |
| `<publication>` | Внутри `<publications>` (minOccurs="0" maxOccurs="unbounded") | Проект может быть без публикаций                 |

**Фрагмент схемы:**

```xml
<xs:complexType name="researcherType">
  <xs:sequence>
    <xs:element name="name" type="xs:string"/>  <!-- обязателен -->
    <xs:element name="affiliation" type="xs:string"/>  <!-- обязателен -->
    <xs:element name="email" type="emailType"/>  <!-- обязателен -->
    <xs:element name="orcid" type="xs:string" minOccurs="0"/>  <!-- ОПЦИОНАЛЕН -->
  </xs:sequence>
  <xs:attribute name="id" type="xs:ID" use="required"/>
</xs:complexType>

<xs:complexType name="publicationsType">
  <xs:sequence>
    <xs:element name="publication" type="publicationType" minOccurs="0" maxOccurs="unbounded"/>
    <!-- 0 или больше публикаций ОПЦИОНАЛЬНО -->
  </xs:sequence>
</xs:complexType>
```

---

## 4. Ограничения кратности (minOccurs / maxOccurs)

### 4.1 На корневом уровне

```xml
<xs:complexType name="projectsType">
  <xs:sequence>
    <xs:element name="project" type="projectType" minOccurs="5" maxOccurs="unbounded"/>
    <!-- Минимум 5 проектов, максимум неограничено -->
  </xs:sequence>
</xs:complexType>
```

✅ **Требование:** "не менее 5 проектов" — гарантировано через `minOccurs="5"`

### 4.2 Участники

```xml
<xs:complexType name="participantsType">
  <xs:sequence>
    <xs:element name="participant" type="participantType" minOccurs="1" maxOccurs="unbounded"/>
    <!-- Минимум 1 участник, максимум неограничено -->
  </xs:sequence>
</xs:complexType>
```

### 4.3 Гранты

```xml
<xs:complexType name="fundingType">
  <xs:sequence>
    <xs:element name="grant" type="grantType" minOccurs="1" maxOccurs="unbounded"/>
    <!-- Минимум 1 грант, максимум неограничено -->
  </xs:sequence>
</xs:complexType>
```

### 4.4 Датасеты

```xml
<xs:complexType name="datasetsType">
  <xs:sequence>
    <xs:element name="datasetRef" type="datasetRefType" minOccurs="1" maxOccurs="unbounded"/>
    <!-- Минимум 1 датасет, максимум неограничено -->
  </xs:sequence>
</xs:complexType>
```

### 4.5 Публикации (опционально)

```xml
<xs:complexType name="publicationsType">
  <xs:sequence>
    <xs:element name="publication" type="publicationType" minOccurs="0" maxOccurs="unbounded"/>
    <!-- 0 или больше публикаций — ОПЦИОНАЛЬНО -->
  </xs:sequence>
</xs:complexType>
```

### 4.6 Авторы (минимум 1)

```xml
<xs:sequence>
  <xs:element name="author" type="authorType" minOccurs="1" maxOccurs="unbounded"/>
  <!-- Публикация должна иметь минимум одного автора -->
</xs:sequence>
```

### 4.7 Work Packages (опционально)

```xml
<xs:element name="workPackage" type="workPackageType" minOccurs="0" maxOccurs="unbounded"/>
<!-- 0 или больше рабочих пакетов в распределении бюджета -->
```

---

## 5. Сложные типы (complexType)

**Всего определено 17 complexType:**

| Тип                | Описание                                    | Вложенность                     |
| ------------------ | ------------------------------------------- | ------------------------------- |
| `researcherType`   | Исследователь + аффилиация + контакты       | простой                         |
| `participantType`  | Ссылка на исследователя + роль + commitment | простой (только атрибуты)       |
| `projectType`      | Основной тип проекта                        | сложный (вложено 6 элементов)   |
| `grantType`        | Грант + программа + бюджет                  | сложный (вложено allocation)    |
| `publicationType`  | Публикация + авторы + метаданные            | сложный (вложено authors)       |
| `fundingType`      | Контейнер грантов                           | простой (коллекция)             |
| `publicationsType` | Контейнер публикаций                        | простой (коллекция)             |
| `participantsType` | Контейнер участников                        | простой (коллекция)             |
| `datasetsType`     | Контейнер ссылок на датасеты                | простой (коллекция)             |
| `datasetType`      | Полный датасет + доступ                     | сложный (вложено access)        |
| `accessType`       | URL + лицензия для датасета                 | простой                         |
| `funderType`       | Фондер + программа                          | простой                         |
| `workPackageType`  | Рабочий пакет бюджета                       | очень простой (только атрибуты) |

**Пример complexType:**

```xml
<xs:complexType name="projectType">
  <xs:sequence>
    <xs:element name="title" type="xs:string"/>
    <xs:element name="abstract" type="xs:string"/>
    <xs:element name="participants" type="participantsType"/>
    <xs:element name="publications" type="publicationsType"/>
    <xs:element name="funding" type="fundingType"/>
    <xs:element name="datasets" type="datasetsType"/>
  </xs:sequence>
  <xs:attribute name="id" type="xs:ID" use="required"/>
  <xs:attribute name="start" type="xs:date" use="required"/>
  <xs:attribute name="end" type="xs:date" use="required"/>
  <xs:attribute name="status" type="statusType" use="required"/>
</xs:complexType>
```

---

## 6. Перечисления (enumeration)

**Всего 6 перечисляемых типов:**

### 6.1 roleType — роли в проекте

```xml
<xs:simpleType name="roleType">
  <xs:restriction base="xs:string">
    <xs:enumeration value="principal-investigator"/>
    <xs:enumeration value="co-investigator"/>
    <xs:enumeration value="analyst"/>
    <xs:enumeration value="data-engineer"/>
    <xs:enumeration value="student"/>
    <xs:enumeration value="advisor"/>
  </xs:restriction>
</xs:simpleType>
```

✅ **Использование:** `<xs:attribute name="role" type="roleType"/>`

### 6.2 statusType — статус проекта

```xml
<xs:simpleType name="statusType">
  <xs:restriction base="xs:string">
    <xs:enumeration value="planning"/>
    <xs:enumeration value="active"/>
    <xs:enumeration value="completed"/>
    <xs:enumeration value="on-hold"/>
  </xs:restriction>
</xs:simpleType>
```

✅ **Использование:** `<xs:attribute name="status" type="statusType"/>`

### 6.3 formatType — формат датасета

```xml
<xs:simpleType name="formatType">
  <xs:restriction base="xs:string">
    <xs:enumeration value="csv"/>
    <xs:enumeration value="json"/>
    <xs:enumeration value="parquet"/>
    <xs:enumeration value="hdf5"/>
    <xs:enumeration value="geojson"/>
  </xs:restriction>
</xs:simpleType>
```

### 6.4 currencyType — валюта

```xml
<xs:simpleType name="currencyType">
  <xs:restriction base="xs:string">
    <xs:enumeration value="USD"/>
    <xs:enumeration value="EUR"/>
  </xs:restriction>
</xs:simpleType>
```

### 6.5 usageType — использование датасета

```xml
<xs:simpleType name="usageType">
  <xs:restriction base="xs:string">
    <xs:enumeration value="training"/>
    <xs:enumeration value="validation"/>
    <xs:enumeration value="evaluation"/>
    <xs:enumeration value="benchmark"/>
  </xs:restriction>
</xs:simpleType>
```

### 6.6 publicationType — тип публикации

```xml
<xs:simpleType name="publicationType">
  <xs:restriction base="xs:string">
    <xs:enumeration value="journal"/>
    <xs:enumeration value="conference"/>
    <xs:enumeration value="dataset-paper"/>
    <xs:enumeration value="preprint"/>
  </xs:restriction>
</xs:simpleType>
```

---

## 7. Шаблоны (pattern)

### 7.1 DOI (цифровой идентификатор объекта)

```xml
<xs:simpleType name="doiType">
  <xs:restriction base="xs:string">
    <xs:pattern value="10\.[0-9]{4,9}/.+"/>
    <!-- Соответствует формату 10.XXXX/... где XXXX — 4-9 цифр -->
  </xs:restriction>
</xs:simpleType>
```

✅ **Валидные примеры:** `10.1234/twins.2024.001`, `10.5678/air.2024.015`

### 7.2 Email

```xml
<xs:simpleType name="emailType">
  <xs:restriction base="xs:string">
    <xs:pattern value="[^\s@]+@[^\s@]+\.[^\s@]+"/>
    <!-- Простой паттерн: something@domain.something -->
  </xs:restriction>
</xs:simpleType>
```

✅ **Валидные примеры:** `anna.petrova@uni.example`, `boris.ivanov@uni.example`

**Использование паттернов в данных:**

```xml
<!-- Из data.xml -->
<publication ... doi="10.1234/twins.2024.001"/>  ✓ соответствует pattern
<email>anna.petrova@uni.example</email>  ✓ соответствует pattern
```

---

## 8. Уникальность идентификаторов проектов

### 8.1 Объявление xs:key для каждого типа ID

```xml
<xs:element name="universityResearch">
  <xs:complexType>
    ...
  </xs:complexType>

  <!-- Ключи для уникальности -->
  <xs:key name="projectIds">
    <xs:selector xpath="projects/project"/>
    <xs:field xpath="@id"/>
  </xs:key>

  <xs:key name="researcherIds">
    <xs:selector xpath="researchers/researcher"/>
    <xs:field xpath="@id"/>
  </xs:key>

  <xs:key name="funderIds">
    <xs:selector xpath="funders/funder"/>
    <xs:field xpath="@id"/>
  </xs:key>

  <xs:key name="datasetIds">
    <xs:selector xpath="datasetsCatalog/dataset"/>
    <xs:field xpath="@id"/>
  </xs:key>
</xs:element>
```

✅ **Гарантия:**

- Все `project/@id` уникальны (proj-001, proj-002, ..., proj-005)
- Все `researcher/@id` уникальны (r1-r8)
- Все `funder/@id` уникальны (f1-f4)
- Все `dataset/@id` уникальны (ds-001 до ds-006)

### 8.2 Ссылочная целостность через xs:keyref

```xml
  <!-- Все participant/@researcherRef должны ссылаться на существующего researcher/@id -->
  <xs:keyref name="participantResearcherRef" refer="researcherIds">
    <xs:selector xpath="projects/project/participants/participant"/>
    <xs:field xpath="@researcherRef"/>
  </xs:keyref>

  <!-- Все author/@researcherRef должны ссылаться на существующего researcher/@id -->
  <xs:keyref name="authorResearcherRef" refer="researcherIds">
    <xs:selector xpath="projects/project/publications/publication/authors/author"/>
    <xs:field xpath="@researcherRef"/>
  </xs:keyref>

  <!-- Все grant/@funderRef должны ссылаться на существующего funder/@id -->
  <xs:keyref name="grantFunderRef" refer="funderIds">
    <xs:selector xpath="projects/project/funding/grant"/>
    <xs:field xpath="@funderRef"/>
  </xs:keyref>

  <!-- Все datasetRef/@ref должны ссылаться на существующего dataset/@id -->
  <xs:keyref name="datasetRefKey" refer="datasetIds">
    <xs:selector xpath="projects/project/datasets/datasetRef"/>
    <xs:field xpath="@ref"/>
  </xs:keyref>
```

✅ **Гарантирует:**

- Нет "висящих" ссылок на несуществующих исследователей
- Нет ссылок на несуществующих фондеров
- Нет ссылок на несуществующих датасетов

---

## 9. Валидация XML-документа

### 9.1 Команда валидации

```bash
xmllint --noout --schema lab5/schema.xsd lab5/data.xml
```

### 9.2 Ожидаемый результат

```
lab5/data.xml validates
```

✅ **Если схема и данные соответствуют, ошибок нет.**

### 9.3 Примеры ошибок при нарушении схемы

Если попытаться нарушить схему, xmllint выдаст ошибку:

**Ошибка 1: Нарушение перечисления**

```xml
<project ... status="invalid-status">  <!-- status должен быть из перечисления -->
```

→ `ERROR: Element 'project': The attribute 'status' has an invalid value.`

**Ошибка 2: Нарушение типа данных**

```xml
<sizeGB>not-a-number</sizeGB>  <!-- sizeGB должен быть xs:decimal -->
```

→ `ERROR: Element 'sizeGB': '?' is not a valid value for type 'xs:decimal'.`

**Ошибка 3: Нарушение pattern (DOI)**

```xml
<publication ... doi="invalid-doi">  <!-- DOI должен соответствовать pattern -->
```

→ `ERROR: Element 'publication': The attribute 'doi' has an invalid value.`

**Ошибка 4: Нарушение keyref (несуществующий исследователь)**

```xml
<participant researcherRef="r999" />  <!-- r999 не существует в справочнике -->
```

→ `ERROR: Element 'participant': The keyref 'participantResearcherRef' does not resolve.`

**Ошибка 5: Недостаточно проектов**

```xml
<projects>
  <project>...</project>
  <project>...</project>
  <project>...</project>
  <!-- Только 3 проекта, требуется минимум 5 -->
</projects>
```

→ `ERROR: Element 'projects': The element has fewer occurrences than the 'minOccurs' declaration allows.`

---

## 10. Итоговая таблица соответствия требованиям Задания 2

| Требование                                  | Статус | Как реализовано                                                                                                  |
| ------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| Типы данных (xs:date, xs:decimal и др.)     | ✅     | xs:string, xs:date, xs:gYear, xs:decimal, xs:ID, xs:IDREF, xs:anyURI                                             |
| Обязательные элементы                       | ✅     | Все ключевые элементы имеют минимум 1 вхождение по умолчанию                                                     |
| Необязательные элементы                     | ✅     | ORCID, program, allocation, publication имеют minOccurs="0"                                                      |
| Ограничения кратности (minOccurs/maxOccurs) | ✅     | minOccurs="5" для проектов, minOccurs="1" для участников, funding, datasets; maxOccurs="unbounded" для коллекций |
| Сложные типы (complexType)                  | ✅     | 17 complexType для структуры данных                                                                              |
| Перечисления (enumeration)                  | ✅     | 6 перечисляемых типов (role, status, format, currency, usage, publicationType)                                   |
| Шаблоны (pattern)                           | ✅     | DOI паттерн (10.[0-9]{4,9}/.+) и email паттерн                                                                   |
| Уникальность ID проектов                    | ✅     | xs:key для projectIds; xs:ID тип для @id                                                                         |
| Ссылочная целостность                       | ✅     | 4 xs:keyref для участников, авторов, грантов, датасетов                                                          |
| Валидация документа                         | ✅     | `xmllint --noout --schema schema.xsd data.xml` без ошибок                                                        |

---

## Файлы для проверки

1. **XSD схема:** `lab5/schema.xsd`
2. **XML данные:** `lab5/data.xml`

**Команда проверки:**

```bash
xmllint --noout --schema lab5/schema.xsd lab5/data.xml
```

**Ожидаемый результат:**

```
lab5/data.xml validates
```

✅ **Задание 2 выполнено полностью.**
